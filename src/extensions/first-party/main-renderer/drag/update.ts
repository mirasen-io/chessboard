import assert from '@ktarmyshov/assert';
import { isNonEmptyPieceCode } from '../../../../state/board/check.js';
import { isDragSessionActiveLiftedPiece } from '../../../../state/interaction/helpers.js';
import { ExtensionUpdateContext } from '../../../types/context/update.js';
import { MainRendererDragInternal } from './types.js';

export function rendererDragOnUpdate(
	state: MainRendererDragInternal,
	context: ExtensionUpdateContext
): void {
	const dragSession = context.currentFrame.state.interaction.dragSession;
	const isLiftedDragActive = dragSession !== null && isDragSessionActiveLiftedPiece(dragSession);

	if (isLiftedDragActive) {
		if (!state.isDragActive) {
			const pieceCode = dragSession.sourcePieceCode;
			assert(isNonEmptyPieceCode(pieceCode), 'Invalid piece code in drag session');
			state.pieceCode = pieceCode;
			state.runtimeSurface.transientVisuals.subscribe();
		}
		state.isDragActive = true;
	} else {
		if (state.isDragActive) {
			state.runtimeSurface.transientVisuals.unsubscribe();
			state.pieceNode?.remove();
			state.pieceNode = null;
			state.pieceCode = null;
		}
		state.isDragActive = false;
	}
}
