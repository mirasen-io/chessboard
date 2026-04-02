import { cloneDeep } from 'lodash-es';
import { visualsSetDragPointer, visualsSetSkipNextCommittedAnimation } from './reducers';
import { VisualsState, VisualsStateInternal } from './types';

function createVisualsStateInternal(): VisualsStateInternal {
	return {
		dragPointer: null
	};
}

export function createVisualsState(): VisualsState {
	const internalState = createVisualsStateInternal();

	return {
		getDragPointer() {
			return cloneDeep(internalState.dragPointer);
		},

		setDragPointer(point, mutationSession) {
			const newPointer = point ? cloneDeep(point) : null;
			return mutationSession.addMutation(
				'visuals.state.setDragPointer',
				visualsSetDragPointer(internalState, newPointer),
				newPointer
			);
		},

		getSkipNextCommittedAnimation() {
			return internalState.skipNextCommittedAnimation;
		},

		setSkipNextCommittedAnimation(skip, mutationSession) {
			return mutationSession.addMutation(
				'visuals.state.setSkipNextCommittedAnimation',
				visualsSetSkipNextCommittedAnimation(internalState, skip)
			);
		},

		getSnapshot() {
			return cloneDeep(internalState);
		}
	};
}
