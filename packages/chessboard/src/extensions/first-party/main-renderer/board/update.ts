import { sceneRectsEqual } from '../../../../layout/geometry/helpers.js';
import { isFrameRenderable } from '../../../types/basic/update.js';
import {
	ExtensionUpdateContext,
	isUpdateContextRenderable
} from '../../../types/context/update.js';
import { DirtyLayer } from '../types/extension.js';
import { MainRendererBoardInternal } from './types.js';

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
	const currentBoardRect = currentGeometry.boardRect;
	const currentOrientation = currentGeometry.orientation;
	const previousGeometry =
		context.previousFrame && isFrameRenderable(context.previousFrame)
			? context.previousFrame.layout.geometry
			: null;
	const previousBoardRect = previousGeometry?.boardRect ?? null;
	const previousOrientation = previousGeometry?.orientation;
	const needsRender =
		sceneRectsEqual(currentBoardRect, previousBoardRect) === false ||
		currentOrientation !== previousOrientation;
	if (!needsRender) {
		return; // no-op
	}

	context.invalidation.markDirty(DirtyLayer.Board | DirtyLayer.Coordinates);
}
