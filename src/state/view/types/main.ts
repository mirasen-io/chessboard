import { ColorInput } from '../../board/types/input.js';
import { ColorCode } from '../../board/types/internal.js';
import { ViewStateMutationSession } from '../mutation.js';
import { ViewStateSnapshot } from './internal.js';

export interface ViewStateInitOptions {
	orientation?: ColorInput;
}

export interface ViewState {
	readonly orientation: ColorCode;
	setOrientation(orientation: ColorInput, mutationSession: ViewStateMutationSession): boolean;
	getSnapshot(): ViewStateSnapshot;
}
