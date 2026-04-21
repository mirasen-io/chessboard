import assert from '@ktarmyshov/assert';
import { ExtensionOnEventContext } from '../../../extensions/types/context/events.js';
import { isEmptyPieceCode, isNonEmptyPieceCode } from '../../../state/board/check.js';
import { fromPieceCode } from '../../../state/board/piece.js';
import { isDragSessionCoreOwned } from '../../../state/interaction/helpers.js';
import { MovabilityModeCode } from '../../../state/interaction/types/internal.js';
import { canMoveTo } from './helpers.js';
import { InteractionControllerInternal } from './types.js';

export function handlePointerDown(
	state: InteractionControllerInternal,
	context: ExtensionOnEventContext
): void {
	assert(
		context.rawEvent.type === 'pointerdown',
		'handlePointerDown should only be called for pointerdown events'
	);
	const rawEvent = context.rawEvent as PointerEvent;
	if (rawEvent.button !== 0) {
		// Only handle left-click for now
		return;
	}

	const sceneEvent = context.sceneEvent;
	assert(sceneEvent, 'Scene event should be present for pointer events');

	const interaction = state.surface.getInteractionStateSnapshot();
	if (interaction.dragSession) {
		// Ignore pointer down events if there's already an active drag session
		return;
	}

	if (sceneEvent.targetSquare !== null) {
		/**
		 * If piece is already selected, and we have a valid target square event.target
		 * AND it's a different square AND (it's empty OR (has an opponent piece AND is a legal move target))
		 * THEN start a release-targeting drag session
		 */
		if (interaction.selected && sceneEvent.targetSquare !== interaction.selected.square) {
			const selectedPieceCode = interaction.selected.pieceCode;
			assert(isNonEmptyPieceCode(selectedPieceCode), 'Selected piece code must be non-zero');

			const targetPieceCode = state.surface.getPieceCodeAt(sceneEvent.targetSquare);

			if (isEmptyPieceCode(targetPieceCode)) {
				state.surface.startReleaseTargetingDrag(
					interaction.selected.square,
					sceneEvent.targetSquare
				);
				return;
			}

			const isLegalMoveTarget =
				interaction.movability.mode === MovabilityModeCode.Free ||
				(interaction.movability.mode === MovabilityModeCode.Strict &&
					interaction.activeDestinations.has(sceneEvent.targetSquare));

			if (
				fromPieceCode(targetPieceCode).color !== fromPieceCode(selectedPieceCode).color &&
				isLegalMoveTarget
			) {
				state.surface.startReleaseTargetingDrag(
					interaction.selected.square,
					sceneEvent.targetSquare
				);
				return;
			}
		}
		/**
		 * If we are here, then it's not release-targeting.
		 * So it's either a new lift or re-lift of the same piece. In either case, we can just start a lifted drag session if the target is valid.
		 */
		const pieceCode = state.surface.getPieceCodeAt(sceneEvent.targetSquare);
		if (!isEmptyPieceCode(pieceCode)) {
			state.surface.startLiftedDrag(sceneEvent.targetSquare, sceneEvent.targetSquare);
		}
	}
}

export function handlePointerMove(
	state: InteractionControllerInternal,
	context: ExtensionOnEventContext
): void {
	assert(
		context.rawEvent.type === 'pointermove',
		'handlePointerMove should only be called for pointermove events'
	);
	const interaction = state.surface.getInteractionStateSnapshot();
	if (interaction.dragSession) {
		state.surface.updateDragSessionCurrentTarget(context.sceneEvent?.targetSquare ?? null);
	}
}

export function handlePointerUp(
	state: InteractionControllerInternal,
	context: ExtensionOnEventContext
): void {
	assert(
		context.rawEvent.type === 'pointerup',
		'handlePointerUp should only be called for pointerup events'
	);
	const interaction = state.surface.getInteractionStateSnapshot();
	const dragSession = interaction.dragSession;

	if (!dragSession) {
		// No active drag session, so nothing to do on pointer up
		return;
	}

	const sceneEvent = context.sceneEvent;
	assert(sceneEvent, 'Scene event should be present for pointer events');

	if (!isDragSessionCoreOwned(dragSession)) {
		// For extension-owned drag sessions, we simply end the session without attempting to make a move,
		// since the runtime doesn't have enough information about the semantics of the drag session.
		state.surface.completeExtensionDrag(sceneEvent.targetSquare);
		return;
	}

	// Check if the square is the same as the source square of the drag session.
	// If it is, then we can end the drag session without making a move.
	if (sceneEvent.targetSquare === dragSession.sourceSquare) {
		state.surface.cancelActiveInteraction();
		return;
	}

	// Check if the target square is a valid destination for the selected piece.
	if (sceneEvent.targetSquare !== null && canMoveTo(interaction, sceneEvent.targetSquare)) {
		state.surface.completeCoreDragTo(sceneEvent.targetSquare);
		return;
	}

	// Invalid target: piece returns to source for lifted drag (selection preserved),
	// or selection is cleared for release targeting.
	if (dragSession.type === 'lifted-piece-drag') {
		state.surface.cancelActiveInteraction();
	} else {
		state.surface.cancelInteraction();
	}
}

export function handlePointerCancel(
	state: InteractionControllerInternal,
	context: ExtensionOnEventContext
): void {
	assert(
		context.rawEvent.type === 'pointercancel',
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
