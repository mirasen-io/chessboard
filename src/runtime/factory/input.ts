import assert from '@ktarmyshov/assert';
import { isEmptyPieceCode } from '../../state/board/check.js';
import { isDragSessionCoreOwned } from '../../state/interaction/helpers.js';
import { DragSession } from '../../state/interaction/types/internal.js';
import { InteractionStateSelected } from '../../state/interaction/types/main.js';
import { RuntimeInteractionSurface } from '../input/controller/types.js';
import { runtimeRunMutationPipeline } from '../mutation/run.js';
import { GetInternalState } from '../types/main.js';
import { uiMoveCompleteTo } from './helpers.js';

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
		startLiftedDrag(source, target): void {
			const internalState = state();
			const interactionMutationSession = internalState.mutation.getSession();
			const interaction = internalState.state.interaction;

			const pieceCode = internalState.state.board.getPieceCodeAt(source);
			assert(
				!isEmptyPieceCode(pieceCode),
				'Cannot start a lifted-piece-drag session from an empty square'
			);
			const interactionSource: InteractionStateSelected = {
				square: source,
				pieceCode
			};
			interaction.setSelected(interactionSource, interactionMutationSession);

			const dragSession: DragSession = {
				owner: 'core',
				type: 'lifted-piece-drag',
				sourceSquare: interactionSource.square,
				sourcePieceCode: interactionSource.pieceCode,
				targetSquare: target
			};
			interaction.setDragSession(dragSession, interactionMutationSession);
			runtimeRunMutationPipeline(internalState);
		},
		transientInput(input) {
			const internalState = state();
			internalState.renderSystem.requestRenderVisuals(input);
		},
		completeCoreDragTo(target) {
			const internalState = state();
			const mutationSession = internalState.mutation.getSession();
			const interaction = internalState.state.interaction;
			const dragSession = interaction.dragSession;
			assert(dragSession !== null, 'completeDragTo requires an active drag session');
			assert(
				isDragSessionCoreOwned(dragSession),
				'completeDragTo can only be called for core-owned drag sessions'
			);

			uiMoveCompleteTo(internalState, target);
			mutationSession.addMutation('runtime.interaction.completeDragTo', true, dragSession);
			runtimeRunMutationPipeline(internalState);
		},
		completeExtensionDrag(target) {
			const internalState = state();
			const mutationSession = internalState.mutation.getSession();
			const interaction = internalState.state.interaction;
			const dragSession = interaction.dragSession;
			assert(dragSession !== null, 'completeExtensionDrag requires an active drag session');
			assert(
				!isDragSessionCoreOwned(dragSession),
				'completeExtensionDrag can only be called for extension-owned drag sessions'
			);
			assert(
				dragSession.targetSquare === target,
				'The target square in completeExtensionDrag must match the current target square of the drag session'
			);
			internalState.extensionSystem.completeDrag(dragSession);
			internalState.state.interaction.setDragSession(null, mutationSession);
		},
		startReleaseTargetingDrag(source, target): void {
			const internalState = state();
			const mutationSession = internalState.mutation.getSession();
			const interaction = internalState.state.interaction;

			assert(interaction.selected !== null, 'startReleaseTargetingDrag requires a selected piece');
			assert(
				interaction.selected.square === source,
				'startReleaseTargetingDrag source must match selected square'
			);

			const dragSession: DragSession = {
				owner: 'core',
				type: 'release-targeting',
				sourceSquare: source,
				sourcePieceCode: interaction.selected.pieceCode,
				targetSquare: target
			};
			interaction.setDragSession(dragSession, mutationSession);
			runtimeRunMutationPipeline(internalState);
		},
		cancelActiveInteraction() {
			const internalState = state();
			const mutationSession = internalState.mutation.getSession();
			internalState.state.interaction.clearActive(mutationSession);
			runtimeRunMutationPipeline(internalState);
		},
		cancelInteraction() {
			const internalState = state();
			const mutationSession = internalState.mutation.getSession();
			internalState.state.interaction.clear(mutationSession);
			runtimeRunMutationPipeline(internalState);
		},
		updateDragSessionCurrentTarget(target) {
			const internalState = state();
			const interactionMutationSession = internalState.mutation.getSession();
			const interaction = internalState.state.interaction;
			const currentDragSession = interaction.dragSession;
			assert(currentDragSession !== null, 'No active drag session to update');
			internalState.state.interaction.updateDragSessionCurrentTarget(
				target,
				interactionMutationSession
			);
			runtimeRunMutationPipeline(internalState);
		},
		onEvent(context) {
			const internalState = state();
			internalState.extensionSystem.onEvent(context);
		}
	};
}
