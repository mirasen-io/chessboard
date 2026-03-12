import { PartialDeep } from 'type-fest';
import { DirtyLayer } from '../..';
import type { InvalidationStateSnapshot } from '../scheduler/types';
import type { BoardStateSnapshot, Color, Square } from '../state/boardTypes';
import { squareOf, toAlgebraic } from '../state/coords';
import { decodePiece } from '../state/encode';
import { cburnettPieceUrl } from './assets';
import { isLightSquare } from './geometry';
import type { RenderConfig, Renderer, RenderGeometry } from './types';
import { DEFAULT_RENDER_CONFIG } from './types';

const SVG_NS = 'http://www.w3.org/2000/svg';

type SvgRendererOptions = {
	/** Optional renderer visual configuration. */
	config?: PartialDeep<RenderConfig>;
};

type PieceNodeRecord = {
	root: SVGImageElement; // per-piece <image> — locally bounded piece node
};

/**
 * Minimal SVG renderer with invalidation awareness.
 * Structure (ownership-based roots/slots):
 *  1) defsStatic
 *  2) boardRoot
 *  3) coordsRoot
 *  4) extensionsUnderPiecesRoot
 *  5) piecesRoot
 *  6) extensionsOverPiecesRoot
 *  7) extensionsDragUnderRoot
 *  8) dragRoot
 *  9) extensionsDragOverRoot
 * 10) defsDynamic
 *
 * Notes:
 * - Legacy highlight/overlay groups were removed.
 * - Pieces render into piecesRoot as per-piece <image> elements (one per stable piece id).
 * - defsDynamic is reserved for future extension use; piece rendering does not use it.
 */
export class SvgRenderer implements Renderer {
	private svgRoot: SVGSVGElement | null = null;

	// Core-owned roots
	private boardRoot!: SVGGElement;
	private coordsRoot!: SVGGElement;
	private piecesRoot!: SVGGElement;
	private dragRoot!: SVGGElement;

	// Reserved extension slots
	private extensionsUnderPiecesRoot!: SVGGElement;
	private extensionsOverPiecesRoot!: SVGGElement;
	private extensionsDragUnderRoot!: SVGGElement;
	private extensionsDragOverRoot!: SVGGElement;

	// Defs containers
	private defsStatic!: SVGDefsElement; // persistent defs (markers, etc.)
	private defsDynamic!: SVGDefsElement; // reserved for future extension use

	private config: RenderConfig;

	// Incremental piece DOM cache keyed by stable piece id from state.ids
	private pieceNodes: Map<number, PieceNodeRecord> = new Map();

	constructor(opts: SvgRendererOptions = {}) {
		this.config = {
			...DEFAULT_RENDER_CONFIG,
			...(opts.config ?? {}),
			coords: {
				...DEFAULT_RENDER_CONFIG.coords!,
				...(opts.config?.coords ?? {})
			}
		};
	}

	mount(container: HTMLElement): void {
		if (this.svgRoot) this.unmount();

		const svg = document.createElementNS(SVG_NS, 'svg');
		svg.setAttribute('xmlns', SVG_NS);
		svg.setAttribute('fill', 'none');
		svg.setAttribute('stroke', 'none');

		// Containers and roots/slots
		const defsStatic = document.createElementNS(SVG_NS, 'defs');

		const boardRoot = document.createElementNS(SVG_NS, 'g');
		const coordsRoot = document.createElementNS(SVG_NS, 'g');

		const extensionsUnderPiecesRoot = document.createElementNS(SVG_NS, 'g');
		const piecesRoot = document.createElementNS(SVG_NS, 'g');
		const extensionsOverPiecesRoot = document.createElementNS(SVG_NS, 'g');

		const extensionsDragUnderRoot = document.createElementNS(SVG_NS, 'g');
		const dragRoot = document.createElementNS(SVG_NS, 'g');
		const extensionsDragOverRoot = document.createElementNS(SVG_NS, 'g');

		const defsDynamic = document.createElementNS(SVG_NS, 'defs');

		// Append in the required order
		svg.appendChild(defsStatic);
		svg.appendChild(boardRoot);
		svg.appendChild(coordsRoot);
		svg.appendChild(extensionsUnderPiecesRoot);
		svg.appendChild(piecesRoot);
		svg.appendChild(extensionsOverPiecesRoot);
		svg.appendChild(extensionsDragUnderRoot);
		svg.appendChild(dragRoot);
		svg.appendChild(extensionsDragOverRoot);
		svg.appendChild(defsDynamic);

		// Assign fields
		this.svgRoot = svg;

		this.boardRoot = boardRoot;
		this.coordsRoot = coordsRoot;
		this.piecesRoot = piecesRoot;
		this.dragRoot = dragRoot;

		this.extensionsUnderPiecesRoot = extensionsUnderPiecesRoot;
		this.extensionsOverPiecesRoot = extensionsOverPiecesRoot;
		this.extensionsDragUnderRoot = extensionsDragUnderRoot;
		this.extensionsDragOverRoot = extensionsDragOverRoot;

		this.defsStatic = defsStatic;
		this.defsDynamic = defsDynamic;

		container.appendChild(svg);
	}

