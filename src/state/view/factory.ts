import { cloneDeep } from 'es-toolkit/object';
import { normalizeColor } from '../board/normalize';
import { viewSetMovability, viewSetOrientation } from './reducers';
import type { ViewState, ViewStateInitOptions, ViewStateInternal } from './types';

function createViewStateInternal(opts: ViewStateInitOptions = {}): ViewStateInternal {
	const orientation = opts.orientation ? normalizeColor(opts.orientation) : 'white';
	const movability = opts.movability ?? { mode: 'disabled' };
	return {
		orientation,
		movability: cloneDeep(movability)
	};
}

export function createViewState(options: ViewStateInitOptions): ViewState {
	const internalState = createViewStateInternal(options);
	return {
		getOrientation() {
			return internalState.orientation;
		},
		setOrientation(orientation, mutationSession) {
			const newOrient = normalizeColor(orientation);
			return mutationSession.addMutation(
				'state.view.setOrientation',
				viewSetOrientation(internalState, newOrient)
			);
		},
		getMovability() {
			return cloneDeep(internalState.movability);
		},
		setMovability(movability, mutationSession) {
			return mutationSession.addMutation(
				'state.view.setMovability',
				viewSetMovability(internalState, movability)
			);
		},
		getSnapshot() {
			return cloneDeep(internalState);
		}
	};
}
