import type { BoardRuntimeMuitationPipe } from './types';

export const updateGeometryIfOrientationChanged: BoardRuntimeMuitationPipe = (
	context,
	mutationSession
) => {
	const { previousContext, currentContext } = context;
	// If previous context is null, this is the first mutation run, so no-op
	if (!previousContext) {
		return;
	}
	// We clear interaction state only if the piece in interaction (color or role) changed
	const prevSelectedSquare = previousContext.state.interaction.selectedSquare;
	if (prevSelectedSquare === null) return; // no-op
	const prevPieceCode = previousContext.state.board.pieces[prevSelectedSquare];
	const currentSelectedSquare = currentContext.state.interaction.getSelectedSquare();
	if (currentSelectedSquare === null) return; // no-op
	if (prevSelectedSquare !== currentSelectedSquare) return; // no-op (selected square changed, but we only care if the piece on that square changed)
	const currentPieceCode = currentContext.state.board.getPieceCodeAt(currentSelectedSquare);
	if (prevPieceCode === currentPieceCode) return; // no-op

	// Ok, these are different pieces, so we clear interaction state to avoid mismatches (e.g. selected square with no piece, or just a different piece)
	currentContext.state.interaction.clear(mutationSession);
};
