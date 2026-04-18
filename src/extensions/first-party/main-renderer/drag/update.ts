import assert from '@ktarmyshov/assert';
import { isNonEmptyPieceCode } from '../../../../state/board/check';
import { ExtensionUpdateContext } from '../../../types/context/update';
import { MainRendererDragInternal } from './types';

export function rendererDragOnUpdate(
	state: MainRendererDragInternal,
	context: ExtensionUpdateContext
): void {
	const isLiftedDragActive =
		context.currentFrame.state.interaction.dragSession?.type === 'lifted-piece-drag';

	if (isLiftedDragActive) {
		if (!state.isDragActive) {
			const pieceCode = context.currentFrame.state.interaction.dragSession.sourcePieceCode;
			assert(isNonEmptyPieceCode(pieceCode), 'Invalid piece code in drag session');
			state.pieceUrl = state.config[pieceCode];
			state.runtimeSurface.transientVisuals.subscribe();
		}
		state.isDragActive = true;
	} else {
		if (state.isDragActive) {
			state.runtimeSurface.transientVisuals.unsubscribe();
			state.pieceNode?.remove();
			state.pieceNode = null;
			state.pieceUrl = null;
		}
		state.isDragActive = false;
	}
}
