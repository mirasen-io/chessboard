import { cloneDeep } from 'es-toolkit/object';
import { normalizeColor } from '../board/normalize';
import { viewSetOrientation } from './reducers';
import type { ViewState, ViewStateInitOptions, ViewStateInternal } from './types';

function createViewStateInternal(opts: ViewStateInitOptions): ViewStateInternal {
	const orientation = opts.orientation ? normalizeColor(opts.orientation) : 'white';
	return {
		orientation
	};
}

export function createViewState(options: ViewStateInitOptions): ViewState {
	const internalState = createViewStateInternal(options);
	return {
		get orientation() {
			return internalState.orientation;
		},
		setOrientation(orientation, mutationSession) {
			const newOrient = normalizeColor(orientation);
			return mutationSession.addMutation(
				'state.view.setOrientation',
				viewSetOrientation(internalState, newOrient)
			);
		},
		getSnapshot() {
			return cloneDeep(internalState);
		}
	};
}
