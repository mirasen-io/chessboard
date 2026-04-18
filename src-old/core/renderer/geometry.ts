import type { Color, Square } from '../state/boardTypes';
import { fileOf, rankOf } from '../state/coords';
import type { RenderGeometry } from './types';

/**
 * Create RenderGeometry for a given board size (in px) and orientation.
 * - Geometry uses an SVG-local coordinate system with origin at top-left.
 * - Orientation mapping:
 *   - 'white': files increase left→right (a..h), ranks increase bottom→top (1..8).
 *              yIndex = 7 - rank, xIndex = file
 *   - 'black': files increase right→left (a..h), ranks increase top→bottom (1..8).
 *              yIndex = rank, xIndex = 7 - file
 */
export function makeRenderGeometry(boardSize: number, orientation: Color): RenderGeometry {
	if (!(boardSize > 0 && Number.isFinite(boardSize))) {
		throw new RangeError(`Invalid boardSize: ${boardSize}`);
	}
	const squareSize = boardSize / 8;

	const white = orientation === 'white';

	const squareRect = (sq: Square) => {
		const f = fileOf(sq);
		const r = rankOf(sq);
		const xIndex = white ? f : 7 - f;
		const yIndex = white ? 7 - r : r;
		return {
			x: xIndex * squareSize,
			y: yIndex * squareSize,
			size: squareSize
		};
	};

	return {
		boardSize,
		squareSize,
		orientation,
		squareRect
	};
}

/**
 * Helper to compute light/dark square parity.
 * Returns true for light squares, false for dark.
 * Convention: a1 is dark in many sets; here we follow theming from state (renderer decides).
 * If you need the classic pattern where a1 is dark, use: (file + rank) % 2 === 1
 */
export function isLightSquare(sq: Square): boolean {
	const f = fileOf(sq);
	const r = rankOf(sq);
	return ((f + r) & 1) === 1;
}
