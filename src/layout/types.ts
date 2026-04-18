import { ReadonlyDeep } from 'type-fest';
import { ColorCode } from '../state/board/types/internal';
import { RenderGeometry } from './geometry/types';
import { LayoutMutationSession } from './mutation';

export interface LayoutInternal {
	boardSize: number | null;
	orientation: ColorCode | null;
	geometry: RenderGeometry | null;
	layoutEpoch: number;
}

export type LayoutSnapshot = ReadonlyDeep<LayoutInternal>;

export interface LayoutRefreshOptions {
	container?: HTMLElement;
	orientation?: ColorCode;
}

export interface Layout {
	readonly boardSize: number | null;
	readonly orientation: ColorCode | null;
	readonly geometry: RenderGeometry | null;
	readonly layoutEpoch: number;

	refreshGeometry(options: LayoutRefreshOptions, mutationSession: LayoutMutationSession): boolean;
	getSnapshot(): LayoutSnapshot;
}
