import { describe, expect, it } from 'vitest';
import {
	createInvalidationState,
	createInvalidationWriter
} from '../../../src/core/scheduler/invalidationState';
import { DirtyLayer } from '../../../src/core/scheduler/types';
import type { Square } from '../../../src/core/state/boardTypes';
import { setMovability, setOrientation } from '../../../src/core/state/viewReducers';
import { createViewState } from '../../../src/core/state/viewState';

/** Helper: fresh invalidation state + writer pair for each test */
function makeInv() {
	const state = createInvalidationState();
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

			const changed = setMovability(view, { mode: 'free' });

			expect(changed).toBe(true);
			expect(view.movability).toEqual({ mode: 'free' });
		});

		it('is a no-op for structurally equal disabled movability', () => {
			const view = createViewState(); // default: { mode: 'disabled' }

			const changed = setMovability(view, { mode: 'disabled' });

			expect(changed).toBe(false);
		});

		it('is a no-op for structurally equal free movability', () => {
			const view = createViewState({ movability: { mode: 'free' } });

			const changed = setMovability(view, { mode: 'free' });

			expect(changed).toBe(false);
		});

		it('is a no-op for structurally equal strict movability', () => {
			const view = createViewState({
				movability: { mode: 'strict', destinations: { 12: [28, 20] } }
			});

			const changed = setMovability(view, {
				mode: 'strict',
				destinations: { 12: [28, 20] }
			});

			expect(changed).toBe(false);
		});

		it('does not take an InvalidationWriter (no dirty side-effects)', () => {
			// setMovability signature: (state, m) — no writer parameter
			const view = createViewState();
			expect(() => setMovability(view, { mode: 'free' })).not.toThrow();
		});

		it('is a no-op for same resolver reference', () => {
			const resolver = (sq: Square): readonly Square[] | undefined =>
				sq === 12 ? ([28, 20] as const) : undefined;
			const view = createViewState({
				movability: { mode: 'strict', destinations: resolver }
			});

			const changed = setMovability(view, {
				mode: 'strict',
				destinations: resolver
			});

			expect(changed).toBe(false);
		});

		it('detects change when different resolver functions are provided', () => {
			const resolver1 = (sq: Square): readonly Square[] | undefined =>
				sq === 12 ? ([28, 20] as const) : undefined;
			const resolver2 = (sq: Square): readonly Square[] | undefined =>
				sq === 12 ? ([28, 20] as const) : undefined;
			const view = createViewState({
				movability: { mode: 'strict', destinations: resolver1 }
			});

			const changed = setMovability(view, {
				mode: 'strict',
				destinations: resolver2
			});

			expect(changed).toBe(true);
		});

		it('detects change when switching from record to resolver', () => {
			const view = createViewState({
				movability: { mode: 'strict', destinations: { 12: [28, 20] } }
			});

			const resolver = (sq: Square): readonly Square[] | undefined =>
				sq === 12 ? ([28, 20] as const) : undefined;
			const changed = setMovability(view, {
				mode: 'strict',
				destinations: resolver
			});

			expect(changed).toBe(true);
		});

		it('detects change when switching from resolver to record', () => {
			const resolver = (sq: Square): readonly Square[] | undefined =>
				sq === 12 ? ([28, 20] as const) : undefined;
			const view = createViewState({
				movability: { mode: 'strict', destinations: resolver }
			});

			const changed = setMovability(view, {
				mode: 'strict',
				destinations: { 12: [28, 20] }
			});

			expect(changed).toBe(true);
		});
	});
});
