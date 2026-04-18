import assert from '@ktarmyshov/assert';
import { ScenePointerEvent } from '../../../extensions/types/basic/events';
import { isEmptyPieceCode, isNonEmptyPieceCode } from '../../../state/board/check';
import { fromPieceCode } from '../../../state/board/piece';
import { MovabilityModeCode } from '../../../state/interaction/types/internal';
import { canMoveTo } from './helpers';
import { InteractionControllerInternal } from './types';

export function handlePointerDown(
	state: InteractionControllerInternal,
	event: ScenePointerEvent
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

	if (event.target !== null) {
		/**
		 * If piece is already selected, and we have a valid target square event.target
		 * AND it's a different square AND (it's empty OR (has an opponent piece AND is a legal move target))
		 * THEN start a release-targeting drag session
		 */
		if (interaction.selected && event.target !== interaction.selected.square) {
			const selectedPieceCode = interaction.selected.pieceCode;
			assert(isNonEmptyPieceCode(selectedPieceCode), 'Selected piece code must be non-zero');

			const targetPieceCode = state.surface.getPieceCodeAt(event.target);

			if (isEmptyPieceCode(targetPieceCode)) {
				state.surface.startReleaseTargetingDrag(interaction.selected.square, event.target);
				return;
			}

			const isLegalMoveTarget =
				interaction.movability.mode === MovabilityModeCode.Free ||
				(interaction.movability.mode === MovabilityModeCode.Strict &&
					interaction.activeDestinations.has(event.target));

			if (
				fromPieceCode(targetPieceCode).color !== fromPieceCode(selectedPieceCode).color &&
				isLegalMoveTarget
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
		if (!isEmptyPieceCode(pieceCode)) {
			state.surface.startLiftedDrag(event.target, event.target);
		}
	}
}

export function handlePointerMove(
	state: InteractionControllerInternal,
	event: ScenePointerEvent
): void {
	assert(
		event.type === 'pointermove',
		'handlePointerMove should only be called for pointermove events'
	);
	const interaction = state.surface.getInteractionStateSnapshot();
	if (interaction.dragSession) {
		state.surface.updateDragSessionCurrentTarget(event.target);
	}
}

export function handlePointerUp(
	state: InteractionControllerInternal,
	event: ScenePointerEvent
): void {
	assert(event.type === 'pointerup', 'handlePointerUp should only be called for pointerup events');
	const interaction = state.surface.getInteractionStateSnapshot();

	if (!interaction.dragSession) {
		// No active drag session, so nothing to do on pointer up
		return;
	}

	// Check if the square is the same as the source square of the drag session.
	// If it is, then we can end the drag session without making a move.
	if (event.target === interaction.dragSession.sourceSquare) {
		state.surface.cancelActiveInteraction();
		return;
	}

	// Check if the target square is a valid destination for the selected piece.
	if (event.target !== null && canMoveTo(interaction, event.target)) {
		if (interaction.dragSession.type === 'lifted-piece-drag') {
			state.surface.dropTo(event.target);
		} else {
			state.surface.releaseTo(event.target);
		}
		return;
	}

	// Invalid target: piece returns to source for lifted drag (selection preserved),
	// or selection is cleared for release targeting.
	if (interaction.dragSession.type === 'lifted-piece-drag') {
		state.surface.cancelActiveInteraction();
	} else {
		state.surface.cancelInteraction();
	}
}

export function handlePointerCancel(
	state: InteractionControllerInternal,
	event: ScenePointerEvent
): void {
	assert(
		event.type === 'pointercancel',
		'handlePointerCancel should only be called for pointercancel events'
	);
	const interaction = state.surface.getInteractionStateSnapshot();

	if (!interaction.dragSession) {
		// No active drag session, so nothing to do on pointer cancel
		return;
	}

	// Cancel the active interaction on pointer cancel
	state.surface.cancelActiveInteraction();
}

export function handlePointerLeave(
	state: InteractionControllerInternal,
	event: ScenePointerEvent
): void {
	assert(
		event.type === 'pointerleave',
		'handlePointerLeave should only be called for pointerleave events'
	);
	const interaction = state.surface.getInteractionStateSnapshot();
	if (interaction.dragSession) {
		state.surface.updateDragSessionCurrentTarget(event.target);
	}
}
