import { describe, expect, it } from 'vitest';
import {
	createInitialInvalidationState,
	createInvalidationWriter,
	getInvalidationSnapshot
} from '../../../src/core/scheduler/invalidationState';
import { DirtyLayer } from '../../../src/core/scheduler/types';
import type { Square } from '../../../src/core/state/boardTypes';
import { fromAlgebraic } from '../../../src/core/state/coords';

describe('scheduler/invalidationState', () => {
	describe('createInitialInvalidationState', () => {
		it('creates empty state: layers=0, squares empty', () => {
			const state = createInitialInvalidationState();
			expect(state.layers).toBe(0);
			expect(state.squares.size).toBe(0);
		});
	});

	describe('createInvalidationWriter', () => {
		it('markLayer ORs the bitmask into layers', () => {
			const state = createInitialInvalidationState();
			const writer = createInvalidationWriter(state);

			writer.markLayer(DirtyLayer.Board);
			expect(state.layers & DirtyLayer.Board).not.toBe(0);

			writer.markLayer(DirtyLayer.Pieces);
			expect(state.layers & DirtyLayer.Board).not.toBe(0);
			expect(state.layers & DirtyLayer.Pieces).not.toBe(0);
		});

		it('markLayer clears squares (whole-layer invalidation supersedes square-level)', () => {
			const state = createInitialInvalidationState();
			const writer = createInvalidationWriter(state);

			const e4 = fromAlgebraic('e4') as Square;
			writer.markSquares(DirtyLayer.Pieces, e4);
			expect(state.squares.size).toBe(1);

			writer.markLayer(DirtyLayer.Pieces);
			expect(state.squares.size).toBe(0); // cleared by markLayer
		});

		it('markSquares ORs the bitmask and adds squares', () => {
			const state = createInitialInvalidationState();
			const writer = createInvalidationWriter(state);

			const e2 = fromAlgebraic('e2') as Square;
			const e4 = fromAlgebraic('e4') as Square;

			writer.markSquares(DirtyLayer.Pieces, e2);
			writer.markSquares(DirtyLayer.Pieces, e4);

			expect(state.layers & DirtyLayer.Pieces).not.toBe(0);
			expect(state.squares.has(e2)).toBe(true);
			expect(state.squares.has(e4)).toBe(true);
		});

		it('markSquares accepts an iterable of squares', () => {
			const state = createInitialInvalidationState();
			const writer = createInvalidationWriter(state);

			const e2 = fromAlgebraic('e2') as Square;
			const e4 = fromAlgebraic('e4') as Square;

			writer.markSquares(DirtyLayer.Pieces, [e2, e4]);

			expect(state.squares.has(e2)).toBe(true);
			expect(state.squares.has(e4)).toBe(true);
		});
	});

	describe('getInvalidationSnapshot', () => {
		it('returns layers and a copy of squares when non-empty', () => {
			const state = createInitialInvalidationState();
			const writer = createInvalidationWriter(state);

			const e4 = fromAlgebraic('e4') as Square;
			writer.markSquares(DirtyLayer.Pieces, e4);

			const snap = getInvalidationSnapshot(state);

			expect(snap.layers).toBe(state.layers);
			expect(snap.squares).toBeDefined();
			expect(snap.squares!.has(e4)).toBe(true);
			// Snapshot squares is a copy, not the same reference
			expect(snap.squares).not.toBe(state.squares);
		});

		it('omits squares field when squares set is empty', () => {
			const state = createInitialInvalidationState();
			const writer = createInvalidationWriter(state);

			writer.markLayer(DirtyLayer.Board);

			const snap = getInvalidationSnapshot(state);

			expect(snap.layers & DirtyLayer.Board).not.toBe(0);
			expect(snap.squares).toBeUndefined();
		});

		it('returns layers=0 and no squares for fresh state', () => {
			const state = createInitialInvalidationState();

			const snap = getInvalidationSnapshot(state);

			expect(snap.layers).toBe(0);
			expect(snap.squares).toBeUndefined();
		});
	});
});
