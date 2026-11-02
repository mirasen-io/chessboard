import { describe, expect, it } from 'vitest';
import { createRenderGeometry } from '../../../src/layout/geometry/factory.js';
import { normalizeSquare } from '../../../src/state/board/normalize.js';
import { ColorCode } from '../../../src/state/board/types/internal.js';

describe('createRenderGeometry', () => {
	describe('validation', () => {
		it('throws RangeError for zero width', () => {
			expect(() => createRenderGeometry({ width: 0, height: 400 }, ColorCode.White)).toThrow(
				RangeError
			);
		});

		it('throws RangeError for zero height', () => {
			expect(() => createRenderGeometry({ width: 400, height: 0 }, ColorCode.White)).toThrow(
				RangeError
			);
		});

		it('throws RangeError for negative width', () => {
			expect(() => createRenderGeometry({ width: -100, height: 400 }, ColorCode.White)).toThrow(
				RangeError
			);
		});

		it('throws RangeError for negative height', () => {
			expect(() => createRenderGeometry({ width: 400, height: -1 }, ColorCode.White)).toThrow(
				RangeError
			);
		});

		it('throws RangeError for Infinity width', () => {
			expect(() => createRenderGeometry({ width: Infinity, height: 400 }, ColorCode.White)).toThrow(
				RangeError
			);
		});

		it('throws RangeError for NaN height', () => {
			expect(() => createRenderGeometry({ width: 400, height: NaN }, ColorCode.White)).toThrow(
				RangeError
			);
		});

		it('succeeds for valid positive finite dimensions', () => {
			const geo = createRenderGeometry({ width: 400, height: 400 }, ColorCode.White);
			expect(geo).toBeDefined();
			expect(geo.squareSize).toBeGreaterThan(0);
		});
	});

	describe('geometry correctness', () => {
		it('square scene: boardRect at origin, squareSize = size/8', () => {
			const geo = createRenderGeometry({ width: 800, height: 800 }, ColorCode.White);
			expect(geo.boardRect).toEqual({ x: 0, y: 0, width: 800, height: 800 });
			expect(geo.squareSize).toBe(100);
		});

		it('wide scene: boardRect centered horizontally, squareSize = height/8', () => {
			const geo = createRenderGeometry({ width: 1000, height: 800 }, ColorCode.White);
			expect(geo.boardRect).toEqual({ x: 100, y: 0, width: 800, height: 800 });
			expect(geo.squareSize).toBe(100);
		});

		it('tall scene: boardRect centered vertically, squareSize = width/8', () => {
			const geo = createRenderGeometry({ width: 400, height: 600 }, ColorCode.White);
			expect(geo.boardRect).toEqual({ x: 0, y: 100, width: 400, height: 400 });
			expect(geo.squareSize).toBe(50);
		});

		it('sceneSize on returned geometry is a copy of the input', () => {
			const input = { width: 400, height: 400 };
			const geo = createRenderGeometry(input, ColorCode.White);
			expect(geo.sceneSize).toEqual(input);
			expect(geo.sceneSize).not.toBe(input);
		});

		it('orientation on returned geometry matches input', () => {
			const geoW = createRenderGeometry({ width: 400, height: 400 }, ColorCode.White);
			expect(geoW.orientation).toBe(ColorCode.White);

			const geoB = createRenderGeometry({ width: 400, height: 400 }, ColorCode.Black);
			expect(geoB.orientation).toBe(ColorCode.Black);
		});
	});

	describe('getSquareRect with white orientation', () => {
		const geo = createRenderGeometry({ width: 800, height: 800 }, ColorCode.White);
		const squareSize = 100;

		it('a1 is at bottom-left', () => {
			const a1 = normalizeSquare('a1');
			const rect = geo.getSquareRect(a1);
			// file=0, rank=0 → xIndex=0, yIndex=7
			expect(rect).toEqual({
				x: 0 * squareSize,
				y: 7 * squareSize,
				width: squareSize,
				height: squareSize
			});
		});

		it('h8 is at top-right', () => {
			const h8 = normalizeSquare('h8');
			const rect = geo.getSquareRect(h8);
			// file=7, rank=7 → xIndex=7, yIndex=0
			expect(rect).toEqual({
				x: 7 * squareSize,
				y: 0 * squareSize,
				width: squareSize,
				height: squareSize
			});
		});

		it('e4 is at expected position', () => {
			const e4 = normalizeSquare('e4');
			const rect = geo.getSquareRect(e4);
			// file=4, rank=3 → xIndex=4, yIndex=4
			expect(rect).toEqual({
				x: 4 * squareSize,
				y: 4 * squareSize,
				width: squareSize,
				height: squareSize
			});
		});
	});

	describe('getSquareRect with black orientation', () => {
		const geo = createRenderGeometry({ width: 800, height: 800 }, ColorCode.Black);
		const squareSize = 100;

		it('a1 is at top-right', () => {
			const a1 = normalizeSquare('a1');
			const rect = geo.getSquareRect(a1);
			// file=0, rank=0 → xIndex=7-0=7, yIndex=0
			expect(rect).toEqual({
				x: 7 * squareSize,
				y: 0 * squareSize,
				width: squareSize,
				height: squareSize
			});
		});

		it('h8 is at bottom-left', () => {
			const h8 = normalizeSquare('h8');
			const rect = geo.getSquareRect(h8);
			// file=7, rank=7 → xIndex=7-7=0, yIndex=7
			expect(rect).toEqual({
				x: 0 * squareSize,
				y: 7 * squareSize,
				width: squareSize,
				height: squareSize
			});
		});
	});

	describe('getSquareRect with non-square scene respects boardRect offset', () => {
		it('wide scene offsets square positions by boardRect.x', () => {
			const geo = createRenderGeometry({ width: 1000, height: 800 }, ColorCode.White);
			const a1 = normalizeSquare('a1');
			const rect = geo.getSquareRect(a1);
			// boardRect.x = 100, file=0, rank=0 → xIndex=0, yIndex=7
			expect(rect.x).toBe(100 + 0 * 100);
			expect(rect.y).toBe(0 + 7 * 100);
		});

		it('tall scene offsets square positions by boardRect.y', () => {
			const geo = createRenderGeometry({ width: 400, height: 600 }, ColorCode.White);
			const a1 = normalizeSquare('a1');
			const rect = geo.getSquareRect(a1);
			// boardRect.y = 100, squareSize = 50, file=0, rank=0 → xIndex=0, yIndex=7
			expect(rect.x).toBe(0 + 0 * 50);
			expect(rect.y).toBe(100 + 7 * 50);
		});
	});
});
