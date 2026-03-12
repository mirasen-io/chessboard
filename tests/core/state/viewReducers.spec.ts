import { describe, expect, it } from 'vitest';
import {
	createInitialInvalidationState,
	createInvalidationWriter
} from '../../../src/core/scheduler/invalidationState';
import { DirtyLayer } from '../../../src/core/scheduler/types';
import type { Square } from '../../../src/core/state/boardTypes';
import { select, setMovability, setOrientation } from '../../../src/core/state/viewReducers';
import { createViewState } from '../../../src/core/state/viewState';

/** Helper: fresh invalidation state + writer pair for each test */
function makeInv() {
	const state = createInitialInvalidationState();
	const writer = createInvalidationWriter(state);
	return { inv: state, writer };
}

describe('state/viewReducers', () => {
	describe('setOrientation', () => {
		it('changes orientation and marks DirtyLayer.All', () => {
			const view = createViewState({ orientation: 'white' });
			const { inv, writer } = makeInv();

			const changed = setOrientation(view, writer, 'black');

			expect(changed).toBe(true);
			expect(view.orientation).toBe('black');
			expect(inv.layers).toBe(DirtyLayer.All);
		});

		it('is a no-op and returns false when orientation is unchanged', () => {
			const view = createViewState({ orientation: 'white' });
			const { inv, writer } = makeInv();

			const changed = setOrientation(view, writer, 'white');

			expect(changed).toBe(false);
			expect(view.orientation).toBe('white');
			expect(inv.layers).toBe(0); // nothing marked dirty
		});

		it('accepts short color input', () => {
			const view = createViewState({ orientation: 'white' });
			const { writer } = makeInv();

			setOrientation(view, writer, 'b');

			expect(view.orientation).toBe('black');
		});
	});

	describe('setMovability', () => {
		it('changes movability and returns true', () => {
			const view = createViewState();

			const changed = setMovability(view, { mode: 'free', color: 'white' });

			expect(changed).toBe(true);
			expect(view.movability).toEqual({ mode: 'free', color: 'white' });
		});

		it('is a no-op for structurally equal disabled movability', () => {
			const view = createViewState(); // default: { mode: 'disabled' }

			const changed = setMovability(view, { mode: 'disabled' });

			expect(changed).toBe(false);
		});

		it('is a no-op for structurally equal free movability', () => {
			const view = createViewState({ movability: { mode: 'free', color: 'white' } });

			const changed = setMovability(view, { mode: 'free', color: 'white' });

			expect(changed).toBe(false);
		});

		it('is a no-op for structurally equal strict movability', () => {
			const view = createViewState({
				movability: { mode: 'strict', color: 'white', destinations: { 12: [28, 20] } }
			});

			const changed = setMovability(view, {
				mode: 'strict',
				color: 'white',
				destinations: { 12: [28, 20] }
			});

			expect(changed).toBe(false);
		});

		it('does not take an InvalidationWriter (no dirty side-effects)', () => {
			// setMovability signature: (state, m) — no writer parameter
			const view = createViewState();
			expect(() => setMovability(view, { mode: 'free', color: 'both' })).not.toThrow();
		});
	});

	describe('select', () => {
		it('sets selected square and returns true when changed', () => {
			const view = createViewState();

			const changed = select(view, 12 as Square);

			expect(changed).toBe(true);
			expect(view.selected).toBe(12);
		});

		it('clears selection with null and returns true when changed', () => {
			const view = createViewState({ selected: 12 as Square });

			const changed = select(view, null);

			expect(changed).toBe(true);
			expect(view.selected).toBeNull();
		});

		it('is a no-op and returns false when selection is unchanged', () => {
			const view = createViewState({ selected: 12 as Square });

			const changed = select(view, 12 as Square);

			expect(changed).toBe(false);
			expect(view.selected).toBe(12);
		});

		it('is a no-op when clearing already-null selection', () => {
			const view = createViewState(); // selected = null

			const changed = select(view, null);

			expect(changed).toBe(false);
		});

		it('accepts algebraic square string', () => {
			const view = createViewState();

			select(view, 'e4');

			expect(view.selected).not.toBeNull();
		});

		it('does not take an InvalidationWriter (no dirty side-effects)', () => {
			// select signature: (state, sq) — no writer parameter
			const view = createViewState();
			expect(() => select(view, 12 as Square)).not.toThrow();
		});
	});
});
