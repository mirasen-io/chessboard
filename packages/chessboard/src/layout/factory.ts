import { cloneDeep } from 'es-toolkit/object';
import { ColorCode } from '../state/board/types/internal.js';
import { layoutRefreshGeometry } from './reducers.js';
import { Layout, LayoutInternal } from './types.js';

function createLayoutInternal(): LayoutInternal {
	return {
		sceneSize: null,
		orientation: ColorCode.White,
		geometry: null,
		layoutEpoch: 0
	};
}

export function createLayout(): Layout {
	const internalState = createLayoutInternal();

	return {
		get sceneSize() {
			return internalState.sceneSize;
		},
		get orientation() {
			return internalState.orientation;
		},
		get geometry() {
			return internalState.geometry;
		},
		get layoutEpoch() {
			return internalState.layoutEpoch;
		},
		refreshGeometry(options, mutationSession) {
			return mutationSession.addMutation(
				'layout.refreshGeometry',
				layoutRefreshGeometry(internalState, options)
			);
		},
		getSnapshot() {
			return cloneDeep(internalState);
		}
	};
}
