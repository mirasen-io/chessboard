import { cloneDeep } from 'es-toolkit/object';
import { normalizeColor } from '../board/normalize.js';
import { ColorCode } from '../board/types/internal.js';
import { viewSetOrientation } from './reducers.js';
import type { ViewStateInternal } from './types/internal.js';
import { ViewState, ViewStateInitOptions } from './types/main.js';

function createViewStateInternal(opts: ViewStateInitOptions): ViewStateInternal {
	const orientation = opts.orientation ? normalizeColor(opts.orientation) : ColorCode.White;
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
