import { fileOf, rankOf } from '../../state/board/coords';
import { ColorCode } from '../../state/board/types/internal';
import { RenderGeometry } from './types';

/**
 * Create RenderGeometry for a given board size (in px) and orientation.
 * - Geometry uses an SVG-local coordinate system with origin at top-left.
 * - Orientation mapping:
 *   - 'white': files increase left→right (a..h), ranks increase bottom→top (1..8).
 *              yIndex = 7 - rank, xIndex = file
 *   - 'black': files increase right→left (a..h), ranks increase top→bottom (1..8).
 *              yIndex = rank, xIndex = 7 - file
 */
export function createRenderGeometry(boardSize: number, orientation: ColorCode): RenderGeometry {
	if (!(boardSize > 0 && Number.isFinite(boardSize))) {
		throw new RangeError(`Invalid boardSize: ${boardSize}`);
	}
	const squareSize = boardSize / 8;
	const white = orientation === ColorCode.White;

	return {
		boardSize,
		squareSize,
		orientation,
		squareRect(sq) {
			const f = fileOf(sq);
			const r = rankOf(sq);
			const xIndex = white ? f : 7 - f;
			const yIndex = white ? 7 - r : r;
			return {
				x: xIndex * squareSize,
				y: yIndex * squareSize,
				size: squareSize
			};
		}
	};
}
