import { isCurrentUpdateContextBaseMounted } from '../../helpers';
import { DirtyLayer, MainRendererOnUpdateContext } from '../types/extension';
import { MainRendererBoardInternal } from './types';

export function rendererBoardOnUpdate(
	_state: MainRendererBoardInternal,
	context: MainRendererOnUpdateContext
): void {
	// Check if geometry changed
	const mutationSession = context.mutation;
	if (!mutationSession.hasMutation(['layout.refreshGeometry'])) {
		return; // no-op
	}
	if (!isCurrentUpdateContextBaseMounted(context) || !context.current.layout.geometry) {
		// no-op, we only care about geometry changes on mounted with available geometry, otherwise nothing to do here
		return;
	}
	// Ok geometry changed, let's check the board size
	const currentBoardSize = context.current.layout.geometry.boardSize;
	const currentOrientation = context.current.layout.geometry.orientation;
	const previousBoardSize = context.previous?.isMounted
		? context.previous?.layout.geometry?.boardSize
		: null;
	const previousOrientation = context.previous?.isMounted
		? context.previous?.layout.geometry?.orientation
		: null;
	const needsUpdate =
		currentBoardSize !== previousBoardSize || currentOrientation !== previousOrientation;
	if (!needsUpdate) {
		return; // no-op
	}
	context.invalidation.markDirty(DirtyLayer.Board | DirtyLayer.Coordinates);
}
