import { setsEqual } from '../../../../helpers/util';
import { RenderGeometry } from '../../../layout/geometry/types';
import { squareOf, toAlgebraic } from '../../../state/board/coords';
import { decodePiece } from '../../../state/board/encode';
import { Square } from '../../../state/board/types';
import { DirtyLayer } from '../../invalidation/types';
import { cburnettPieceUrl } from '../assets';
import {
	clearElementChildren,
	createSvgImage,
	createSvgRect,
	createSvgText,
	isLightSquare,
	updateElementAttributes
} from '../helpers';
import { collectChangedPieceSquares } from './helpers';
import {
	RendererBoardFrameSnapshot,
	RendererBoardRenderContext,
	RendererConfigColorPair,
	SvgRendererBoardInternals,
	SvgRendererBoardPieceNode
} from './types';

export function renderBoard(
	state: SvgRendererBoardInternals,
	context: RendererBoardRenderContext
): void {
	const { previous, current, invalidation } = context;
	const prevSuppressedSquares = previous?.suppressedSquares ?? new Set<Square>();
	const currSuppressedSquares = current.suppressedSquares;
	// Check if we need to re-render
	const suppressionChanged = !setsEqual(currSuppressedSquares, prevSuppressedSquares);
	const needRender = [invalidation.layers != 0, suppressionChanged].some(Boolean);
	if (!needRender) return; // no-op

	// Decide what to update on layers bitmask
	const layers = invalidation.layers;
	if (layers & DirtyLayer.Board) {
		drawBoard(state.root, state.config.board, current.geometry);
		drawCoords(state.coords, state.config.coords, current.geometry);
	}
	// Update pieces if either:
	// - normal invalidation requests it
	// - OR suppression changed
	if (layers & DirtyLayer.Pieces || suppressionChanged) {
		drawPieces(state.pieces, previous, current, state.pieceNodes);
	}
}

function drawBoard(
	boardRoot: SVGGElement,
	colors: RendererConfigColorPair,
	geometry: RenderGeometry
) {
	const layer = boardRoot;
	clearElementChildren(layer);

	const { light, dark } = colors;

	for (let sq = 0 as Square; sq < 64; sq++) {
		const r = geometry.squareRect(sq);
		const rect = createSvgRect(layer.ownerDocument, {
			'data-chessboard-id': `square-${sq}`,
			x: r.x.toString(),
			y: r.y.toString(),
			width: r.size.toString(),
			height: r.size.toString(),
			fill: isLightSquare(sq) ? light : dark,
			'shape-rendering': 'crispEdges'
		});
		layer.appendChild(rect);
	}
}

function labelColorForSquare(colors: RendererConfigColorPair, sq: Square): string {
	return isLightSquare(sq) ? colors.dark : colors.light;
}

function drawCoords(
	coordsRoot: SVGGElement,
	colors: RendererConfigColorPair,
	geometry: RenderGeometry
) {
	const layer = coordsRoot;
	clearElementChildren(layer);

	const orientation = geometry.orientation;
	const fontSize = geometry.squareSize * 0.12;
	const offset = 3;

	// Rank labels on visual left edge
	const rankFile = orientation === 'white' ? 0 : 7;
	for (let visualRank = 0; visualRank < 8; visualRank++) {
		const logicalRank = orientation === 'white' ? 7 - visualRank : visualRank;
		const sq = squareOf(rankFile, logicalRank);
		const label = orientation === 'white' ? String(8 - visualRank) : String(1 + visualRank);

		const r = geometry.squareRect(sq);
		const color = labelColorForSquare(colors, sq);

		const text = createSvgText(layer.ownerDocument, label, {
			'data-chessboard-id': `coord-rank-${logicalRank}`,
			x: (r.x + offset).toString(),
			y: (r.y + offset).toString(),
			'font-size': fontSize.toString(),
			'font-family': 'sans-serif',
			'font-weight': 'bold',
			fill: color,
			'text-anchor': 'start',
			'dominant-baseline': 'hanging',
			'data-square': toAlgebraic(sq)
		});
		layer.appendChild(text);
	}

	// File labels on visual bottom edge
	const fileRank = orientation === 'white' ? 0 : 7;
	for (let visualFile = 0; visualFile < 8; visualFile++) {
		const logicalFile = orientation === 'white' ? visualFile : 7 - visualFile;
		const sq = squareOf(logicalFile, fileRank);
		const label =
			orientation === 'white'
				? String.fromCharCode('a'.charCodeAt(0) + visualFile)
				: String.fromCharCode('h'.charCodeAt(0) - visualFile);

		const r = geometry.squareRect(sq);
		const color = labelColorForSquare(colors, sq);

		const text = createSvgText(layer.ownerDocument, label, {
			'data-chessboard-id': `coord-file-${logicalFile}`,
			x: (r.x + r.size - offset).toString(),
			y: (r.y + r.size - offset).toString(),
			'font-size': fontSize.toString(),
			'font-family': 'sans-serif',
			'font-weight': 'bold',
			fill: color,
			'text-anchor': 'end',
			'dominant-baseline': 'auto',
			'data-square': toAlgebraic(sq)
		});

		layer.appendChild(text);
	}
}

function drawPieces(
	piecesRoot: SVGGElement,
	previous: RendererBoardFrameSnapshot | null,
	current: RendererBoardFrameSnapshot,
	pieceNodes: Map<Square, SvgRendererBoardPieceNode>
) {
	const layer = piecesRoot;

	const geometryChanged =
		current.geometry.boardSize !== previous?.geometry.boardSize ||
		current.geometry.orientation !== previous?.geometry.orientation;

	let changedSquares: Set<Square>;
	if (geometryChanged) {
		changedSquares = new Set<Square>();
		for (let sq = 0 as Square; sq < 64; sq++) {
			if (current.board.pieces[sq] !== 0 || pieceNodes.has(sq)) {
				changedSquares.add(sq);
			}
		}
	} else {
		changedSquares = collectChangedPieceSquares(previous, current);
	}
	for (const sq of changedSquares) {
		const currCode = current.board.pieces[sq];
		const piece = decodePiece(currCode);
		const currSuppressed = current.suppressedSquares.has(sq);
		let node = pieceNodes.get(sq);

		if (piece === null) {
			if (node !== undefined) {
				// Piece disappeared, remove node
				node.root.remove();
				pieceNodes.delete(sq);
			}
			continue;
		}

		if (node === undefined) {
			// New piece appeared, create node
			const img = createSvgImage(layer.ownerDocument, {
				'data-chessboard-id': `renderer-board-piece-${sq}`,
				'data-square': toAlgebraic(sq)
			});
			node = { root: img };
			pieceNodes.set(sq, node);
		}

		const pieceRect = current.geometry.squareRect(sq);
		const pieceUrl = cburnettPieceUrl(piece.color, piece.role);

		updateElementAttributes(node.root, {
			x: pieceRect.x.toString(),
			y: pieceRect.y.toString(),
			width: pieceRect.size.toString(),
			height: pieceRect.size.toString(),
			href: pieceUrl,
			'data-suppressed': currSuppressed.toString()
		});

		if (!currSuppressed) {
			if (node.root.parentNode !== layer) {
				layer.appendChild(node.root);
			}
		} else {
			if (node.root.parentNode === layer) {
				layer.removeChild(node.root);
			}
		}
	}
}
