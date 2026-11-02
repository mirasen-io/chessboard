import { ReadonlyDeep } from 'type-fest';
import { ColorCode } from '../state/board/types/internal.js';
import { SceneRenderGeometry, Size } from './geometry/types.js';
import { LayoutMutationSession } from './mutation.js';

export interface LayoutInternal {
	sceneSize: Size | null;
	orientation: ColorCode | null;
	geometry: SceneRenderGeometry | null;
	layoutEpoch: number;
}

export type LayoutSnapshot = ReadonlyDeep<LayoutInternal>;

export interface LayoutRefreshOptions {
	container?: HTMLElement;
	orientation?: ColorCode;
}

export interface Layout {
	readonly sceneSize: Size | null;
	readonly orientation: ColorCode | null;
	readonly geometry: SceneRenderGeometry | null;
	readonly layoutEpoch: number;

	refreshGeometry(options: LayoutRefreshOptions, mutationSession: LayoutMutationSession): boolean;
	getSnapshot(): LayoutSnapshot;
}
