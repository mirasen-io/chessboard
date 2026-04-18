import { cloneDeep } from 'es-toolkit/object';
import { ExtensionUIMoveRequestContext } from '../../extensions/types/context/ui-move';
import type { MoveSnapshot } from '../board/types/internal';
import { movesEqual, uiMoveRequestContextsEqual } from './helpers';
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

export function changeStateSetDeferredUIMoveRequestContext(
	state: ChangeStateInternal,
	context: ExtensionUIMoveRequestContext
): boolean {
	if (uiMoveRequestContextsEqual(state.deferredUIMoveRequestContext, context)) {
		return false; // No change
	}
	state.deferredUIMoveRequestContext = context;
	return true;
}
