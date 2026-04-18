import { ReadonlyDeep } from 'type-fest';
import { ColorCode, Square } from '../../state/board/types/internal';

export interface SquareRect {
	x: number; // top-left x coordinate in px
	y: number; // top-left y coordinate in px
	size: number; // square size in px (squareSize)
}

export type SquareRectSnapshot = ReadonlyDeep<SquareRect>;

/**
 * RenderGeometry represents the derived geometry of the rendered chessboard.
 * It includes the board size, square size, orientation, and square rectangle mapping.
 *
 * It is computed from layout inputs and used by rendering and interaction code.
 */
export interface RenderGeometry {
	readonly boardSize: number; // total board side in px
	readonly squareSize: number; // derived: boardSize / 8
	readonly orientation: ColorCode; // 'white' or 'black', affects square indexing and coordinate rendering
	squareRect(sq: Square): SquareRectSnapshot;
}
