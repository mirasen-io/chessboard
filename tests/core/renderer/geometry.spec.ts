import { describe, expect, it } from 'vitest';
import { isLightSquare, makeRenderGeometry } from '../../../src/core/renderer/geometry';
import { fromAlgebraic, squareOf } from '../../../src/core/state/coords';

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
		// a1 (0,0) is dark
		expect(isLightSquare(fromAlgebraic('a1'))).toBe(false);
		expect(isLightSquare(squareOf(0, 0))).toBe(false);
		// b1 (1,0) is light
		expect(isLightSquare(fromAlgebraic('b1'))).toBe(true);
		expect(isLightSquare(squareOf(1, 0))).toBe(true);
		// a2 (0,1) is light
		expect(isLightSquare(fromAlgebraic('a2'))).toBe(true);
		expect(isLightSquare(squareOf(0, 1))).toBe(true);
		// h8 (7,7) is dark
		expect(isLightSquare(fromAlgebraic('h8'))).toBe(false);
		expect(isLightSquare(squareOf(7, 7))).toBe(false);
	});
});
