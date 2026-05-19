import assert from '@ktarmyshov/assert';
import type { RuntimeInteractionAction } from '../../../extensions/types/basic/events.js';
import { isEmptyPieceCode, isNonEmptyPieceCode } from '../../../state/board/check.js';
import { fromPieceCode } from '../../../state/board/piece.js';
import {
	isDragSessionActiveLiftedPiece,
	isDragSessionCoreOwned
} from '../../../state/interaction/helpers.js';
import { MovabilityModeCode } from '../../../state/interaction/types/internal.js';
import { buttonToButtonsMask, canMoveTo } from './helpers.js';
import type {
	InteractionControllerInternal,
	InteractionControllerOnEventContext
} from './types.js';

export function determineActionPointerDown(
	state: InteractionControllerInternal,
	context: InteractionControllerOnEventContext
): RuntimeInteractionAction | null {
	assert(
		context.rawEvent.type === 'pointerdown',
		'determineActionPointerDown should only be called for pointerdown events'
	);
	const rawEvent = context.rawEvent as PointerEvent;
	if (rawEvent.button !== 0) {
		// Only handle left-click for now
		return null;
	}

	const sceneEvent = context.sceneEvent;
	assert(sceneEvent, 'Scene event should be present for pointer events');

	const interaction = state.surface.getInteractionStateSnapshot();
	if (interaction.dragSession) {
		// Ignore pointer down events if there's already an active drag session
		return null;
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
				return {
					type: 'startReleaseTargetingDragSession',
					sourceSquare: interaction.selected.square,
					targetSquare: sceneEvent.targetSquare,
					startButton: rawEvent.button
				};
			}

			const isLegalMoveTarget =
				interaction.movability.mode === MovabilityModeCode.Free ||
				(interaction.movability.mode === MovabilityModeCode.Strict &&
					interaction.activeDestinations.has(sceneEvent.targetSquare));

			if (
				fromPieceCode(targetPieceCode).color !== fromPieceCode(selectedPieceCode).color &&
				isLegalMoveTarget
			) {
				return {
					type: 'startReleaseTargetingDragSession',
					sourceSquare: interaction.selected.square,
					targetSquare: sceneEvent.targetSquare,
					startButton: rawEvent.button
				};
			}
		}
		/**
		 * If we are here, then it's not release-targeting.
		 * So it's either a new lift or re-lift of the same piece. In either case, we can just start a lifted drag session if the target is valid.
		 */
		const pieceCode = state.surface.getPieceCodeAt(sceneEvent.targetSquare);
		if (!isEmptyPieceCode(pieceCode)) {
			return {
				type: 'startLiftedDragSession',
				phase: 'active',
				sourceSquare: sceneEvent.targetSquare,
				targetSquare: sceneEvent.targetSquare,
				startButton: rawEvent.button
			};
		}
	}

	return null;
}

export function determineActionPointerMove(
	state: InteractionControllerInternal,
	context: InteractionControllerOnEventContext
): RuntimeInteractionAction | null {
	assert(
		context.rawEvent.type === 'pointermove',
		'determineActionPointerMove should only be called for pointermove events'
	);
	const interaction = state.surface.getInteractionStateSnapshot();
	if (interaction.dragSession) {
		return {
			type: 'updateDragSessionCurrentTarget',
			targetSquare: context.sceneEvent?.targetSquare ?? null
		};
	}
	return null;
}

function determineActionTerminalRelease(
	state: InteractionControllerInternal,
	context: InteractionControllerOnEventContext
): RuntimeInteractionAction | null {
	const interaction = state.surface.getInteractionStateSnapshot();
	const dragSession = interaction.dragSession;

	if (!dragSession) {
		return null;
	}

	const sceneEvent = context.sceneEvent;
	assert(sceneEvent, 'Scene event should be present for terminal release');

	if (!isDragSessionCoreOwned(dragSession)) {
		return {
			type: 'completeExtensionDragSession',
			targetSquare: sceneEvent.targetSquare
		};
	}

	if (sceneEvent.targetSquare === dragSession.sourceSquare) {
		return { type: 'cancelActiveInteraction' };
	}

	if (
		sceneEvent.targetSquare !== null &&
		isDragSessionActiveLiftedPiece(dragSession) &&
		canMoveTo(interaction, sceneEvent.targetSquare)
	) {
		return { type: 'completeCoreDragSessionTo', targetSquare: sceneEvent.targetSquare };
	}

	if (dragSession.type === 'lifted-piece-drag') {
		return { type: 'cancelActiveInteraction' };
	} else {
		return { type: 'cancelInteraction' };
	}
}

export function determineActionPointerUp(
	state: InteractionControllerInternal,
	context: InteractionControllerOnEventContext
): RuntimeInteractionAction | null {
	assert(
		context.rawEvent.type === 'pointerup',
		'determineActionPointerUp should only be called for pointerup events'
	);
	return determineActionTerminalRelease(state, context);
}

export function determineActionPointerCancel(
	state: InteractionControllerInternal,
	context: InteractionControllerOnEventContext
): RuntimeInteractionAction | null {
	assert(
		context.rawEvent.type === 'pointercancel',
		'determineActionPointerCancel should only be called for pointercancel events'
	);
	const interaction = state.surface.getInteractionStateSnapshot();

	if (!interaction.dragSession) {
		return null;
	}

	return {
		type: 'cancelActiveInteraction'
	};
}

export function determineActionLostPointerCapture(
	state: InteractionControllerInternal,
	context: InteractionControllerOnEventContext
): RuntimeInteractionAction | null {
	assert(
		context.rawEvent.type === 'lostpointercapture',
		'determineActionLostPointerCapture should only be called for lostpointercapture events'
	);
	const interaction = state.surface.getInteractionStateSnapshot();
	const dragSession = interaction.dragSession;

	if (!dragSession) {
		return null;
	}

	const rawEvent = context.rawEvent as PointerEvent;
	const mask = buttonToButtonsMask(dragSession.startButton);

	if (mask === null) {
		return { type: 'cancelActiveInteraction' };
	}

	if ((rawEvent.buttons & mask) === 0) {
		return determineActionTerminalRelease(state, context);
	}

	return { type: 'cancelActiveInteraction' };
}
