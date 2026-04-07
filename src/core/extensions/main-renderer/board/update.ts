import { DirtyLayer, SvgRendererOnUpdateContext } from '../types/extension';
import { SvgRendererBoardInternal } from './types';

export function rendererBoardOnUpdate(
	state: SvgRendererBoardInternal,
	context: SvgRendererOnUpdateContext
): void {
	// Check if geometry changed
	const mutationSession = context.mutation;
	if (!mutationSession.hasMutation(['board.layout.refreshGeometry'])) {
		return; // no-op
	}
	// Ok geometry changed, let's check the board size
	const currentGeometry = context.current.layout.geometry;
	const currentBoardSize = currentGeometry.boardSize;
	const previousBoardSize = context.previous?.layout.geometry?.boardSize;
	if (currentBoardSize === previousBoardSize) {
		return; // no-op
	}
	context.invalidation.markDirty(DirtyLayer.Board);
}
