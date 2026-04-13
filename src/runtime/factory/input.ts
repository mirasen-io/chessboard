import assert from '@ktarmyshov/assert';
import { isEmpty } from '../../state/board/encode';
import { BoardStateMutationSession } from '../../state/board/mutation';
import { MoveInput } from '../../state/board/types';
import { InteractionStateMutationSession } from '../../state/interaction/mutation';
import { DragSession, InteractionStateSelected } from '../../state/interaction/types';
import { RuntimeInteractionSurface } from '../input/controller/types';
import { runtimeRunMutationPipeline } from '../mutation/run';
import { GetInternalState } from '../types';

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
			const interactionMutationSession =
				internalState.mutation.getSession() as InteractionStateMutationSession;
			const interaction = internalState.state.interaction;

			const pieceCode = internalState.state.board.getPieceCodeAt(source);
			assert(!isEmpty(pieceCode), 'Cannot start a lifted-piece-drag session from an empty square');
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
			interaction.setDragSession(
				dragSession,
				interactionMutationSession as InteractionStateMutationSession
			);
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
			assert(
				dragSession.targetSquare === target,
				'dropTo target must match drag session current target'
			);
			assert(interaction.selected !== null, 'dropTo requires a selected piece');
			assert(!isEmpty(interaction.selected.pieceCode), 'Selected piece must be valid');
			assert(
				dragSession.sourceSquare === interaction.selected.square,
				'drag session source must match selected square'
			);

			const destination = interaction.activeDestinations.get(target);
			const moveInput: MoveInput = destination
				? { from: dragSession.sourceSquare, ...destination }
				: { from: dragSession.sourceSquare, to: target };
			const move = internalState.state.board.move(
				moveInput,
				mutationSession as unknown as BoardStateMutationSession
			);
			mutationSession.addMutation('runtime.interaction.dropTo', true);

			interaction.clear(mutationSession as InteractionStateMutationSession);
			runtimeRunMutationPipeline(internalState);
			return move;
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
			assert(
				dragSession.targetSquare === target,
				'releaseTo target must match drag session current target'
			);
			assert(interaction.selected !== null, 'releaseTo requires a selected piece');
			assert(!isEmpty(interaction.selected.pieceCode), 'Selected piece must be valid');
			assert(
				dragSession.sourceSquare === interaction.selected.square,
				'drag session source must match selected square'
			);

			const destination = interaction.activeDestinations.get(target);
			const moveInput: MoveInput = destination
				? { from: dragSession.sourceSquare, ...destination }
				: { from: dragSession.sourceSquare, to: target };
			const move = internalState.state.board.move(
				moveInput,
				mutationSession as unknown as BoardStateMutationSession
			);
			mutationSession.addMutation('runtime.interaction.releaseTo', true);

			interaction.clear(mutationSession as InteractionStateMutationSession);
			runtimeRunMutationPipeline(internalState);
			return move;
		},
		startReleaseTargetingDrag(source, target): void {
			const internalState = state();
			const mutationSession =
				internalState.mutation.getSession() as InteractionStateMutationSession;
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
			const mutationSession =
				internalState.mutation.getSession() as InteractionStateMutationSession;
			internalState.state.interaction.clearActive(mutationSession);
			runtimeRunMutationPipeline(internalState);
		},
		cancelInteraction() {
			const internalState = state();
			const mutationSession =
				internalState.mutation.getSession() as InteractionStateMutationSession;
			internalState.state.interaction.clear(mutationSession);
			runtimeRunMutationPipeline(internalState);
		},
		updateDragSessionCurrentTarget(target) {
			const internalState = state();
			const interactionMutationSession =
				internalState.mutation.getSession() as InteractionStateMutationSession;
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
