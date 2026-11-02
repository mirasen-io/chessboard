import { describe, expect, it } from 'vitest';
import { isSceneSizeValid, measureSceneSize } from '../../src/layout/helpers.js';
import { createMockContainer } from '../test-utils/layout/fixtures.js';

describe('isSceneSizeValid', () => {
	it('returns true for positive width and height', () => {
		expect(isSceneSizeValid({ width: 100, height: 200 })).toBe(true);
	});

	it('returns false for zero width', () => {
		expect(isSceneSizeValid({ width: 0, height: 200 })).toBe(false);
	});

	it('returns false for zero height', () => {
		expect(isSceneSizeValid({ width: 100, height: 0 })).toBe(false);
	});

	it('returns false for negative width', () => {
		expect(isSceneSizeValid({ width: -1, height: 200 })).toBe(false);
	});

	it('returns false for negative height', () => {
		expect(isSceneSizeValid({ width: 100, height: -1 })).toBe(false);
	});

	it('returns false for null', () => {
		expect(isSceneSizeValid(null)).toBe(false);
	});

	it('returns true for Infinity (current behavior, no finite check)', () => {
		expect(isSceneSizeValid({ width: Infinity, height: 100 })).toBe(true);
	});
});

describe('measureSceneSize', () => {
	it('returns size from container clientWidth and clientHeight', () => {
		const container = createMockContainer(400, 300);
		const size = measureSceneSize(container);
		expect(size).toEqual({ width: 400, height: 300 });
	});

	it('returns size with zero dimensions when container has zero clientWidth', () => {
		const container = createMockContainer(0, 300);
		const size = measureSceneSize(container);
		expect(size).toEqual({ width: 0, height: 300 });
	});

	it('returns size with zero dimensions when container has zero clientHeight', () => {
		const container = createMockContainer(400, 0);
		const size = measureSceneSize(container);
		expect(size).toEqual({ width: 400, height: 0 });
	});
});
