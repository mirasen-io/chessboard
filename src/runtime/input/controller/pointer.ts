import assert from '@ktarmyshov/assert';
import { BoardPointerEvent } from '../../../extensions/types/basic/events';
import { decodePiece } from '../../../state/board/encode';
import { InteractionControllerInternal } from './types';

export function handlePointerDown(
	state: InteractionControllerInternal,
	event: BoardPointerEvent
): void {
	assert(
		event.type === 'pointerdown',
		'handlePointerDown should only be called for pointerdown events'
	);
	if (event.button !== 0) {
		// Only handle left-click for now
		return;
	}

	const interaction = state.surface.getInteractionStateSnapshot();
	if (interaction.dragSession) {
		// Ignore pointer down events if there's already an active drag session
		return;
	}

	if (event.target) {
		/**
		 * If piece is already selected, and we have a valid target square event.target
		 * AND it's a different square AND (it's empty OR has an opponent piece)
		 * THEN start a release-targeting drag session
		 */
		if (interaction.selected && event.target !== interaction.selected.square) {
			const selectedPieceCode = interaction.selected.pieceCode;
			const targetPieceCode = state.surface.getPieceCodeAt(event.target);
			const selectedPiece = decodePiece(selectedPieceCode);
			assert(selectedPiece !== null, 'Selected piece code must be non-zero');
			const targetPiece = decodePiece(targetPieceCode);
			if (
				targetPiece === null || // empty square
				targetPiece.color !== selectedPiece.color // opponent piece
			) {
				state.surface.startReleaseTargetingDrag(interaction.selected.square, event.target);
				return;
			}
		}

		/**
		 * If we are here, then it's not release-targeting.
		 * So it's either a new lift or re-lift of the same piece. In either case, we can just start a lifted drag session if the target is valid.
		 */
		const pieceCode = state.surface.getPieceCodeAt(event.target);
		if (pieceCode !== 0) {
			state.surface.startLiftedDrag(event.target, event.target);
		}
	}
}
