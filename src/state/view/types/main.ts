import { ColorInput } from '../../board/types/input';
import { ColorCode } from '../../board/types/internal';
import { ViewStateMutationSession } from '../mutation';
import { ViewStateSnapshot } from './internal';

export interface ViewStateInitOptions {
	orientation?: ColorInput;
}

export interface ViewState {
	readonly orientation: ColorCode;
	setOrientation(orientation: ColorInput, mutationSession: ViewStateMutationSession): boolean;
	getSnapshot(): ViewStateSnapshot;
}
