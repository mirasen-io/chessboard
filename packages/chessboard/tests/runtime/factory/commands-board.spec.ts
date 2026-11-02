import { describe, expect, it } from 'vitest';
import { createRuntime } from '../../../src/runtime/factory/main.js';
import { normalizeSquare } from '../../../src/state/board/normalize.js';
import { PieceCode } from '../../../src/state/board/types/internal.js';

function createTestRuntime() {
	return createRuntime({ element: document.createElement('div') });
}

describe('runtime board commands', () => {
	describe('setPosition', () => {
		it('returns true when setting a new position', () => {
			const runtime = createTestRuntime();
			const result = runtime.setPosition({ pieces: { e4: 'wP' }, turn: 'white' });
			expect(result).toBe(true);
		});

		it('returns false when setting same position (idempotent no-op)', () => {
			const runtime = createTestRuntime();
			// Default is start position with white turn; setting same should be no-op
			const result = runtime.setPosition('start');
			expect(result).toBe(false);
		});

		it('snapshot reflects new position after setPosition', () => {
			const runtime = createTestRuntime();
			runtime.setPosition({ pieces: { a1: 'wR', h8: 'bK' }, turn: 'black' });

			const snapshot = runtime.getSnapshot();
			expect(snapshot.state.board.pieces[normalizeSquare('a1')]).toBe(PieceCode.WhiteRook);
			expect(snapshot.state.board.pieces[normalizeSquare('h8')]).toBe(PieceCode.BlackKing);
			expect(snapshot.state.board.pieces[normalizeSquare('e1')]).toBe(PieceCode.Empty);
			expect(snapshot.state.board.turn).toBe(8); // ColorCode.Black
		});

		it('increments positionEpoch on setPosition', () => {
			const runtime = createTestRuntime();
			const epochBefore = runtime.getSnapshot().state.board.positionEpoch;

			runtime.setPosition({ pieces: { e4: 'wP' } });

			const epochAfter = runtime.getSnapshot().state.board.positionEpoch;
			expect(epochAfter).toBeGreaterThan(epochBefore);
		});

		it('clears lastMove after setPosition with a different position', () => {
			const runtime = createTestRuntime();
			// Make a move to set lastMove
			runtime.move({ from: 'e2', to: 'e4' });
			expect(runtime.getSnapshot().state.change.lastMove).not.toBeNull();

			// setPosition with a genuinely different position should clear it
			runtime.setPosition('start');
			expect(runtime.getSnapshot().state.change.lastMove).toBeNull();
		});

		it('setPosition with equivalent post-move position is no-op and preserves lastMove', () => {
			const runtime = createTestRuntime();
			// Make a real move
			runtime.move({ from: 'e2', to: 'e4' });
			const snapshotAfterMove = runtime.getSnapshot();
			expect(snapshotAfterMove.state.change.lastMove).not.toBeNull();
			const lastMoveBefore = snapshotAfterMove.state.change.lastMove;

			// Build the equivalent position: start position with pawn moved e2→e4, black turn
			// This is the same board state the runtime already has after the move
			const result = runtime.setPosition({
				pieces: {
					a1: 'wR',
					b1: 'wN',
					c1: 'wB',
					d1: 'wQ',
					e1: 'wK',
					f1: 'wB',
					g1: 'wN',
					h1: 'wR',
					a2: 'wP',
					b2: 'wP',
					c2: 'wP',
					d2: 'wP',
					// e2 is now empty (pawn moved)
					f2: 'wP',
					g2: 'wP',
					h2: 'wP',
					e4: 'wP', // pawn is here now
					a7: 'bP',
					b7: 'bP',
					c7: 'bP',
					d7: 'bP',
					e7: 'bP',
					f7: 'bP',
					g7: 'bP',
					h7: 'bP',
					a8: 'bR',
					b8: 'bN',
					c8: 'bB',
					d8: 'bQ',
					e8: 'bK',
					f8: 'bB',
					g8: 'bN',
					h8: 'bR'
				},
				turn: 'black'
			});

			// Should be no-op because position is semantically identical
			expect(result).toBe(false);

			// lastMove must still be present and unchanged
			const snapshotAfter = runtime.getSnapshot();
			expect(snapshotAfter.state.change.lastMove).toEqual(lastMoveBefore);
		});
	});

	describe('setPiecePosition', () => {
		it('returns true when setting new piece positions', () => {
			const runtime = createTestRuntime();
			const result = runtime.setPiecePosition({ e4: 'wP' });
			expect(result).toBe(true);
		});

		it('snapshot reflects new pieces after setPiecePosition', () => {
			const runtime = createTestRuntime();
			runtime.setPiecePosition({ a1: 'wQ', b2: 'bN' });

			const snapshot = runtime.getSnapshot();
			expect(snapshot.state.board.pieces[normalizeSquare('a1')]).toBe(PieceCode.WhiteQueen);
			expect(snapshot.state.board.pieces[normalizeSquare('b2')]).toBe(PieceCode.BlackKnight);
		});

		it('does not change turn', () => {
			const runtime = createTestRuntime();
			const turnBefore = runtime.getSnapshot().state.board.turn;

			runtime.setPiecePosition({ e4: 'wP' });

			expect(runtime.getSnapshot().state.board.turn).toBe(turnBefore);
		});

		it('clears lastMove after setPiecePosition with different pieces', () => {
			const runtime = createTestRuntime();
			runtime.move({ from: 'e2', to: 'e4' });
			expect(runtime.getSnapshot().state.change.lastMove).not.toBeNull();

			runtime.setPiecePosition({ a1: 'wR' });
			expect(runtime.getSnapshot().state.change.lastMove).toBeNull();
		});
	});

	describe('setTurn', () => {
		it('returns true when changing turn', () => {
			const runtime = createTestRuntime();
			const result = runtime.setTurn('black');
			expect(result).toBe(true);
		});

		it('returns false when turn is already the same', () => {
			const runtime = createTestRuntime();
			// Default is white
			const result = runtime.setTurn('white');
			expect(result).toBe(false);
		});

		it('snapshot reflects new turn', () => {
			const runtime = createTestRuntime();
			runtime.setTurn('black');
			expect(runtime.getSnapshot().state.board.turn).toBe(8); // ColorCode.Black
		});

		it('clears lastMove when turn changes', () => {
			const runtime = createTestRuntime();
			// Make a move to set lastMove (turn becomes black)
			runtime.move({ from: 'e2', to: 'e4' });
			expect(runtime.getSnapshot().state.change.lastMove).not.toBeNull();

			// Change turn back to white — should clear lastMove
			const result = runtime.setTurn('white');
			expect(result).toBe(true);
			expect(runtime.getSnapshot().state.change.lastMove).toBeNull();
		});
	});

	describe('move', () => {
		it('returns Move result with from, to, piece', () => {
			const runtime = createTestRuntime();
			const move = runtime.move({ from: 'e2', to: 'e4' });

			expect(move.from).toBe(normalizeSquare('e2'));
			expect(move.to).toBe(normalizeSquare('e4'));
			expect(move.piece).toBe(PieceCode.WhitePawn);
		});

		it('updates snapshot: piece moved and turn switched', () => {
			const runtime = createTestRuntime();
			runtime.move({ from: 'e2', to: 'e4' });

			const snapshot = runtime.getSnapshot();
			expect(snapshot.state.board.pieces[normalizeSquare('e2')]).toBe(PieceCode.Empty);
			expect(snapshot.state.board.pieces[normalizeSquare('e4')]).toBe(PieceCode.WhitePawn);
			expect(snapshot.state.board.turn).toBe(8); // ColorCode.Black
		});

		it('sets lastMove after move', () => {
			const runtime = createTestRuntime();
			const move = runtime.move({ from: 'e2', to: 'e4' });

			const snapshot = runtime.getSnapshot();
			expect(snapshot.state.change.lastMove).not.toBeNull();
			expect(snapshot.state.change.lastMove!.from).toBe(move.from);
			expect(snapshot.state.change.lastMove!.to).toBe(move.to);
		});

		it('increments positionEpoch after move', () => {
			const runtime = createTestRuntime();
			const epochBefore = runtime.getSnapshot().state.board.positionEpoch;

			runtime.move({ from: 'e2', to: 'e4' });

			expect(runtime.getSnapshot().state.board.positionEpoch).toBeGreaterThan(epochBefore);
		});
	});
});
