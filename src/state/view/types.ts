import type { ReadonlyDeep } from 'type-fest';
import type { Color, ColorInput } from '../board/types';
import { ViewStateMutationSession } from './mutation';

export type Orientation = Color; // For clarity in context where it applies

export interface ViewStateInternal {
	orientation: Orientation;
}

export type ViewStateSnapshot = ReadonlyDeep<ViewStateInternal>;

export interface ViewStateInitOptions {
	orientation?: ColorInput;
}

export interface ViewState {
	readonly orientation: Orientation;
	setOrientation(orientation: ColorInput, mutationSession: ViewStateMutationSession): boolean;
	getSnapshot(): ViewStateSnapshot;
}
