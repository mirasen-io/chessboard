import type { ReadonlyDeep } from 'type-fest';
import type { Move } from '../board/types';
import type { ChangeStateMutationSession } from './mutation';

export interface ChangeStateInternal {
	lastMove: ReadonlyDeep<Move> | null;
}

export type ChangeStateSnapshot = ReadonlyDeep<ChangeStateInternal>;

export interface ChangeState {
	getLastMove(): ReadonlyDeep<Move> | null;
	setLastMove(
		move: ReadonlyDeep<Move> | null,
		mutationSession: ChangeStateMutationSession
	): boolean;
	getSnapshot(): ChangeStateSnapshot;
}
