import { cloneDeep } from 'es-toolkit/object';
import { Color } from '../state/board/types';
import { RenderGeometry } from './geometry/types';
import { LayoutMutationSession } from './mutation';
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
		getBoardSize(): number {
			return internalState.boardSize;
		},
		getGeometry(): RenderGeometry | null {
			return internalState.geometry;
		},
		getLayoutVersion(): number {
			return internalState.layoutVersion;
		},
		refreshGeometry(
			container: HTMLElement,
			orientation: Color,
			mutationSession: LayoutMutationSession
		): boolean {
			return mutationSession.addMutation(
				'board.layout.refreshGeometry',
				layoutRefreshGeometry(internalState, container, orientation)
			);
		},
		refreshGeometryForOrientation(
			orientation: Color,
			mutationSession: LayoutMutationSession
		): boolean {
			return mutationSession.addMutation(
				'board.layout.refreshGeometry',
				layoutRefreshGeometryForOrientation(internalState, orientation)
			);
		},
		getSnapshot() {
			return cloneDeep(internalState);
		}
	};
}
