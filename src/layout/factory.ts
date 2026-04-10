import { cloneDeep } from 'es-toolkit/object';
import { layoutRefreshGeometry, layoutRefreshGeometryForOrientation } from './reducers';
import { Layout, LayoutInternal } from './types';

function createLayoutInternal(): LayoutInternal {
	return {
		boardSize: 0,
		geometry: null,
		layoutVersion: 0
	};
}

export function createLayout(): Layout {
	const internalState = createLayoutInternal();

	return {
		getBoardSize() {
			return internalState.boardSize;
		},
		getGeometry() {
			return internalState.geometry;
		},
		getLayoutVersion() {
			return internalState.layoutVersion;
		},
		refreshGeometry(container, orientation, mutationSession) {
			return mutationSession.addMutation(
				'layout.refreshGeometry',
				layoutRefreshGeometry(internalState, container, orientation)
			);
		},
		refreshGeometryForOrientation(orientation, mutationSession) {
			return mutationSession.addMutation(
				'layout.refreshGeometry',
				layoutRefreshGeometryForOrientation(internalState, orientation)
			);
		},
		getSnapshot() {
			return cloneDeep(internalState);
		}
	};
}
