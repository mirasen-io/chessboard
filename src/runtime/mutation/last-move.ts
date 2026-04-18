import assert from '@ktarmyshov/assert';
import { RuntimeMutationPipe } from './pipeline';

export const updateLastMoveOnBoardMove: RuntimeMutationPipe = (context, mutationSession) => {
	const { current } = context;
	if (!mutationSession.hasMutation({ causes: ['state.board.move'] })) {
		return;
	}
	const lastMove = mutationSession.getPayloads('state.board.move')?.[0];
	assert(lastMove, 'Expected last move payload to be present after state.board.move mutation');
	current.state.change.setLastMove(lastMove, mutationSession);
};

export const clearLastMoveOnBoardSetPosition: RuntimeMutationPipe = (context, mutationSession) => {
	const { current } = context;
	if (
		!mutationSession.hasMutation({
			causes: ['state.board.setPosition', 'state.board.setPiecePosition']
		})
	) {
		return;
	}
	current.state.change.setLastMove(null, mutationSession);
};
