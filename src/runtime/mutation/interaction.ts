import { isEmptyPieceCode } from '../../state/board/check.js';
import { selectedEqual } from '../../state/interaction/helpers.js';
import { InteractionStateSelected } from '../../state/interaction/types/main.js';
import { RuntimeMutationPipe } from './pipeline.js';

export const reconcileInteractionSelectionAfterBoardStateChange: RuntimeMutationPipe = (
	context,
	mutationSession
) => {
	const { current } = context;
	if (
		!mutationSession.hasMutation({ prefixes: ['state.board.'] }) ||
		mutationSession.hasMutation({
			causes: ['state.interaction.clear', 'runtime.interaction.completeCoreDragTo']
		})
	) {
		return;
	}
	const currentSelected = current.state.interaction.selected ?? null;
	const currentSelectedSquare = currentSelected?.square ?? null;
	const wouldBeCurrentSelectedPieceCode =
		currentSelectedSquare !== null
			? current.state.board.getPieceCodeAt(currentSelectedSquare)
			: null;

	const wouldBeCurrentSelected: InteractionStateSelected | null =
		currentSelectedSquare !== null &&
		wouldBeCurrentSelectedPieceCode !== null &&
		!isEmptyPieceCode(wouldBeCurrentSelectedPieceCode)
			? {
					square: currentSelectedSquare,
					pieceCode: wouldBeCurrentSelectedPieceCode
				}
			: null;

	const notChanged = selectedEqual(currentSelected, wouldBeCurrentSelected);
	if (notChanged) {
		current.state.interaction.updateActiveDestinations(mutationSession);
		return;
	}
	current.state.interaction.clear(mutationSession);
};
