import { cloneDeep } from 'es-toolkit/object';
import { ColorCode } from '../state/board/types/internal';
import { layoutRefreshGeometry } from './reducers';
import { Layout, LayoutInternal } from './types';

function createLayoutInternal(): LayoutInternal {
	return {
		boardSize: 0,
		orientation: ColorCode.White,
		geometry: null,
		layoutEpoch: 0
	};
}

export function createLayout(): Layout {
	const internalState = createLayoutInternal();

	return {
		get boardSize() {
			return internalState.boardSize;
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
