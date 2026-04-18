import { describe, expect, it } from 'vitest';
import { clearDirty, markDirtyLayer, markDirtySquares } from '../../../src/core/scheduler/reducers';
import { DirtyLayer } from '../../../src/core/scheduler/types';
import type { Square } from '../../../src/core/state/boardTypes';
import { fromAlgebraic } from '../../../src/core/state/coords';

function makeState() {
	return { layers: 0, squares: new Set<Square>() };
}

describe('scheduler/reducers', () => {
	describe('markDirtyLayer', () => {
		it('ORs the bitmask into layers', () => {
			const state = makeState();

			markDirtyLayer(state, DirtyLayer.Board);
			expect(state.layers & DirtyLayer.Board).not.toBe(0);

			markDirtyLayer(state, DirtyLayer.Pieces);
			expect(state.layers & DirtyLayer.Board).not.toBe(0);
			expect(state.layers & DirtyLayer.Pieces).not.toBe(0);
		});

		it('clears squares set (whole-layer supersedes square-level)', () => {
			const state = makeState();
			const e4 = fromAlgebraic('e4') as Square;
			state.squares.add(e4);
			expect(state.squares.size).toBe(1);

			markDirtyLayer(state, DirtyLayer.Pieces);

			expect(state.squares.size).toBe(0);
		});

		it('accepts combined bitmask', () => {
			const state = makeState();

			markDirtyLayer(state, DirtyLayer.Board | DirtyLayer.Pieces);

			expect(state.layers & DirtyLayer.Board).not.toBe(0);
			expect(state.layers & DirtyLayer.Pieces).not.toBe(0);
		});
	});

	describe('markDirtySquares', () => {
		it('ORs the bitmask into layers and adds the square', () => {
			const state = makeState();
			const e4 = fromAlgebraic('e4') as Square;

			markDirtySquares(state, DirtyLayer.Pieces, e4);

			expect(state.layers & DirtyLayer.Pieces).not.toBe(0);
			expect(state.squares.has(e4)).toBe(true);
		});

		it('accepts an iterable of squares', () => {
			const state = makeState();
			const e2 = fromAlgebraic('e2') as Square;
			const e4 = fromAlgebraic('e4') as Square;

			markDirtySquares(state, DirtyLayer.Pieces, [e2, e4]);

			expect(state.squares.has(e2)).toBe(true);
			expect(state.squares.has(e4)).toBe(true);
		});

		it('accumulates squares across multiple calls', () => {
			const state = makeState();
			const e2 = fromAlgebraic('e2') as Square;
			const e4 = fromAlgebraic('e4') as Square;

			markDirtySquares(state, DirtyLayer.Pieces, e2);
			markDirtySquares(state, DirtyLayer.Pieces, e4);

			expect(state.squares.size).toBe(2);
			expect(state.squares.has(e2)).toBe(true);
			expect(state.squares.has(e4)).toBe(true);
		});
	});

	describe('clearDirty', () => {
		it('resets layers to 0 and empties squares', () => {
			const state = makeState();
			const e4 = fromAlgebraic('e4') as Square;

			markDirtyLayer(state, DirtyLayer.Board | DirtyLayer.Pieces);
			markDirtySquares(state, DirtyLayer.Pieces, e4);

			clearDirty(state);

			expect(state.layers).toBe(0);
			expect(state.squares.size).toBe(0);
		});

		it('is safe to call on already-clean state', () => {
			const state = makeState();
			expect(() => clearDirty(state)).not.toThrow();
			expect(state.layers).toBe(0);
			expect(state.squares.size).toBe(0);
		});
	});
});
