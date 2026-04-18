import { describe, expect, it } from 'vitest';
import { createViewState, getViewStateSnapshot } from '../../../src/core/state/viewState';

describe('state/viewState', () => {
	describe('createViewState', () => {
		it('creates internal state with view-owned fields only', () => {
			const state = createViewState();

			expect('orientation' in state).toBe(true);
			expect('movability' in state).toBe(true);

			// View state does NOT contain board-owned fields
			expect('pieces' in state).toBe(false);
			expect('ids' in state).toBe(false);
			expect('turn' in state).toBe(false);
			expect('nextId' in state).toBe(false);

			// View state does NOT contain interaction-owned fields
			expect('selected' in state).toBe(false);
			expect('selectedSquare' in state).toBe(false);
			expect('destinations' in state).toBe(false);
			expect('dragSession' in state).toBe(false);
		});

		it('defaults: orientation=white, movability=disabled', () => {
			const state = createViewState();
			expect(state.orientation).toBe('white');
			expect(state.movability).toEqual({ mode: 'disabled' });
		});

		it('respects orientation override (long form)', () => {
			const state = createViewState({ orientation: 'black' });
			expect(state.orientation).toBe('black');
		});

		it('respects orientation override (short form)', () => {
			const state = createViewState({ orientation: 'b' });
			expect(state.orientation).toBe('black');
		});

		it('respects movability override', () => {
			const state = createViewState({ movability: { mode: 'free' } });
			expect(state.movability).toEqual({ mode: 'free' });
		});
	});

	describe('getViewStateSnapshot', () => {
		it('snapshot contains exactly view-owned fields: orientation and movability', () => {
			const state = createViewState();
			const snap = getViewStateSnapshot(state);

			expect('orientation' in snap).toBe(true);
			expect('movability' in snap).toBe(true);

			// Snapshot does NOT expose board-owned fields
			expect('pieces' in snap).toBe(false);
			expect('ids' in snap).toBe(false);
			expect('turn' in snap).toBe(false);
			expect('nextId' in snap).toBe(false);

			// Snapshot does NOT expose interaction-owned fields
			expect('selected' in snap).toBe(false);
			expect('selectedSquare' in snap).toBe(false);
			expect('destinations' in snap).toBe(false);
			expect('dragSession' in snap).toBe(false);
		});

		it('snapshot reflects current state values', () => {
			const state = createViewState({
				orientation: 'black',
				movability: { mode: 'free' }
			});
			const snap = getViewStateSnapshot(state);

			expect(snap.orientation).toBe('black');
			expect(snap.movability).toEqual({ mode: 'free' });
		});

		it('snapshot orientation matches internal state orientation', () => {
			const state = createViewState({ orientation: 'white' });
			state.orientation = 'black'; // mutate internal
			const snap = getViewStateSnapshot(state);
			expect(snap.orientation).toBe('black');
		});
	});
});
