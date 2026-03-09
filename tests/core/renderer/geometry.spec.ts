import { describe, expect, it } from 'vitest';
import { isLightSquare, makeRenderGeometry } from '../../../src/core/renderer/geometry';
import { fromAlgebraic } from '../../../src/core/state/coords';

describe('renderer/geometry', () => {
	it('computes squareRect correctly for white orientation', () => {
		const boardSize = 800;
		const s = 100;
		const g = makeRenderGeometry(boardSize, 'white');

		// a1 = (0, 7)
		let r = g.squareRect(fromAlgebraic('a1'));
		expect(r.x).toBeCloseTo(0);
		expect(r.y).toBeCloseTo(7 * s);
		expect(r.size).toBeCloseTo(s);

		// h1 = (7, 7)
		r = g.squareRect(fromAlgebraic('h1'));
		expect(r.x).toBeCloseTo(7 * s);
		expect(r.y).toBeCloseTo(7 * s);

		// a8 = (0, 0)
		r = g.squareRect(fromAlgebraic('a8'));
		expect(r.x).toBeCloseTo(0);
		expect(r.y).toBeCloseTo(0);

		// e4 = (4, 3) -> y = (7-3)*s = 4*s
		r = g.squareRect(fromAlgebraic('e4'));
		expect(r.x).toBeCloseTo(4 * s);
		expect(r.y).toBeCloseTo(4 * s);
	});

	it('computes squareRect correctly for black orientation (mirrors both axes)', () => {
		const boardSize = 800;
		const s = 100;
		const g = makeRenderGeometry(boardSize, 'black');

		// a1 appears top-right
		let r = g.squareRect(fromAlgebraic('a1'));
		expect(r.x).toBeCloseTo(7 * s);
		expect(r.y).toBeCloseTo(0);

		// h1 appears top-left
		r = g.squareRect(fromAlgebraic('h1'));
		expect(r.x).toBeCloseTo(0);
		expect(r.y).toBeCloseTo(0);

		// a8 appears bottom-right
		r = g.squareRect(fromAlgebraic('a8'));
		expect(r.x).toBeCloseTo(7 * s);
		expect(r.y).toBeCloseTo(7 * s);

		// e4 maps accordingly
		r = g.squareRect(fromAlgebraic('e4'));
		// file 4 -> xIndex = 7-4 = 3, rank 3 -> yIndex = 3
		expect(r.x).toBeCloseTo(3 * s);
		expect(r.y).toBeCloseTo(3 * s);
	});

	it('isLightSquare parity alternates across neighbors (a1 is light in current convention)', () => {
		const a1 = fromAlgebraic('a1');
		const b1 = fromAlgebraic('b1');
		const a2 = fromAlgebraic('a2');
		const h8 = fromAlgebraic('h8');

		expect(isLightSquare(a1)).toBe(true);
		expect(isLightSquare(b1)).toBe(false);
		expect(isLightSquare(a2)).toBe(false);
		expect(isLightSquare(h8)).toBe(true);
	});
});
