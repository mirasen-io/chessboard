import { describe, expect, it } from 'vitest';
import {
	createInvalidationState,
	createInvalidationWriter
} from '../../../src/core/scheduler/invalidationState';
import { DirtyLayer } from '../../../src/core/scheduler/types';
import { move, setBoardPosition, setTurn } from '../../../src/core/state/boardReducers';
import { createBoardState } from '../../../src/core/state/boardState';
import type { Square } from '../../../src/core/state/boardTypes';
import { fromAlgebraic } from '../../../src/core/state/coords';
import { decodePiece } from '../../../src/core/state/encode';

/** Helper: fresh invalidation state + writer pair for each test */
function makeInv() {
	const state = createInvalidationState();
	const writer = createInvalidationWriter(state);
	return { inv: state, writer };
}

describe('state/boardReducers', () => {
	describe('setBoardPosition', () => {
		it('with "start" sets pieces, ids, turn from FEN and marks Board|Pieces dirty', () => {
			const board = createBoardState();
			const { inv, writer } = makeInv();

			const changed = setBoardPosition(board, writer, 'start');

			expect(changed).toBe(true);
			expect(board.pieces).toBeInstanceOf(Uint8Array);
			expect(board.pieces.length).toBe(64);
			expect(board.ids.length).toBe(64);
			expect(board.turn).toBe('white'); // START_FEN active color

			expect(inv.layers & DirtyLayer.Board).not.toBe(0);
			expect(inv.layers & DirtyLayer.Pieces).not.toBe(0);
		});

		it('with FEN sets turn from FEN active color', () => {
			const board = createBoardState();
			const { writer } = makeInv();

			setBoardPosition(board, writer, '8/8/8/8/8/8/8/8 b - - 0 1');

			expect(board.turn).toBe('black');
		});

		it('with PositionMapShort encodes pieces and preserves current turn', () => {
			const board = createBoardState({ turn: 'black' });
			const { writer } = makeInv();

			setBoardPosition(board, writer, {
				a1: { color: 'w', role: 'K' },
				a2: { color: 'w', role: 'p' },
				a7: { color: 'b', role: 'p' },
				a8: { color: 'b', role: 'K' }
			});

			expect(board.pieces[fromAlgebraic('a1')]).not.toBe(0);
			expect(board.pieces[fromAlgebraic('a2')]).not.toBe(0);
			expect(board.pieces[fromAlgebraic('a7')]).not.toBe(0);
			expect(board.pieces[fromAlgebraic('a8')]).not.toBe(0);

			// Position map does not carry turn — current turn is preserved
			expect(board.turn).toBe('black');
		});

		it('reassigns fresh ids for all occupied squares', () => {
			const board = createBoardState({ position: 'start' });
			const { writer } = makeInv();

			setBoardPosition(board, writer, { e4: { color: 'w', role: 'p' } });

			const e4 = fromAlgebraic('e4');
			expect(board.ids[e4]).toBeGreaterThan(0);

			// All other squares should be empty
			const e2 = fromAlgebraic('e2');
			expect(board.ids[e2]).toBe(-1);
		});

		it('returns true when position is applied', () => {
			const board = createBoardState();
			const { writer } = makeInv();

			const changed = setBoardPosition(board, writer, 'start');
			expect(changed).toBe(true);
		});
	});

	describe('setTurn', () => {
		it('updates turn and returns true when changed', () => {
			const board = createBoardState({ turn: 'white' });

			const changed = setTurn(board, 'black');

			expect(changed).toBe(true);
			expect(board.turn).toBe('black');
		});

		it('is a no-op and returns false when turn is unchanged', () => {
			const board = createBoardState({ turn: 'white' });

			const changed = setTurn(board, 'white');

			expect(changed).toBe(false);
			expect(board.turn).toBe('white');
		});

		it('accepts short color input', () => {
			const board = createBoardState({ turn: 'white' });

			setTurn(board, 'b');

			expect(board.turn).toBe('black');
		});

		it('does not take an InvalidationWriter (no dirty side-effects)', () => {
			// setTurn signature: (state, c) — no writer parameter
			// This is a compile-time contract; we verify it by calling with exactly 2 args
			const board = createBoardState({ turn: 'white' });
			expect(() => setTurn(board, 'black')).not.toThrow();
		});
	});

	describe('move', () => {
		it('moves piece, preserves id, toggles turn, marks dirty squares and Pieces layer', () => {
			const board = createBoardState({
				position: { e2: { color: 'w', role: 'p' } },
				turn: 'white'
			});
			const { inv, writer } = makeInv();

			const from = fromAlgebraic('e2');
			const to = fromAlgebraic('e4');
			const idFrom = board.ids[from];
			expect(idFrom).toBeGreaterThan(0);

			const result = move(board, writer, { from, to });

			// Source cleared, destination occupied
			expect(board.pieces[from]).toBe(0);
			expect(board.ids[from]).toBe(-1);
			expect(board.pieces[to]).not.toBe(0);
			expect(board.ids[to]).toBe(idFrom); // id preserved

			// Turn toggled
			expect(board.turn).toBe('black');

			// Move result metadata
			expect(result.from).toBe(from);
			expect(result.to).toBe(to);
			expect(result.moved.role).toBe('pawn');
			expect(result.moved.color).toBe('white');
			expect(result.captured).toBeUndefined();
			expect(result.promotion).toBeUndefined();

			// Dirty tracking
			expect(inv.squares.has(from)).toBe(true);
			expect(inv.squares.has(to)).toBe(true);
			expect(inv.layers & DirtyLayer.Pieces).not.toBe(0);
		});

		it('applies promotion and reflects it in result', () => {
			const board = createBoardState({
				position: { a7: { color: 'w', role: 'p' } },
				turn: 'white'
			});
			const { writer } = makeInv();

			const result = move(board, writer, { from: 'a7', to: 'a8' }, { promotion: 'Q' });

			const a8 = fromAlgebraic('a8');
			const piece = decodePiece(board.pieces[a8]);
			expect(piece).not.toBeNull();
			expect(piece!.role).toBe('queen');
			expect(piece!.color).toBe('white');

			expect(result.promotion).toBe('queen');
			expect(result.moved.role).toBe('pawn'); // pre-promotion role
		});

		it('applies promotion with long-form input', () => {
			const board = createBoardState({
				position: { a7: { color: 'w', role: 'p' } },
				turn: 'white'
			});
			const { writer } = makeInv();

			const result = move(board, writer, { from: 'a7', to: 'a8' }, { promotion: 'queen' });

			expect(result.promotion).toBe('queen');
		});

		it('records captured piece in result', () => {
			const board = createBoardState({
				position: {
					e4: { color: 'w', role: 'p' },
					e5: { color: 'b', role: 'p' }
				},
				turn: 'white'
			});
			const { writer } = makeInv();

			const result = move(board, writer, { from: 'e4', to: 'e5' });

			expect(result.captured).toBeDefined();
			expect(result.captured!.role).toBe('pawn');
			expect(result.captured!.color).toBe('black');
		});

		it('en passant-like capture clears capturedSquare and marks it dirty', () => {
			const board = createBoardState({
				position: {
					e5: { color: 'w', role: 'p' },
					d5: { color: 'b', role: 'p' }
				},
				turn: 'white'
			});
			const { inv, writer } = makeInv();

			const result = move(board, writer, { from: 'e5', to: 'd6' }, { capturedSquare: 'd5' });

			const d5 = fromAlgebraic('d5');
			const d6 = fromAlgebraic('d6');
			const e5 = fromAlgebraic('e5');

			expect(board.pieces[d5]).toBe(0);
			expect(board.ids[d5]).toBe(-1);
			expect(board.pieces[e5]).toBe(0);
			expect(board.pieces[d6]).not.toBe(0);

			expect(result.captured).toBeDefined();
			expect(result.captured!.role).toBe('pawn');
			expect(result.captured!.color).toBe('black');
			expect(result.capturedSquare).toBe(d5);

			expect(inv.squares.has(d5)).toBe(true);
		});

		it('castling moves rook and returns castle metadata', () => {
			const board = createBoardState({
				position: {
					e1: { color: 'w', role: 'K' },
					h1: { color: 'w', role: 'R' }
				},
				turn: 'white'
			});
			const { inv, writer } = makeInv();

			const e1 = fromAlgebraic('e1');
			const g1 = fromAlgebraic('g1');
			const h1 = fromAlgebraic('h1');
			const f1 = fromAlgebraic('f1');

			const result = move(
				board,
				writer,
				{ from: 'e1', to: 'g1', castleSide: 'kingside' },
				{ castle: { rookFrom: 'h1', rookTo: 'f1' } }
			);

			// King moved e1 -> g1
			expect(board.pieces[e1]).toBe(0);
			expect(board.pieces[g1]).not.toBe(0);

			// Rook moved h1 -> f1
			const rookAtF1 = decodePiece(board.pieces[f1]);
			expect(rookAtF1).not.toBeNull();
			expect(rookAtF1!.role).toBe('rook');
			expect(rookAtF1!.color).toBe('white');
			expect(board.pieces[h1]).toBe(0);

			expect(result.castleSide).toBe('kingside');
			expect(result.castle).toBeDefined();
			expect(result.castle!.rookFrom).toBe(h1);
			expect(result.castle!.rookTo).toBe(f1);

			// All four squares dirty
			expect(inv.squares.has(e1 as Square)).toBe(true);
			expect(inv.squares.has(g1 as Square)).toBe(true);
			expect(inv.squares.has(h1 as Square)).toBe(true);
			expect(inv.squares.has(f1 as Square)).toBe(true);
		});

		it('throws RangeError when moving from empty square', () => {
			const board = createBoardState({ position: {} });
			const { writer } = makeInv();

			expect(() => move(board, writer, { from: 'e2', to: 'e4' })).toThrow(RangeError);
		});
	});
});
