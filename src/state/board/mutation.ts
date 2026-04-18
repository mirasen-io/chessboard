import type { MutationSession } from '../../mutation/types';
import type { MoveSnapshot } from './types/internal';

export type BoardStateMutationPayloadByCause = {
	'state.board.setPosition': undefined;
	'state.board.setPiecePosition': undefined;
	'state.board.setTurn': undefined;
	'state.board.move': MoveSnapshot;
};

export type BoardStateMutationSession = MutationSession<BoardStateMutationPayloadByCause>;
