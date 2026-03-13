/**
 * Phase 3.4 — squareMapping tests.
 *
 * Covers mapBoardPointToSquare: the pure input-layer helper that converts
 * board-local coordinates into a Square index (or null).
 *
 * All coordinates are in board-local SVG space (origin = top-left of board).
 */

import { describe, expect, it } from 'vitest';
import { mapBoardPointToSquare } from '../../../src/core/input/squareMapping';
import { makeRenderGeometry } from '../../../src/core/renderer/geometry';
import { fromAlgebraic } from '../../../src/core/state/coords';

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Return the centre point of a square's rendered rect. */
function centre(
	geometry: ReturnType<typeof makeRenderGeometry>,
	alg: Parameters<typeof fromAlgebraic>[0]
) {
	const r = geometry.squareRect(fromAlgebraic(alg));
	return { x: r.x + r.size / 2, y: r.y + r.size / 2 };
}

// ── White orientation ──────────────────────────────────────────────────────────

describe('mapBoardPointToSquare — white orientation', () => {
	const boardSize = 800;
	const g = makeRenderGeometry(boardSize, 'white');
	const s = g.squareSize; // 100

	it('top-left corner maps to a8', () => {
		expect(mapBoardPointToSquare(0, 0, g)).toBe(fromAlgebraic('a8'));
	});

	it('bottom-right interior point maps to h1', () => {
		// Use a point clearly inside the last cell, not the exact outer edge.
		expect(mapBoardPointToSquare(7 * s + 1, 7 * s + 1, g)).toBe(fromAlgebraic('h1'));
	});

	it('bottom-left interior point maps to a1', () => {
		expect(mapBoardPointToSquare(0, 7 * s + 1, g)).toBe(fromAlgebraic('a1'));
	});

	it('top-right interior point maps to h8', () => {
		expect(mapBoardPointToSquare(7 * s + 1, 0, g)).toBe(fromAlgebraic('h8'));
	});

	it('mid-board square e4 — centre of its rendered rect', () => {
		const { x, y } = centre(g, 'e4');
		expect(mapBoardPointToSquare(x, y, g)).toBe(fromAlgebraic('e4'));
	});

	it('mid-board square d5 — centre of its rendered rect', () => {
		const { x, y } = centre(g, 'd5');
		expect(mapBoardPointToSquare(x, y, g)).toBe(fromAlgebraic('d5'));
	});
});

// ── Black orientation ──────────────────────────────────────────────────────────

describe('mapBoardPointToSquare — black orientation', () => {
	const boardSize = 800;
	const g = makeRenderGeometry(boardSize, 'black');
	const s = g.squareSize; // 100

	it('top-left corner maps to h1', () => {
		expect(mapBoardPointToSquare(0, 0, g)).toBe(fromAlgebraic('h1'));
	});

	it('bottom-right interior point maps to a8', () => {
		expect(mapBoardPointToSquare(7 * s + 1, 7 * s + 1, g)).toBe(fromAlgebraic('a8'));
	});

	it('top-right interior point maps to a1', () => {
		expect(mapBoardPointToSquare(7 * s + 1, 0, g)).toBe(fromAlgebraic('a1'));
	});

	it('bottom-left interior point maps to h8', () => {
		expect(mapBoardPointToSquare(0, 7 * s + 1, g)).toBe(fromAlgebraic('h8'));
	});

	it('mid-board square e4 — centre of its rendered rect', () => {
		const { x, y } = centre(g, 'e4');
		expect(mapBoardPointToSquare(x, y, g)).toBe(fromAlgebraic('e4'));
	});
});

// ── Off-board / non-finite → null ─────────────────────────────────────────────

describe('mapBoardPointToSquare — off-board and non-finite inputs return null', () => {
	const g = makeRenderGeometry(800, 'white');

	it('negative x returns null', () => {
		expect(mapBoardPointToSquare(-1, 0, g)).toBeNull();
	});

	it('negative y returns null', () => {
		expect(mapBoardPointToSquare(0, -1, g)).toBeNull();
	});

	it('x === boardSize returns null (exclusive upper bound)', () => {
		expect(mapBoardPointToSquare(800, 0, g)).toBeNull();
	});

	it('y === boardSize returns null (exclusive upper bound)', () => {
		expect(mapBoardPointToSquare(0, 800, g)).toBeNull();
	});

	it('x > boardSize returns null', () => {
		expect(mapBoardPointToSquare(801, 0, g)).toBeNull();
	});

	it('y > boardSize returns null', () => {
		expect(mapBoardPointToSquare(0, 801, g)).toBeNull();
	});

	it('NaN x returns null', () => {
		expect(mapBoardPointToSquare(NaN, 0, g)).toBeNull();
	});

	it('NaN y returns null', () => {
		expect(mapBoardPointToSquare(0, NaN, g)).toBeNull();
	});

	it('+Infinity x returns null', () => {
		expect(mapBoardPointToSquare(Infinity, 0, g)).toBeNull();
	});

	it('-Infinity y returns null', () => {
		expect(mapBoardPointToSquare(0, -Infinity, g)).toBeNull();
	});
});

// ── Boundary stability ─────────────────────────────────────────────────────────

describe('mapBoardPointToSquare — boundary stability', () => {
	const boardSize = 800;
	const g = makeRenderGeometry(boardSize, 'white');

	it('(0, 0) is valid — maps to a8', () => {
		expect(mapBoardPointToSquare(0, 0, g)).toBe(fromAlgebraic('a8'));
	});

	it('(boardSize - 0.001, 0) is valid — maps to h8 (last column, first row)', () => {
		expect(mapBoardPointToSquare(boardSize - 0.001, 0, g)).toBe(fromAlgebraic('h8'));
	});

	it('(0, boardSize - 0.001) is valid — maps to a1 (first column, last row)', () => {
		expect(mapBoardPointToSquare(0, boardSize - 0.001, g)).toBe(fromAlgebraic('a1'));
	});

	it('(boardSize, 0) is null — exact outer edge is excluded', () => {
		expect(mapBoardPointToSquare(boardSize, 0, g)).toBeNull();
	});

	it('(0, boardSize) is null — exact outer edge is excluded', () => {
		expect(mapBoardPointToSquare(0, boardSize, g)).toBeNull();
	});

	it('non-integer coordinates inside a cell map to the correct square', () => {
		// Point at (150.7, 250.3) → xIndex=1 (b), yIndex=2 → rank=5 → b6
		expect(mapBoardPointToSquare(150.7, 250.3, g)).toBe(fromAlgebraic('b6'));
	});
});
