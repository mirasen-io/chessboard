import { cloneDeep } from 'es-toolkit/object';
import { normalizeColor } from '../board/normalize';
import { ColorCode } from '../board/types/internal';
import { viewSetOrientation } from './reducers';
import type { ViewStateInternal } from './types/internal';
import { ViewState, ViewStateInitOptions } from './types/main';

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
