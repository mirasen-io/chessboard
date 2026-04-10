import { cloneDeep } from 'es-toolkit/object';
import { visualsSetDragPointer } from './reducers';
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
				'state.visuals.setDragPointer',
				visualsSetDragPointer(internalState, newPointer),
				newPointer
			);
		},

		getSnapshot() {
			return cloneDeep(internalState);
		}
	};
}
