import assert from '@ktarmyshov/assert';
import { isEmptyPieceCode } from '../../state/board/check';
import { DragSession } from '../../state/interaction/types/internal';
import { InteractionStateSelected } from '../../state/interaction/types/main';
import { RuntimeInteractionSurface } from '../input/controller/types';
import { runtimeRunMutationPipeline } from '../mutation/run';
import { GetInternalState } from '../types/main';
import { uiMoveCompleteTo } from './helpers';

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
		dropTo(target) {
			const internalState = state();
			const mutationSession = internalState.mutation.getSession();
			const interaction = internalState.state.interaction;
			const dragSession = interaction.dragSession;

			assert(dragSession !== null, 'dropTo requires an active drag session');
			assert(
				dragSession.type === 'lifted-piece-drag',
				'dropTo requires a lifted-piece-drag session'
			);

			uiMoveCompleteTo(internalState, target);
			mutationSession.addMutation('runtime.interaction.dropTo', true);
			runtimeRunMutationPipeline(internalState);
		},
		releaseTo(target) {
			const internalState = state();
			const mutationSession = internalState.mutation.getSession();
			const interaction = internalState.state.interaction;
			const dragSession = interaction.dragSession;

			assert(dragSession !== null, 'releaseTo requires an active drag session');
			assert(
				dragSession.type === 'release-targeting',
				'releaseTo requires a release-targeting session'
			);
			uiMoveCompleteTo(internalState, target);
			mutationSession.addMutation('runtime.interaction.releaseTo', true);
			runtimeRunMutationPipeline(internalState);
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
		}
	};
}