	unmount(): void {
		if (this.svgRoot && this.svgRoot.parentNode) {
			this.svgRoot.parentNode.removeChild(this.svgRoot);
		}
		this.svgRoot = null!;
		// Do not clear caches here; a future mount will recreate DOM afresh
		this.pieceNodes.clear();
	}

	render(
		board: BoardStateSnapshot,
		invalidation: InvalidationStateSnapshot,
		geometry: RenderGeometry
	): void {
		if (!this.svgRoot) throw new Error('SvgRenderer: Cannot render before mount()');

		// Ensure size/viewBox matches geometry
		const size = String(geometry.boardSize);
		this.svgRoot.setAttribute('width', size);
		this.svgRoot.setAttribute('height', size);
		this.svgRoot.setAttribute('viewBox', `0 0 ${size} ${size}`);

		// Decide what to update based on layers bitmask
		const layers = invalidation.layers;
		if (layers & DirtyLayer.Board) {
			this.drawBoard(this.config.light, this.config.dark, geometry);
			this.drawCoords(geometry.orientation, geometry);
		}
		if (layers & DirtyLayer.Pieces) this.drawPieces(board, geometry);
	}

	private clear(node: Element) {
		while (node.firstChild) node.removeChild(node.firstChild);
	}

	private drawBoard(light: string, dark: string, g: RenderGeometry) {
		const layer = this.boardRoot;
		this.clear(layer);

		for (let sq = 0 as Square; sq < 64; sq++) {
			const r = g.squareRect(sq);
			const rect = document.createElementNS(SVG_NS, 'rect');
			rect.setAttribute('x', r.x.toString());
			rect.setAttribute('y', r.y.toString());
			rect.setAttribute('width', r.size.toString());
			rect.setAttribute('height', r.size.toString());
			rect.setAttribute('fill', isLightSquare(sq) ? light : dark);
			rect.setAttribute('shape-rendering', 'crispEdges');
			layer.appendChild(rect);
		}
	}

	private labelColorForSquare(sq: Square): string {
		// Dark label on the light square and light label on the dark square
		return isLightSquare(sq)
			? (this.config.coords?.dark ?? this.config.dark)
			: (this.config.coords?.light ?? this.config.light);
	}

