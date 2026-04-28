import { describe, expect, it } from 'vitest';
import { layoutRefreshGeometry } from '../../src/layout/reducers.js';
import { ColorCode } from '../../src/state/board/types/internal.js';
import { createMockContainer, createTestLayoutInternal } from '../test-utils/layout/fixtures.js';

describe('layoutRefreshGeometry', () => {
	it('first valid refresh creates geometry and increments layoutEpoch', () => {
		const state = createTestLayoutInternal();
		const container = createMockContainer(400, 400);

		const changed = layoutRefreshGeometry(state, { container, orientation: ColorCode.White });

		expect(changed).toBe(true);
		expect(state.sceneSize).toEqual({ width: 400, height: 400 });
		expect(state.geometry).not.toBeNull();
		expect(state.geometry!.squareSize).toBe(50);
		expect(state.layoutEpoch).toBe(1);
	});

	it('same scene size and same orientation is a no-op', () => {
		const state = createTestLayoutInternal();
		const container = createMockContainer(400, 400);

		layoutRefreshGeometry(state, { container, orientation: ColorCode.White });
		const geometryRef = state.geometry;
		const epoch = state.layoutEpoch;

		const changed = layoutRefreshGeometry(state, { container, orientation: ColorCode.White });

		expect(changed).toBe(false);
		expect(state.layoutEpoch).toBe(epoch);
		expect(state.geometry).toBe(geometryRef);
	});

	it('changed scene size updates geometry and increments epoch', () => {
		const state = createTestLayoutInternal();

		layoutRefreshGeometry(state, {
			container: createMockContainer(400, 400),
			orientation: ColorCode.White
		});
		expect(state.layoutEpoch).toBe(1);

		const changed = layoutRefreshGeometry(state, {
			container: createMockContainer(800, 800),
			orientation: ColorCode.White
		});

		expect(changed).toBe(true);
		expect(state.sceneSize).toEqual({ width: 800, height: 800 });
		expect(state.geometry!.squareSize).toBe(100);
		expect(state.layoutEpoch).toBe(2);
	});

	it('changed orientation updates geometry and increments epoch', () => {
		const state = createTestLayoutInternal();
		const container = createMockContainer(400, 400);

		layoutRefreshGeometry(state, { container, orientation: ColorCode.White });
		expect(state.layoutEpoch).toBe(1);

		const changed = layoutRefreshGeometry(state, { container, orientation: ColorCode.Black });

		expect(changed).toBe(true);
		expect(state.orientation).toBe(ColorCode.Black);
		expect(state.geometry!.orientation).toBe(ColorCode.Black);
		expect(state.layoutEpoch).toBe(2);
	});

	it('invalid measured size clears sceneSize and geometry', () => {
		const state = createTestLayoutInternal();

		// First: set valid geometry
		layoutRefreshGeometry(state, {
			container: createMockContainer(400, 400),
			orientation: ColorCode.White
		});
		expect(state.geometry).not.toBeNull();

		// Second: invalid container
		const changed = layoutRefreshGeometry(state, {
			container: createMockContainer(0, 400),
			orientation: ColorCode.White
		});

		expect(changed).toBe(true);
		expect(state.sceneSize).toBeNull();
		expect(state.geometry).toBeNull();
		expect(state.layoutEpoch).toBe(2);
	});

	it('refresh without container uses existing state.sceneSize', () => {
		const state = createTestLayoutInternal({
			sceneSize: { width: 600, height: 600 },
			orientation: ColorCode.White
		});

		// No container, but sceneSize exists and orientation changes → should create geometry
		const changed = layoutRefreshGeometry(state, { orientation: ColorCode.Black });

		expect(changed).toBe(true);
		expect(state.geometry).not.toBeNull();
		expect(state.geometry!.squareSize).toBe(75);
		expect(state.orientation).toBe(ColorCode.Black);
		expect(state.layoutEpoch).toBe(1);
	});

	it('no container and null state.sceneSize with same orientation is a no-op', () => {
		const state = createTestLayoutInternal({
			sceneSize: null,
			orientation: ColorCode.White
		});

		const changed = layoutRefreshGeometry(state, { orientation: ColorCode.White });

		expect(changed).toBe(false);
		expect(state.geometry).toBeNull();
		expect(state.layoutEpoch).toBe(0);
	});

	it('throws when resolved orientation is null (state.orientation null + no options.orientation)', () => {
		const state = createTestLayoutInternal({ orientation: null });

		expect(() =>
			layoutRefreshGeometry(state, { container: createMockContainer(400, 400) })
		).toThrow();
	});

	it('state.orientation null + valid options.orientation succeeds', () => {
		const state = createTestLayoutInternal({ orientation: null });
		const container = createMockContainer(400, 400);

		const changed = layoutRefreshGeometry(state, { container, orientation: ColorCode.White });

		expect(changed).toBe(true);
		expect(state.orientation).toBe(ColorCode.White);
		expect(state.geometry).not.toBeNull();
		expect(state.layoutEpoch).toBe(1);
	});

	it('options.orientation overrides state.orientation', () => {
		const state = createTestLayoutInternal({ orientation: ColorCode.White });
		const container = createMockContainer(400, 400);

		const changed = layoutRefreshGeometry(state, { container, orientation: ColorCode.Black });

		expect(changed).toBe(true);
		expect(state.orientation).toBe(ColorCode.Black);
		expect(state.geometry!.orientation).toBe(ColorCode.Black);
	});
});
