import { describe, expect, it } from 'vitest';
import { createMutationSession } from '../../../src/mutation/session.js';
import { createBoardState } from '../../../src/state/board/factory.js';
import type { BoardStateMutationPayloadByCause } from '../../../src/state/board/mutation.js';
import { normalizeSquare } from '../../../src/state/board/normalize.js';
import { ColorCode, PieceCode } from '../../../src/state/board/types/internal.js';

function createBoardMutationSession() {
	return createMutationSession<BoardStateMutationPayloadByCause>();
}

describe('createBoardState', () => {
	it('creates default start position with White turn and epoch 0', () => {
		const board = createBoardState();
		const snapshot = board.getSnapshot();

		expect(snapshot.turn).toBe(ColorCode.White);
		expect(snapshot.positionEpoch).toBe(0);
		expect(snapshot.pieces[normalizeSquare('e1')]).toBe(PieceCode.WhiteKing);
		expect(snapshot.pieces[normalizeSquare('e8')]).toBe(PieceCode.BlackKing);
		expect(snapshot.pieces[normalizeSquare('e4')]).toBe(PieceCode.Empty);
	});

	it('creates board with custom PositionInputObject', () => {
		const board = createBoardState({ pieces: { e2: 'wP', d7: 'bP' }, turn: 'black' });
		const snapshot = board.getSnapshot();

		expect(snapshot.turn).toBe(ColorCode.Black);
		expect(snapshot.pieces[normalizeSquare('e2')]).toBe(PieceCode.WhitePawn);
		expect(snapshot.pieces[normalizeSquare('d7')]).toBe(PieceCode.BlackPawn);
		expect(snapshot.pieces[normalizeSquare('a1')]).toBe(PieceCode.Empty);
	});

	it('getSnapshot returns a deep clone that does not affect internal state', () => {
		const board = createBoardState();
		const snapshot = board.getSnapshot();

		// Mutate the returned snapshot's pieces array
		(snapshot.pieces as Uint8Array)[normalizeSquare('e1')] = PieceCode.Empty;

		// Internal state should be unaffected
		const freshSnapshot = board.getSnapshot();
		expect(freshSnapshot.pieces[normalizeSquare('e1')]).toBe(PieceCode.WhiteKing);
		expect(freshSnapshot.pieces).not.toBe(snapshot.pieces);
	});

	it('getPieceCodeAt reads correct piece code', () => {
		const board = createBoardState();

		expect(board.getPieceCodeAt(normalizeSquare('e1'))).toBe(PieceCode.WhiteKing);
		expect(board.getPieceCodeAt(normalizeSquare('e8'))).toBe(PieceCode.BlackKing);
		expect(board.getPieceCodeAt(normalizeSquare('e4'))).toBe(PieceCode.Empty);
	});

	it('setPosition updates state and records mutation', () => {
		const board = createBoardState();
		const session = createBoardMutationSession();

		const changed = board.setPosition({ pieces: { a1: 'wR' }, turn: 'black' }, session);

		expect(changed).toBe(true);
		expect(session.hasMutation({ causes: ['state.board.setPosition'] })).toBe(true);

		const snapshot = board.getSnapshot();
		expect(snapshot.pieces[normalizeSquare('a1')]).toBe(PieceCode.WhiteRook);
		expect(snapshot.turn).toBe(ColorCode.Black);
		expect(snapshot.positionEpoch).toBe(1);
	});

	it('setTurn updates turn and no-op returns false', () => {
		const board = createBoardState();

		// Change from White to Black
		const session1 = createBoardMutationSession();
		const changed1 = board.setTurn('black', session1);
		expect(changed1).toBe(true);
		expect(session1.hasMutation({ causes: ['state.board.setTurn'] })).toBe(true);
		expect(board.getSnapshot().turn).toBe(ColorCode.Black);

		// No-op: already Black
		const session2 = createBoardMutationSession();
		const changed2 = board.setTurn('black', session2);
		expect(changed2).toBe(false);
		expect(session2.hasMutation({ causes: ['state.board.setTurn'] })).toBe(false);
	});

	it('move with MoveRequestInput (string squares) executes and records mutation', () => {
		const board = createBoardState();
		const session = createBoardMutationSession();

		const move = board.move({ from: 'e2', to: 'e4' }, session);

		expect(move.from).toBe(normalizeSquare('e2'));
		expect(move.to).toBe(normalizeSquare('e4'));
		expect(move.piece).toBe(PieceCode.WhitePawn);
		expect(session.hasMutation({ causes: ['state.board.move'] })).toBe(true);

		const snapshot = board.getSnapshot();
		expect(snapshot.pieces[normalizeSquare('e2')]).toBe(PieceCode.Empty);
		expect(snapshot.pieces[normalizeSquare('e4')]).toBe(PieceCode.WhitePawn);
		expect(snapshot.turn).toBe(ColorCode.Black);
	});

	it('move with pre-normalized MoveRequest (numeric squares) executes correctly', () => {
		const board = createBoardState();
		const session = createBoardMutationSession();

		const from = normalizeSquare('d2');
		const to = normalizeSquare('d4');

		const move = board.move({ from, to }, session);

		expect(move.from).toBe(from);
		expect(move.to).toBe(to);
		expect(move.piece).toBe(PieceCode.WhitePawn);
		expect(session.hasMutation({ causes: ['state.board.move'] })).toBe(true);

		expect(board.getPieceCodeAt(from)).toBe(PieceCode.Empty);
		expect(board.getPieceCodeAt(to)).toBe(PieceCode.WhitePawn);
	});
});
