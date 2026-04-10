import { cloneDeep } from 'es-toolkit/object';
import { changeStateSetLastMove } from './reducers';
import type { ChangeState, ChangeStateInternal } from './types';

function createChangeStateInternal(): ChangeStateInternal {
	return {
		lastMove: null
	};
}

export function createChangeState(): ChangeState {
	const internalState = createChangeStateInternal();
	return {
		getLastMove() {
			return cloneDeep(internalState.lastMove);
		},
		setLastMove(move, mutationSession) {
			return mutationSession.addMutation(
				'state.change.setLastMove',
				changeStateSetLastMove(internalState, move)
			);
		},
		getSnapshot() {
			return cloneDeep(internalState);
		}
	};
}
