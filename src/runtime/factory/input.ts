import assert from '@ktarmyshov/assert';
import { isEmptyPieceCode } from '../../state/board/check.js';
import {
	isDragSessionActiveLiftedPiece,
	isDragSessionCoreOwned
} from '../../state/interaction/helpers.js';
import {
	DragSession,
	DragSessionActiveLiftedPieceCoreOwned,
	DragSessionPendingLiftedPieceCoreOwned,
	DragSessionSnapshot
} from '../../state/interaction/types/internal.js';
import { InteractionStateSelected } from '../../state/interaction/types/main.js';
import { isStartPendingLiftedDragSessionInput } from '../input/controller/helpers.js';
import { RuntimeInteractionSurface } from '../input/controller/types.js';
import { runtimeRunMutationPipeline } from '../mutation/run.js';
import { GetInternalState, RuntimeInternal } from '../types/main.js';
import { uiMoveCompleteTo } from './helpers.js';

export function notifyExtensionCancelDragIfOwned(
	internalState: RuntimeInternal,
	dragSession: DragSessionSnapshot | null
): void {
	if (dragSession && !isDragSessionCoreOwned(dragSession)) {
		internalState.extensionSystem.cancelDrag(dragSession);
	}
}

export function createRuntimeInteractionSurface(
	state: GetInternalState
): RuntimeInteractionSurface {
	return {
		getInteractionStateSnapshot() {
			const internalState = state();
			return internalState.state.interaction.getSnapshot();
		},
		getPieceCodeAt(square) {
			const internalState = state();
			return internalState.state.board.getPieceCodeAt(square);
		},
		startLiftedDragSession(input): void {
			const internalState = state();
			const interactionMutationSession = internalState.mutation.getSession();
			const interaction = internalState.state.interaction;

			const pieceCode = internalState.state.board.getPieceCodeAt(input.sourceSquare);
			assert(
				!isEmptyPieceCode(pieceCode),
				'Cannot start a lifted-piece-drag session from an empty square'
			);
			const interactionSource: InteractionStateSelected = {
				square: input.sourceSquare,
				pieceCode
			};
			interaction.setSelected(interactionSource, interactionMutationSession);

			const dragSession: DragSession = isStartPendingLiftedDragSessionInput(input)
				? ({
						owner: 'core',
						type: 'lifted-piece-drag',
						phase: 'pending',
						sourceSquare: interactionSource.square,
						sourcePieceCode: interactionSource.pieceCode,
						targetSquare: input.targetSquare,
						startButton: input.startButton,
						startPoint: input.startPoint,
						thresholdPx: input.thresholdPx
					} satisfies DragSessionPendingLiftedPieceCoreOwned)
				: ({
						owner: 'core',
						type: 'lifted-piece-drag',
						phase: 'active',
						sourceSquare: interactionSource.square,
						sourcePieceCode: interactionSource.pieceCode,
						targetSquare: input.targetSquare,
						startButton: input.startButton
					} satisfies DragSessionActiveLiftedPieceCoreOwned);
			interaction.setDragSession(dragSession, interactionMutationSession);
			runtimeRunMutationPipeline(internalState);
		},
		activatePendingLiftedDragSession(input): void {
			const internalState = state();
			const mutationSession = internalState.mutation.getSession();
			const interaction = internalState.state.interaction;
			interaction.activatePendingLiftedDragSession(input.targetSquare, mutationSession);
			runtimeRunMutationPipeline(internalState);
		},
		transientInput(input) {
			const internalState = state();
			internalState.renderSystem.requestRenderVisuals(input);
		},
		completeCoreDragSessionTo(target) {
			const internalState = state();
			const mutationSession = internalState.mutation.getSession();
			const interaction = internalState.state.interaction;
			const currentDragSession = interaction.dragSession;
			assert(
				currentDragSession !== null &&
					isDragSessionCoreOwned(currentDragSession) &&
					isDragSessionActiveLiftedPiece(currentDragSession),
				'completeCoreDragSessionTo requires a core-owned active lifted-piece drag session'
			);
			interaction.updateDragSessionCurrentTarget(target, mutationSession);
			const dragSession = interaction.dragSession as DragSessionActiveLiftedPieceCoreOwned;

			uiMoveCompleteTo(internalState, target);
			mutationSession.addMutation(
				'runtime.interaction.completeCoreDragSessionTo',
				true,
				dragSession
			);
			runtimeRunMutationPipeline(internalState);
		},
		completeExtensionDragSession(target) {
			const internalState = state();
			const mutationSession = internalState.mutation.getSession();
			const interaction = internalState.state.interaction;
			const currentDragSession = interaction.dragSession;
			assert(
				currentDragSession !== null && !isDragSessionCoreOwned(currentDragSession),
				'completeExtensionDragSession can only be called for extension-owned drag sessions'
			);
			interaction.updateDragSessionCurrentTarget(target, mutationSession);
			const dragSession = interaction.dragSession as Exclude<
				DragSessionSnapshot,
				{ owner: 'core' }
			>;

			internalState.extensionSystem.completeDrag(dragSession);
			internalState.state.interaction.setDragSession(null, mutationSession);
			mutationSession.addMutation(
				'runtime.interaction.completeExtensionDragSession',
				true,
				dragSession
			);
			runtimeRunMutationPipeline(internalState);
		},
		startReleaseTargetingDragSession(input): void {
			const internalState = state();
			const mutationSession = internalState.mutation.getSession();
			const interaction = internalState.state.interaction;

			assert(
				interaction.selected !== null,
				'startReleaseTargetingDragSession requires a selected piece'
			);
			assert(
				interaction.selected.square === input.sourceSquare,
				'startReleaseTargetingDragSession source must match selected square'
			);

			const dragSession: DragSession = {
				owner: 'core',
				type: 'release-targeting',
				sourceSquare: input.sourceSquare,
				sourcePieceCode: interaction.selected.pieceCode,
				targetSquare: input.targetSquare,
				startButton: input.startButton
			};
			interaction.setDragSession(dragSession, mutationSession);
			runtimeRunMutationPipeline(internalState);
		},
		cancelActiveInteraction() {
			const internalState = state();
			const mutationSession = internalState.mutation.getSession();
			const interaction = internalState.state.interaction;
			notifyExtensionCancelDragIfOwned(internalState, interaction.dragSession);
			interaction.clearActive(mutationSession);
			runtimeRunMutationPipeline(internalState);
		},
		cancelInteraction() {
			const internalState = state();
			const mutationSession = internalState.mutation.getSession();
			const interaction = internalState.state.interaction;
			notifyExtensionCancelDragIfOwned(internalState, interaction.dragSession);
			interaction.clear(mutationSession);
			runtimeRunMutationPipeline(internalState);
		},
		updateDragSessionCurrentTarget(target) {
			const internalState = state();
			const interactionMutationSession = internalState.mutation.getSession();
			const interaction = internalState.state.interaction;
			interaction.updateDragSessionCurrentTarget(target, interactionMutationSession);
			runtimeRunMutationPipeline(internalState);
		},
		onEvent(context) {
			const internalState = state();
			internalState.extensionSystem.onEvent(context);
		}
	};
}
