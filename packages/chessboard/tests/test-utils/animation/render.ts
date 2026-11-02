import type { PieceHrefResolver } from '../../../src/animation/render/types.js';
import type { PieceUrls } from '../../../src/extensions/first-party/main-renderer/types/internal.js';
import type { RectSnapshot, SceneRenderGeometry } from '../../../src/layout/geometry/types.js';
import { SVG_NS } from '../../../src/render/svg/helpers.js';
import { fileOf, rankOf } from '../../../src/state/board/coords.js';
import {
	ColorCode,
	type NonEmptyPieceCode,
	PieceCode,
	type Square
} from '../../../src/state/board/types/internal.js';

/**
 * Creates an SVG <g> element suitable as the animation layer parent.
 * Requires jsdom environment (vitest default).
 */
export function createSvgLayer(): SVGGElement {
	const svg = document.createElementNS(SVG_NS, 'svg');
	document.body.appendChild(svg);
	const layer = document.createElementNS(SVG_NS, 'g');
	svg.appendChild(layer);
	return layer;
}

/**
 * Creates a mock SceneRenderGeometry with deterministic square rects.
 * White orientation: file 0 rank 0 (a1) is bottom-left.
 * Each square is `squareSize × squareSize`, board starts at (0, 0).
 */
export function createMockGeometry(squareSize: number = 50): SceneRenderGeometry {
	const boardSize = squareSize * 8;
	return {
		sceneSize: { width: boardSize, height: boardSize },
		boardRect: { x: 0, y: 0, width: boardSize, height: boardSize },
		squareSize,
		orientation: ColorCode.White,
		getSquareRect(sq: Square): RectSnapshot {
			const file = fileOf(sq);
			const rank = rankOf(sq);
			// White orientation: rank 0 at bottom (y = 7 * squareSize), rank 7 at top (y = 0)
			const x = file * squareSize;
			const y = (7 - rank) * squareSize;
			return { x, y, width: squareSize, height: squareSize };
		}
	};
}

/**
 * Creates a complete PieceUrls mapping for all NonEmptyPieceCode values.
 * Uses deterministic placeholder URLs.
 */
export function createMockPieceUrls(): PieceUrls {
	return {
		[PieceCode.WhitePawn]: 'http://test/wP.svg',
		[PieceCode.WhiteKnight]: 'http://test/wN.svg',
		[PieceCode.WhiteBishop]: 'http://test/wB.svg',
		[PieceCode.WhiteRook]: 'http://test/wR.svg',
		[PieceCode.WhiteQueen]: 'http://test/wQ.svg',
		[PieceCode.WhiteKing]: 'http://test/wK.svg',
		[PieceCode.BlackPawn]: 'http://test/bP.svg',
		[PieceCode.BlackKnight]: 'http://test/bN.svg',
		[PieceCode.BlackBishop]: 'http://test/bB.svg',
		[PieceCode.BlackRook]: 'http://test/bR.svg',
		[PieceCode.BlackQueen]: 'http://test/bQ.svg',
		[PieceCode.BlackKing]: 'http://test/bK.svg'
	} as PieceUrls;
}

/**
 * Creates a mock PieceHrefResolver that returns deterministic symbol hrefs.
 * Pattern: #test-p{pieceCode}
 */
export function createMockPieceHrefResolver(): PieceHrefResolver {
	return (pieceCode: NonEmptyPieceCode) => `#test-p${pieceCode}`;
}
