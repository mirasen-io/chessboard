import { cloneDeep } from 'es-toolkit/object';
import { changeStateSetDeferredUIMoveRequest, changeStateSetLastMove } from '../reducers.js';
import { ChangeState, ChangeStateInternal } from '../types/main.js';

function createChangeStateInternal(): ChangeStateInternal {
	return {
		lastMove: null,
		deferredUIMoveRequest: null
	};
}

export function createChangeState(): ChangeState {
	const internalState = createChangeStateInternal();
	return {
		get lastMove() {
			return cloneDeep(internalState.lastMove);
		},
		get deferredUIMoveRequest() {
			return cloneDeep(internalState.deferredUIMoveRequest);
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
				deferredUIMoveRequest: internalState.deferredUIMoveRequest?.getSnapshot() ?? null
			};
		},
		setDeferredUIMoveRequest(request, mutationSession) {
			return mutationSession.addMutation(
				'state.change.setDeferredUIMoveRequest',
				changeStateSetDeferredUIMoveRequest(internalState, request)
			);
		}
	};
}
