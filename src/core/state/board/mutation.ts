import type { MutationSession } from '../../mutation/types';
import type { MoveSnapshot } from './types';

export type BoardStateMutationPayloadByCause = {
	'board.state.setPosition': undefined;
	'board.state.setTurn': undefined;
	'board.state.move': MoveSnapshot;
};

export type BoardStateMutationCause = keyof BoardStateMutationPayloadByCause;

export type BoardStateMutationSession = MutationSession<BoardStateMutationPayloadByCause>;
