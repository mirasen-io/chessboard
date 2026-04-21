import { Square } from '../../../../state/board/types/internal.js';
import { ExtensionCleanAnimationContext } from '../../../types/context/animation.js';
import { ExtensionUpdateContext } from '../../../types/context/update.js';
import { MainRendererPiecesInternal } from './types.js';

export function calculateSuppressedSquares(
	_state: MainRendererPiecesInternal,
	context: ExtensionUpdateContext | ExtensionCleanAnimationContext,
	animationSuppressedSquares: ReadonlySet<Square>
): ReadonlySet<Square> {
	const dragSession = context.currentFrame.state.interaction.dragSession;
	const dragSquare = dragSession?.type === 'lifted-piece-drag' ? dragSession.sourceSquare : null;

	const result = new Set(animationSuppressedSquares);
	if (dragSquare !== null) {
		result.add(dragSquare);
	}
	const pendingMoveRequest = context.currentFrame.state.change.deferredUIMoveRequest;
	if (pendingMoveRequest) {
		result.add(pendingMoveRequest.sourceSquare);
		result.add(pendingMoveRequest.destination.to);
	}
	return result;
}
