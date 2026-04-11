import assert from '@ktarmyshov/assert';
import { InteractionStateMutationSession } from '../../state/interaction/mutation';
import { DragSession, InteractionStateSelected } from '../../state/interaction/types';
import { RuntimeInteractionSurface } from '../input/controller/types';
import { runtimeRunMutationPipeline } from '../mutation/run';
import { GetInternalState } from '../types';

export function createRuntimeInteractionSurface(
	state: GetInternalState
): RuntimeInteractionSurface {
	// @ts-expect-error - TODO: WIP
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
			assert(pieceCode !== 0, 'Cannot start a lifted-piece-drag session from an empty square');
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
		}
	};
}
