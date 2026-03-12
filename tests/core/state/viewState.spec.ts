import { describe, expect, it } from 'vitest';
import { createViewState, getViewStateSnapshot } from '../../../src/core/state/viewState';

describe('state/viewState', () => {
	describe('createViewState', () => {
		it('creates internal state with view-owned fields only', () => {
			const state = createViewState();

			expect('orientation' in state).toBe(true);
			expect('selected' in state).toBe(true);
			expect('movability' in state).toBe(true);

			// View state does NOT contain board-owned fields
			expect('pieces' in state).toBe(false);
			expect('ids' in state).toBe(false);
			expect('turn' in state).toBe(false);
			expect('nextId' in state).toBe(false);
		});

		it('defaults: orientation=white, selected=null, movability=disabled', () => {
			const state = createViewState();
			expect(state.orientation).toBe('white');
			expect(state.selected).toBeNull();
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

		it('respects selected override', () => {
			const state = createViewState({
				selected: 12 as import('../../../src/core/state/boardTypes').Square
			});
			expect(state.selected).toBe(12);
		});

		it('respects movability override', () => {
			const state = createViewState({ movability: { mode: 'free', color: 'white' } });
			expect(state.movability).toEqual({ mode: 'free', color: 'white' });
		});
	});

	describe('getViewStateSnapshot', () => {
		it('snapshot contains exactly view-owned fields: orientation, selected, movability', () => {
			const state = createViewState();
			const snap = getViewStateSnapshot(state);

			expect('orientation' in snap).toBe(true);
			expect('selected' in snap).toBe(true);
			expect('movability' in snap).toBe(true);

			// Snapshot does NOT expose board-owned fields
			expect('pieces' in snap).toBe(false);
			expect('ids' in snap).toBe(false);
			expect('turn' in snap).toBe(false);
			expect('nextId' in snap).toBe(false);
		});

		it('snapshot reflects current state values', () => {
			const state = createViewState({
				orientation: 'black',
				movability: { mode: 'free', color: 'both' }
			});
			const snap = getViewStateSnapshot(state);

			expect(snap.orientation).toBe('black');
			expect(snap.selected).toBeNull();
			expect(snap.movability).toEqual({ mode: 'free', color: 'both' });
		});

		it('snapshot orientation matches internal state orientation', () => {
			const state = createViewState({ orientation: 'white' });
			state.orientation = 'black'; // mutate internal
			const snap = getViewStateSnapshot(state);
			expect(snap.orientation).toBe('black');
		});
	});
});
