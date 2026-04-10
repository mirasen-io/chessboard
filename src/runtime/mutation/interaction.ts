import { selectedEqual } from '../../state/interaction/helpers';
import { InteractionStateMutationSession } from '../../state/interaction/mutation';
import { InteractionStateSelected } from '../../state/interaction/types';
import { RuntimeMutationPipe } from './pipeline';

export const reconcileInteractionSelectionAfterBoardStateChange: RuntimeMutationPipe = (
	context,
	mutationSession
) => {
	const { current } = context;
	if (!mutationSession.hasMutation({ prefixes: ['state.board.'] })) {
		return;
	}
	const currentSelected = current.state.interaction.selected ?? null;
	const currentSelectedSquare = currentSelected?.square ?? null;
	const wouldBeCurrentSelectedPieceCode =
		currentSelectedSquare !== null
			? current.state.board.getPieceCodeAt(currentSelectedSquare)
			: null;

	const wouldBeCurrentSelected: InteractionStateSelected | null =
		currentSelectedSquare !== null && wouldBeCurrentSelectedPieceCode !== null
			? {
					square: currentSelectedSquare,
					pieceCode: wouldBeCurrentSelectedPieceCode
				}
			: null;

	const notChanged = selectedEqual(currentSelected, wouldBeCurrentSelected);
	if (notChanged) {
		current.state.interaction.updateActiveDestinations(
			mutationSession as InteractionStateMutationSession
		);
		return;
	}
	current.state.interaction.clear(mutationSession as InteractionStateMutationSession);
};
