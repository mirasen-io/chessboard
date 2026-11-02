import type { ReadonlyDeep } from 'type-fest';
import { MoveSnapshot } from '../../board/types/internal.js';
import type { ChangeStateMutationSession } from '../mutation.js';
import { PendingUIMoveRequest, PendingUIMoveRequestSnapshot } from './ui-move.js';

export interface ChangeStateInternal {
	lastMove: MoveSnapshot | null;
	deferredUIMoveRequest: PendingUIMoveRequest | null;
}

export type ChangeStateSnapshot = ReadonlyDeep<
	Omit<ChangeStateInternal, 'deferredUIMoveRequest'>
> & {
	deferredUIMoveRequest: PendingUIMoveRequestSnapshot | null;
};

export interface ChangeState {
	readonly lastMove: MoveSnapshot | null;
	readonly deferredUIMoveRequest: PendingUIMoveRequest | null;
	setLastMove(move: MoveSnapshot | null, mutationSession: ChangeStateMutationSession): boolean;
	setDeferredUIMoveRequest(
		request: PendingUIMoveRequest | null,
		mutationSession: ChangeStateMutationSession
	): boolean;
	getSnapshot(): ChangeStateSnapshot;
}
