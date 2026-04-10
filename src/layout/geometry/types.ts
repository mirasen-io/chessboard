import { ReadonlyDeep } from 'type-fest';
import { Color, Square } from '../../state/board/types';

export interface SquareRect {
	x: number; // top-left x coordinate in px
	y: number; // top-left y coordinate in px
	size: number; // square size in px (squareSize)
}

export type SquareRectSnapshot = ReadonlyDeep<SquareRect>;

export interface RenderGeometry {
	readonly boardSize: number; // total board side in px
	readonly squareSize: number; // derived: boardSize / 8
	readonly orientation: Color; // 'white' or 'black', affects square indexing and coordinate rendering
	squareRect(sq: Square): SquareRectSnapshot;
}
