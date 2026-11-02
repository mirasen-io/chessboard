import { describe, expect, it } from 'vitest';
import {
	makeBoardRect,
	measureBoardSize,
	sceneRectsEqual,
	sceneSizesEqual
} from '../../../src/layout/geometry/helpers.js';

describe('sceneRectsEqual', () => {
	it('returns true for two identical rects', () => {
		const rect = { x: 10, y: 20, width: 100, height: 100 };
		expect(sceneRectsEqual(rect, { ...rect })).toBe(true);
	});

	it('returns false when x differs', () => {
		const a = { x: 10, y: 20, width: 100, height: 100 };
		const b = { x: 11, y: 20, width: 100, height: 100 };
		expect(sceneRectsEqual(a, b)).toBe(false);
	});

	it('returns false when y differs', () => {
		const a = { x: 10, y: 20, width: 100, height: 100 };
		const b = { x: 10, y: 21, width: 100, height: 100 };
		expect(sceneRectsEqual(a, b)).toBe(false);
	});

	it('returns false when width differs', () => {
		const a = { x: 10, y: 20, width: 100, height: 100 };
		const b = { x: 10, y: 20, width: 101, height: 100 };
		expect(sceneRectsEqual(a, b)).toBe(false);
	});

	it('returns false when height differs', () => {
		const a = { x: 10, y: 20, width: 100, height: 100 };
		const b = { x: 10, y: 20, width: 100, height: 101 };
		expect(sceneRectsEqual(a, b)).toBe(false);
	});

	it('returns true when both are null', () => {
		expect(sceneRectsEqual(null, null)).toBe(true);
	});

	it('returns false when first is null and second is defined', () => {
		expect(sceneRectsEqual(null, { x: 0, y: 0, width: 10, height: 10 })).toBe(false);
	});

	it('returns false when first is defined and second is null', () => {
		expect(sceneRectsEqual({ x: 0, y: 0, width: 10, height: 10 }, null)).toBe(false);
	});
});

describe('sceneSizesEqual', () => {
	it('returns true for two identical sizes', () => {
		expect(sceneSizesEqual({ width: 100, height: 200 }, { width: 100, height: 200 })).toBe(true);
	});

	it('returns false when width differs', () => {
		expect(sceneSizesEqual({ width: 100, height: 200 }, { width: 101, height: 200 })).toBe(false);
	});

	it('returns false when height differs', () => {
		expect(sceneSizesEqual({ width: 100, height: 200 }, { width: 100, height: 201 })).toBe(false);
	});

	it('returns true when both are null', () => {
		expect(sceneSizesEqual(null, null)).toBe(true);
	});

	it('returns false when first is null and second is defined', () => {
		expect(sceneSizesEqual(null, { width: 100, height: 100 })).toBe(false);
	});

	it('returns false when first is defined and second is null', () => {
		expect(sceneSizesEqual({ width: 100, height: 100 }, null)).toBe(false);
	});
});

describe('measureBoardSize', () => {
	it('returns height for wide scene', () => {
		expect(measureBoardSize({ width: 800, height: 400 })).toBe(400);
	});

	it('returns width for tall scene', () => {
		expect(measureBoardSize({ width: 300, height: 600 })).toBe(300);
	});

	it('returns either dimension for square scene', () => {
		expect(measureBoardSize({ width: 500, height: 500 })).toBe(500);
	});
});

describe('makeBoardRect', () => {
	it('returns rect at origin for square scene', () => {
		const rect = makeBoardRect({ width: 400, height: 400 });
		expect(rect).toEqual({ x: 0, y: 0, width: 400, height: 400 });
	});

	it('centers horizontally for wide scene', () => {
		const rect = makeBoardRect({ width: 600, height: 400 });
		expect(rect).toEqual({ x: 100, y: 0, width: 400, height: 400 });
	});

	it('centers vertically for tall scene', () => {
		const rect = makeBoardRect({ width: 300, height: 500 });
		expect(rect).toEqual({ x: 0, y: 100, width: 300, height: 300 });
	});

	it('width and height of returned rect always equals min(width, height)', () => {
		const rect = makeBoardRect({ width: 1000, height: 750 });
		expect(rect.width).toBe(750);
		expect(rect.height).toBe(750);
	});
});
