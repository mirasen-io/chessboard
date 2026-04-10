import { ReadonlyDeep } from 'type-fest';
import { Color } from '../state/board/types';
import { RenderGeometry } from './geometry/types';
import { LayoutMutationSession } from './mutation';

export interface LayoutInternal {
	boardSize: number;
	geometry: RenderGeometry | null;
	layoutVersion: number;
}

export type LayoutSnapshot = ReadonlyDeep<LayoutInternal>;

export interface Layout {
	getBoardSize(): number;
	getGeometry(): RenderGeometry | null;
	getLayoutVersion(): number;
	refreshGeometry(
		container: HTMLElement,
		orientation: Color,
		mutationSession: LayoutMutationSession
	): boolean;
	refreshGeometryForOrientation(
		orientation: Color,
		mutationSession: LayoutMutationSession
	): boolean;
	getSnapshot(): LayoutSnapshot;
}
