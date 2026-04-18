import type { RenderGeometry } from '../renderer/types';
import type { Square } from '../state/boardTypes';

/**
 * Phase 3.4 — input-layer square mapping.
 *
 * Maps a board-local pointer coordinate to a square index, or null if the
 * point is outside the board or not a finite number.
 *
 * Coordinate contract:
 *   - (x, y) must already be in the board-local SVG space: origin at the
 *     top-left corner of the board, x increases right, y increases down.
 *   - No DOM math, no event listeners, no pointer capture — pure geometry.
 *
 * Orientation:
 *   - 'white': top-left = a8, bottom-right = h1
 *   - 'black': top-left = h1, bottom-right = a8
 *
 * Returns null when:
 *   - x or y is not finite (NaN, ±Infinity)
 *   - the point is outside [0, boardSize) on either axis
 */
export function mapBoardPointToSquare(
	x: number,
	y: number,
	geometry: RenderGeometry
): Square | null {
	if (!Number.isFinite(x) || !Number.isFinite(y)) return null;

	const { boardSize, squareSize, orientation } = geometry;

	if (x < 0 || x >= boardSize || y < 0 || y >= boardSize) return null;

	// Grid cell indices, each in [0, 7].
	const xIndex = Math.floor(x / squareSize);
	const yIndex = Math.floor(y / squareSize);

	// Invert the orientation mapping used by geometry.squareRect:
	//   white: xIndex = file,     yIndex = 7 - rank  →  file = xIndex,     rank = 7 - yIndex
	//   black: xIndex = 7 - file, yIndex = rank       →  file = 7 - xIndex, rank = yIndex
	const file = orientation === 'white' ? xIndex : 7 - xIndex;
	const rank = orientation === 'white' ? 7 - yIndex : yIndex;

	return (rank * 8 + file) as Square;
}
