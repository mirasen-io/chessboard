import { ReadonlyDeep } from 'type-fest';
import { ColorCode, Square } from '../../state/board/types/internal.js';

export interface Size {
	width: number;
	height: number;
}

export type SizeSnapshot = ReadonlyDeep<Size>;

export interface Rect {
	x: number;
	y: number;
	width: number;
	height: number;
}

export type RectSnapshot = ReadonlyDeep<Rect>;

export interface SceneRenderGeometry {
	readonly sceneSize: SizeSnapshot;
	readonly boardRect: RectSnapshot;
	readonly squareSize: number;
	readonly orientation: ColorCode;
	getSquareRect(sq: Square): RectSnapshot;
}
