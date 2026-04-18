import { isFrameRenderable } from '../../../types/basic/update';
import { ExtensionUpdateContext, isUpdateContextRenderable } from '../../../types/context/update';
import { DirtyLayer } from '../types/extension';
import { MainRendererBoardInternal } from './types';

export function rendererBoardOnUpdate(
	_state: MainRendererBoardInternal,
	context: ExtensionUpdateContext
): void {
	// Check if geometry changed
	const mutationSession = context.mutation;
	if (
		!isUpdateContextRenderable(context) ||
		!mutationSession.hasMutation({
			causes: ['layout.refreshGeometry']
		})
	) {
		return; // no-op
	}

	// Ok geometry changed, let's check the board size
	const currentGeometry = context.currentFrame.layout.geometry;
	const currentBoardSize = currentGeometry.boardSize;
	const currentOrientation = currentGeometry.orientation;
	const previousGeometry =
		context.previousFrame && isFrameRenderable(context.previousFrame)
			? context.previousFrame.layout.geometry
			: null;
	const previousBoardSize = previousGeometry?.boardSize;
	const previousOrientation = previousGeometry?.orientation;
	const needsRender =
		currentBoardSize !== previousBoardSize || currentOrientation !== previousOrientation;
	if (!needsRender) {
		return; // no-op
	}

	context.invalidation.markDirty(DirtyLayer.Board | DirtyLayer.Coordinates);
}
