import { cloneDeep } from 'es-toolkit/object';
import type { MoveSnapshot } from '../board/types/internal.js';
import { movesEqual, pendingUIMoveRequestsEqual } from './helpers.js';
import { ChangeStateInternal } from './types/main.js';
import { PendingUIMoveRequest } from './types/ui-move.js';

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

export function changeStateSetDeferredUIMoveRequest(
	state: ChangeStateInternal,
	request: PendingUIMoveRequest | null
): boolean {
	if (pendingUIMoveRequestsEqual(state.deferredUIMoveRequest, request)) {
		return false; // No change
	}
	state.deferredUIMoveRequest = request;
	return true;
}
