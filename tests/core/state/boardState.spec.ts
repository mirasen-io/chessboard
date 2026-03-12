import { describe, expect, it } from 'vitest';
import { createBoardState, getBoardStateSnapshot } from '../../../src/core/state/boardState';
import { fromAlgebraic } from '../../../src/core/state/coords';

describe('state/boardState', () => {
	describe('createBoardState', () => {
		it('creates internal state with board-owned fields only', () => {
			const state = createBoardState({ position: 'start' });

			expect(state.pieces).toBeInstanceOf(Uint8Array);
			expect(state.pieces.length).toBe(64);
			expect(state.ids).toBeInstanceOf(Int16Array);
			expect(state.ids.length).toBe(64);
			expect(state.turn).toBe('white');
			expect(typeof state.nextId).toBe('number');
			expect(state.nextId).toBeGreaterThan(0);

			// Board state does NOT contain view-owned fields
			expect('orientation' in state).toBe(false);
			expect('selected' in state).toBe(false);
			expect('movability' in state).toBe(false);
		});

		it('assigns positive ids for occupied squares and -1 for empty squares', () => {
			const state = createBoardState({ position: 'start' });

			const a1 = fromAlgebraic('a1'); // occupied in start
			const a2 = fromAlgebraic('a2'); // occupied in start
			const e4 = fromAlgebraic('e4'); // empty in start

			expect(state.ids[a1]).toBeGreaterThan(0);
			expect(state.ids[a2]).toBeGreaterThan(0);
			expect(state.ids[e4]).toBe(-1);
		});

		it('sets turn from FEN active color', () => {
			const state = createBoardState({ position: '8/8/8/8/8/8/8/8 b - - 0 1' });
			expect(state.turn).toBe('black');
		});

		it('respects explicit turn override over FEN active color', () => {
			const state = createBoardState({ position: 'start', turn: 'b' });
			expect(state.turn).toBe('black');
		});

		it('defaults to start position when no options provided', () => {
			const state = createBoardState();
			expect(state.turn).toBe('white');
			// a1 (rook) should be occupied
			expect(state.pieces[fromAlgebraic('a1')]).not.toBe(0);
		});
	});

	describe('getBoardStateSnapshot', () => {
		it('snapshot contains exactly board-owned fields: pieces, ids, turn', () => {
			const state = createBoardState({ position: 'start' });
			const snap = getBoardStateSnapshot(state);

			// Snapshot has board-owned fields
			expect('pieces' in snap).toBe(true);
			expect('ids' in snap).toBe(true);
			expect('turn' in snap).toBe(true);

			// Snapshot does NOT expose nextId (internal implementation detail)
			expect('nextId' in snap).toBe(false);

			// Snapshot does NOT expose view-owned fields
			expect('orientation' in snap).toBe(false);
			expect('selected' in snap).toBe(false);
			expect('movability' in snap).toBe(false);
		});

		it('snapshot pieces is a clone: different reference, same content', () => {
			const state = createBoardState({ position: 'start' });
			const snap = getBoardStateSnapshot(state);

			expect(snap.pieces).not.toBe(state.pieces);
			for (let i = 0; i < 64; i++) {
				expect(snap.pieces[i]).toBe(state.pieces[i]);
			}
		});

		it('snapshot ids is a clone: different reference, same content', () => {
			const state = createBoardState({ position: 'start' });
			const snap = getBoardStateSnapshot(state);

			expect(snap.ids).not.toBe(state.ids);
			for (let i = 0; i < 64; i++) {
				expect(snap.ids[i]).toBe(state.ids[i]);
			}
		});

		it('mutating snapshot pieces does not affect internal state', () => {
			const state = createBoardState({ position: 'start' });
			const snap = getBoardStateSnapshot(state);
			const original = state.pieces[0];

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(snap as any).pieces[0] = 99;
			expect(state.pieces[0]).toBe(original);
		});

		it('snapshot turn matches internal state turn', () => {
			const state = createBoardState({ position: 'start', turn: 'black' });
			const snap = getBoardStateSnapshot(state);
			expect(snap.turn).toBe('black');
		});
	});
});
