import { cloneDeep } from 'es-toolkit/object';
import type { MoveSnapshot } from '../board/types';
import { movesEqual } from './helpers';
import type { ChangeStateInternal } from './types';

export function changeStateSetLastMove(
	state: ChangeStateInternal,
	move: MoveSnapshot | null
): boolean {
	if (movesEqual(state.lastMove, move)) {
		return false; // No change
	}
	state.lastMove = cloneDeep(move);
	return true;
}
