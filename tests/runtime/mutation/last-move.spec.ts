import { describe, expect, it } from 'vitest';
import { createMutationSession } from '../../../src/mutation/session.js';
import {
	clearLastMoveOnBoardSetPosition,
	updateLastMoveOnBoardMove
} from '../../../src/runtime/mutation/last-move.js';
import type { RuntimeMutationPayloadByCause } from '../../../src/runtime/mutation/types.js';
import { normalizeSquare } from '../../../src/state/board/normalize.js';
import { type MoveSnapshot, PieceCode } from '../../../src/state/board/types/internal.js';
import { createMockPipeContext } from '../../test-utils/runtime/mutation.js';

function createSession() {
	return createMutationSession<RuntimeMutationPayloadByCause>();
}

function makeMoveSnapshot(): MoveSnapshot {
	return {
		from: normalizeSquare('e2'),
		to: normalizeSquare('e4'),
		piece: PieceCode.WhitePawn
	};
}

describe('updateLastMoveOnBoardMove', () => {
	it('sets lastMove from move payload when state.board.move mutation present', () => {
		const context = createMockPipeContext();
		const session = createSession();
		const move = makeMoveSnapshot();
		session.addMutation('state.board.move', true, move);

		updateLastMoveOnBoardMove(context, session);

		expect(context.current.state.change.lastMove).toEqual(move);
	});

	it('no-op when state.board.move mutation absent', () => {
		const context = createMockPipeContext();
		const session = createSession();
		session.addMutation('state.board.setPosition', true);

		updateLastMoveOnBoardMove(context, session);

		expect(context.current.state.change.lastMove).toBeNull();
	});
});

describe('clearLastMoveOnBoardSetPosition', () => {
	it('clears lastMove when state.board.setPosition mutation present', () => {
		const context = createMockPipeContext();
		// Set a lastMove first
		const setupSession = createSession();
		const move = makeMoveSnapshot();
		context.current.state.change.setLastMove(move, setupSession);
		expect(context.current.state.change.lastMove).not.toBeNull();

		const session = createSession();
		session.addMutation('state.board.setPosition', true);

		clearLastMoveOnBoardSetPosition(context, session);

		expect(context.current.state.change.lastMove).toBeNull();
	});

	it('clears lastMove when state.board.setPiecePosition mutation present', () => {
		const context = createMockPipeContext();
		const setupSession = createSession();
		const move = makeMoveSnapshot();
		context.current.state.change.setLastMove(move, setupSession);

		const session = createSession();
		session.addMutation('state.board.setPiecePosition', true);

		clearLastMoveOnBoardSetPosition(context, session);

		expect(context.current.state.change.lastMove).toBeNull();
	});

	it('no-op when neither setPosition nor setPiecePosition mutation present', () => {
		const context = createMockPipeContext();
		const setupSession = createSession();
		const move = makeMoveSnapshot();
		context.current.state.change.setLastMove(move, setupSession);

		const session = createSession();
		session.addMutation('state.board.move', true, move);

		clearLastMoveOnBoardSetPosition(context, session);

		expect(context.current.state.change.lastMove).toEqual(move);
	});
});
