import type { ReadonlyDeep } from 'type-fest';
import {
	ExtensionUIMoveRequestContext,
	ExtensionUIMoveRequestContextSnapshot
} from '../../extensions/types/context/ui-move.js';
import type { MoveSnapshot } from '../board/types/internal.js';
import type { ChangeStateMutationSession } from './mutation.js';

export interface ChangeStateInternal {
	lastMove: MoveSnapshot | null;
	deferredUIMoveRequestContext: ExtensionUIMoveRequestContext | null;
}

export type ChangeStateSnapshot = ReadonlyDeep<
	Omit<ChangeStateInternal, 'deferredUIMoveRequestContext'>
> & {
	deferredUIMoveRequestContext: ExtensionUIMoveRequestContextSnapshot | null;
};

export interface ChangeState {
	readonly lastMove: MoveSnapshot | null;
	setLastMove(move: MoveSnapshot | null, mutationSession: ChangeStateMutationSession): boolean;
	setDeferredUIMoveRequestContext(
		context: ExtensionUIMoveRequestContext,
		mutationSession: ChangeStateMutationSession
	): boolean;
	getSnapshot(): ChangeStateSnapshot;
}
