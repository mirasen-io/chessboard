import type { MutationSession } from '../../mutation/types';
import type { MoveSnapshot } from './types';

export type BoardStateMutationPayloadByCause = {
	'state.board.setPosition': undefined;
	'state.board.setTurn': undefined;
	'state.board.move': MoveSnapshot;
};

export type BoardStateMutationCause = keyof BoardStateMutationPayloadByCause;

export type BoardStateMutationSession = MutationSession<BoardStateMutationPayloadByCause>;