	/**
	 * Render board coordinates (rank/file labels) inside edge squares.
	 * - Rank labels on visual left edge (top-left corner of squares)
	 * - File labels on visual bottom edge (bottom-right corner of squares)
	 * - Uses square-contrast coloring by default, or explicit config.coords if provided
	 */
	private drawCoords(orientation: Color, g: RenderGeometry) {
		const layer = this.coordsRoot;
		this.clear(layer);

		const fontSize = g.squareSize * 0.12;
		const offset = 3; // px offset from square edges

		// Rank labels on visual left edge
		const rankFile = orientation === 'white' ? 0 : 7;
		for (let visualRank = 0; visualRank < 8; visualRank++) {
			const logicalRank = orientation === 'white' ? 7 - visualRank : visualRank;
			const sq = squareOf(rankFile, logicalRank);
			const label = orientation === 'white' ? String(8 - visualRank) : String(1 + visualRank);

			const r = g.squareRect(sq);
			const color = this.labelColorForSquare(sq);

			const text = document.createElementNS(SVG_NS, 'text');
			text.setAttribute('x', (r.x + offset).toString());
			text.setAttribute('y', (r.y + offset).toString());
			text.setAttribute('font-size', fontSize.toString());
			text.setAttribute('font-family', 'sans-serif');
			text.setAttribute('font-weight', 'bold');
			text.setAttribute('fill', color);
			text.setAttribute('text-anchor', 'start');
			text.setAttribute('dominant-baseline', 'hanging');
			text.setAttribute('data-square', toAlgebraic(sq));
			text.textContent = label;
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

			const r = g.squareRect(sq);
			const color = this.labelColorForSquare(sq);

			const text = document.createElementNS(SVG_NS, 'text');
			text.setAttribute('x', (r.x + r.size - offset).toString());
			text.setAttribute('y', (r.y + r.size - offset).toString());
			text.setAttribute('font-size', fontSize.toString());
			text.setAttribute('font-family', 'sans-serif');
			text.setAttribute('font-weight', 'bold');
			text.setAttribute('fill', color);
			text.setAttribute('text-anchor', 'end');
			text.setAttribute('dominant-baseline', 'auto');
			text.setAttribute('data-square', toAlgebraic(sq));
			text.textContent = label;
			layer.appendChild(text);
		}
	}

	/**
	 * Incremental piece rendering using stable piece ids (state.ids).
	 * - Updates existing nodes for moved/promoted pieces.
	 * - Creates nodes only for new piece ids.
	 * - Removes nodes whose piece ids disappeared.
	 * - Each piece is a single <image> element sized to the square, referencing its own SVG asset.
	 * - defsDynamic is not used; no per-piece clipPaths are created.
	 */
	private drawPieces(board: BoardStateSnapshot, g: RenderGeometry) {
		const layer = this.piecesRoot;
		this.clear(layer);
		// defsDynamic is not used for piece rendering; do not clear or write it here.

		const seenIds = new Set<number>();

		for (let sq = 0 as Square; sq < 64; sq++) {
			const code = board.pieces[sq];
			const piece = decodePiece(code);
			if (!piece) continue;

			const id = board.ids[sq] ?? -1;
			if (id <= 0) continue;

			const r = g.squareRect(sq);
			const pieceUrl = cburnettPieceUrl(piece.color, piece.role);

			let rec = this.pieceNodes.get(id);
			if (rec) {
				// Update position, size, and asset URL (handles moves and promotions)
				rec.root.setAttribute('x', r.x.toString());
				rec.root.setAttribute('y', r.y.toString());
				rec.root.setAttribute('width', r.size.toString());
				rec.root.setAttribute('height', r.size.toString());
				rec.root.setAttributeNS('http://www.w3.org/1999/xlink', 'href', pieceUrl);
				rec.root.setAttribute('href', pieceUrl);

				// Ensure it's present in the current layer (if DOM moved elsewhere)
				if (rec.root.parentNode !== layer) {
					layer.appendChild(rec.root);
				}
			} else {
				// Create a locally-bounded per-piece <image> element
				const img = document.createElementNS(SVG_NS, 'image');
				img.setAttribute('x', r.x.toString());
				img.setAttribute('y', r.y.toString());
				img.setAttribute('width', r.size.toString());
				img.setAttribute('height', r.size.toString());
				img.setAttributeNS('http://www.w3.org/1999/xlink', 'href', pieceUrl);
				img.setAttribute('href', pieceUrl);

				layer.appendChild(img);
				rec = { root: img };
				this.pieceNodes.set(id, rec);
			}

			seenIds.add(id);
		}

		// Sweep: remove nodes for ids that disappeared
		for (const [pid, rec] of this.pieceNodes.entries()) {
			if (!seenIds.has(pid)) {
				if (rec.root.parentNode) rec.root.parentNode.removeChild(rec.root);
				this.pieceNodes.delete(pid);
			}
		}
	}
}
