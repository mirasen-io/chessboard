import assert from '@ktarmyshov/assert';
import { RuntimeMutationPipe } from './pipeline';

export const updateLastMoveOnBoardMove: RuntimeMutationPipe = (context, mutationSession) => {
	const { current } = context;
	if (!mutationSession.hasMutation({ causes: ['state.board.move'] })) {
		return;
	}
	const lastMove = mutationSession.getPayloads('state.board.move')?.[0];
	assert(lastMove, 'Expected last move payload to be present after state.board.move mutation');
	// @ts-expect-error - We know this mutation session is a ChangeStateMutationSession
	// but the type system doesn't recognize that based on the mutation cause. We should consider improving the type system to better capture this relationship.
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
	// @ts-expect-error - We know this mutation session is a ChangeStateMutationSession
	// but the type system doesn't recognize that based on the mutation cause. We should consider improving the type system to better capture this relationship.
	current.state.change.setLastMove(null, mutationSession);
};
