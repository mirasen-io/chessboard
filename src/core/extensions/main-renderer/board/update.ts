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
	if (!context.current.isMounted || !context.current.layout.geometry) {
		// no-op, we only care about geometry changes on mounted with available geometry, otherwise nothing to do here
		return;
	}
	// Ok geometry changed, let's check the board size
	const currentGeometry = context.current.layout.geometry;
	const currentBoardSize = currentGeometry.boardSize;
	const previousBoardSize = context.previous?.isMounted
		? context.previous?.layout.geometry?.boardSize
		: null;
	if (currentBoardSize === previousBoardSize) {
		return; // no-op
	}
	context.invalidation.markDirty(DirtyLayer.Board);
}
