import { describe, expect, it } from 'vitest';
import { computeInvalidation } from '../../../src/core/scheduler/invalidation';
import { createInitialState } from '../../../src/core/state/boardState';
import { fromAlgebraic } from '../../../src/core/state/coords';
import { clearDirty, move } from '../../../src/core/state/reducers';
import type { PositionMapShort } from '../../../src/core/state/types';
import { DirtyLayer } from '../../../src/core/state/types';

describe('scheduler/invalidation', () => {
	it('quiet move: includes from/to squares and layers Pieces|LastMove|Highlights', () => {
		const state = createInitialState({
			position: {
				e2: { color: 'w', role: 'p' }
			} satisfies PositionMapShort,
			turn: 'white'
		});
		clearDirty(state);

		move(state, { from: 'e2', to: 'e4' });

		const inv = computeInvalidation(state);
		expect(inv.layers & DirtyLayer.Pieces).toBeTruthy();
		expect(inv.layers & DirtyLayer.LastMove).toBeTruthy();
		expect(inv.layers & DirtyLayer.Highlights).toBeTruthy();

		const e2 = fromAlgebraic('e2');
		const e4 = fromAlgebraic('e4');
		expect(inv.squares?.has(e2)).toBe(true);
		expect(inv.squares?.has(e4)).toBe(true);
	});

	it('normal capture: includes from and destination squares', () => {
		const state = createInitialState({
			position: {
				e4: { color: 'w', role: 'p' },
				e5: { color: 'b', role: 'p' }
			} satisfies PositionMapShort,
			turn: 'white'
		});
		clearDirty(state);

		move(state, { from: 'e4', to: 'e5' });

		const inv = computeInvalidation(state);
		const e4 = fromAlgebraic('e4');
		const e5 = fromAlgebraic('e5');
		expect(inv.squares?.has(e4)).toBe(true);
		expect(inv.squares?.has(e5)).toBe(true);
		expect(inv.layers & DirtyLayer.Pieces).toBeTruthy();
		expect(inv.layers & DirtyLayer.LastMove).toBeTruthy();
	});

	it('en passant-like capture: includes capturedSquare in invalidation.squares', () => {
		const state = createInitialState({
			position: {
				e5: { color: 'w', role: 'p' },
				d5: { color: 'b', role: 'p' }
			} satisfies PositionMapShort,
			turn: 'white'
		});
		clearDirty(state);

		move(state, { from: 'e5', to: 'd6' }, { capturedSquare: 'd5' });

		const inv = computeInvalidation(state);
		const e5 = fromAlgebraic('e5');
		const d6 = fromAlgebraic('d6');
		const d5 = fromAlgebraic('d5');

		expect(inv.squares?.has(e5)).toBe(true);
		expect(inv.squares?.has(d6)).toBe(true);
		expect(inv.squares?.has(d5)).toBe(true);
		expect(inv.layers & DirtyLayer.Pieces).toBeTruthy();
		expect(inv.layers & DirtyLayer.LastMove).toBeTruthy();
	});

	it('castling: includes rookFrom and rookTo in invalidation.squares', () => {
		const state = createInitialState({
			position: {
				e1: { color: 'w', role: 'K' },
				h1: { color: 'w', role: 'R' }
			} satisfies PositionMapShort,
			turn: 'white'
		});
		clearDirty(state);

		move(
			state,
			{ from: 'e1', to: 'g1', castleSide: 'kingside' },
			{ castle: { rookFrom: 'h1', rookTo: 'f1' } }
		);

		const inv = computeInvalidation(state);
		const e1 = fromAlgebraic('e1');
		const g1 = fromAlgebraic('g1');
		const h1 = fromAlgebraic('h1');
		const f1 = fromAlgebraic('f1');

		expect(inv.squares?.has(e1)).toBe(true);
		expect(inv.squares?.has(g1)).toBe(true);
		expect(inv.squares?.has(h1)).toBe(true);
		expect(inv.squares?.has(f1)).toBe(true);
		expect(inv.layers & DirtyLayer.Pieces).toBeTruthy();
		expect(inv.layers & DirtyLayer.LastMove).toBeTruthy();
	});
});
