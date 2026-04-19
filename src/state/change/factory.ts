import { cloneDeep } from 'es-toolkit/object';
import { changeStateSetDeferredUIMoveRequestContext, changeStateSetLastMove } from './reducers.js';
import type { ChangeState, ChangeStateInternal } from './types.js';

function createChangeStateInternal(): ChangeStateInternal {
	return {
		lastMove: null,
		deferredUIMoveRequestContext: null
	};
}

export function createChangeState(): ChangeState {
	const internalState = createChangeStateInternal();
	return {
		get lastMove() {
			return cloneDeep(internalState.lastMove);
		},
		setLastMove(move, mutationSession) {
			return mutationSession.addMutation(
				'state.change.setLastMove',
				changeStateSetLastMove(internalState, move)
			);
		},
		getSnapshot() {
			return {
				...cloneDeep(internalState),
				deferredUIMoveRequestContext:
					internalState.deferredUIMoveRequestContext?.getSnapshot() ?? null
			};
		},
		setDeferredUIMoveRequestContext(context, mutationSession) {
			return mutationSession.addMutation(
				'state.change.setDeferredUIMoveRequestContext',
				changeStateSetDeferredUIMoveRequestContext(internalState, context)
			);
		}
	};
}
