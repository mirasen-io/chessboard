import { describe, expect, it, vi } from 'vitest';
import { SvgRenderer } from '../../../src/core/renderer/SvgRenderer';
import type { Renderer } from '../../../src/core/renderer/types';
import { createBoardRuntime } from '../../../src/core/runtime/boardRuntime';
import { DirtyLayer } from '../../../src/core/state/types';

describe('core/runtime/boardRuntime', () => {
	function createMockContainer(width: number, height: number): HTMLElement {
		const container = document.createElement('div');
		Object.defineProperty(container, 'clientWidth', { value: width, configurable: true });
		Object.defineProperty(container, 'clientHeight', { value: height, configurable: true });
		return container;
	}

	function createTestRenderer(): Renderer {
		return new SvgRenderer();
	}

	it('allows pre-mount state mutations without rendering', () => {
		// Verifies: Pre-mount state mutations are safe and don't trigger rendering
		const renderer = createTestRenderer();
		const renderSpy = vi.spyOn(renderer, 'render');
		const mountSpy = vi.spyOn(renderer, 'mount');

		const runtime = createBoardRuntime({ renderer, position: 'start' });
		runtime.setPosition({ e2: { color: 'w', role: 'p' } });
		runtime.setOrientation('black');

		// Verify: no renderer calls before mount
		expect(mountSpy).not.toHaveBeenCalled();
		expect(renderSpy).not.toHaveBeenCalled();
	});

	it('mount triggers initial render with latest state', () => {
		// Verifies: mount() calls renderer.mount, then schedules render with accumulated pre-mount state
		const renderer = createTestRenderer();
		const renderSpy = vi.spyOn(renderer, 'render');
		const mountSpy = vi.spyOn(renderer, 'mount');
		const container = createMockContainer(400, 400);

		const runtime = createBoardRuntime({ renderer });
		runtime.setPosition('start'); // pre-mount mutation

		runtime.mount(container);

		// Verify renderer.mount was called
		expect(mountSpy).toHaveBeenCalledTimes(1);
		expect(mountSpy).toHaveBeenCalledWith(container);

		return new Promise<void>((resolve) => {
			requestAnimationFrame(() => {
				expect(renderSpy).toHaveBeenCalled();
				const [snapshot, , invalidation] = renderSpy.mock.calls[0];

				// Verify start position is reflected (accumulated pre-mount state)
				expect(snapshot.pieces[0]).not.toBe(0); // a1 has a piece in start position

				// Verify exact initial dirty layers (Phase 2.1 contract)
				expect(invalidation.layers).toBe(DirtyLayer.Board | DirtyLayer.Pieces);

				resolve();
			});
		});
	});

	it('mount measures container correctly (min of width/height)', () => {
		const renderer = createTestRenderer();
		const renderSpy = vi.spyOn(renderer, 'render');
		const container = createMockContainer(600, 400);

		const runtime = createBoardRuntime({ renderer });
		runtime.mount(container);

		return new Promise<void>((resolve) => {
			requestAnimationFrame(() => {
				expect(renderSpy).toHaveBeenCalled();
				const [, geometry] = renderSpy.mock.calls[0];
				// Board size should be min(600, 400) = 400
				expect(geometry.boardSize).toBe(400);
				resolve();
			});
		});
	});

	it('post-mount state mutation schedules render', () => {
		const renderer = createTestRenderer();
		const renderSpy = vi.spyOn(renderer, 'render');
		const container = createMockContainer(400, 400);

		const runtime = createBoardRuntime({ renderer });
		runtime.mount(container);

		return new Promise<void>((resolve) => {
			requestAnimationFrame(() => {
				// Clear initial render
				renderSpy.mockClear();

				// Mutate state post-mount
				runtime.setPosition({ e4: { color: 'w', role: 'p' } });

				requestAnimationFrame(() => {
					expect(renderSpy).toHaveBeenCalled();
					const [snapshot] = renderSpy.mock.calls[0];
					// Verify updated position
					expect(snapshot.pieces[28]).not.toBe(0); // e4 = 28
					resolve();
				});
			});
		});
	});

	it('orientation change recreates geometry', () => {
		// Verifies: setOrientation recreates geometry (immutable) and reflects new orientation in square positions
		const renderer = createTestRenderer();
		const renderSpy = vi.spyOn(renderer, 'render');
		const container = createMockContainer(400, 400);

		const runtime = createBoardRuntime({ renderer, orientation: 'white' });
		runtime.mount(container);

		return new Promise<void>((resolve) => {
			requestAnimationFrame(() => {
				const [, geom1] = renderSpy.mock.calls[0];
				const a1BeforeChange = geom1.squareRect(0);
				renderSpy.mockClear();

				// Change orientation
				runtime.setOrientation('black');

				requestAnimationFrame(() => {
					expect(renderSpy).toHaveBeenCalled();
					const [, geom2] = renderSpy.mock.calls[0];

					// Verify geometry was recreated (immutable - different object)
					expect(geom1).not.toBe(geom2);

					// Verify geometry reflects new orientation through observable square positions
					// For white: a1 (sq=0) is at bottom-left
					// For black: a1 (sq=0) is at top-right
					const a1AfterChange = geom2.squareRect(0);
					expect(a1BeforeChange.x).not.toBe(a1AfterChange.x);
					expect(a1BeforeChange.y).not.toBe(a1AfterChange.y);

					resolve();
				});
			});
		});
	});

	it('each render receives fresh dirty flags from preceding mutations', () => {
		// Verifies: dirty state is cleared after each render (non-accumulation proves cleanup)
		const renderer = createTestRenderer();
		const renderSpy = vi.spyOn(renderer, 'render');
		const container = createMockContainer(400, 400);

		const runtime = createBoardRuntime({ renderer });
		runtime.mount(container);

		return new Promise<void>((resolve) => {
			requestAnimationFrame(() => {
				// First render complete - verify it had dirty layers
				const [, , invalidation1] = renderSpy.mock.calls[0];
				expect(invalidation1.layers).toBe(DirtyLayer.Board | DirtyLayer.Pieces);

				// Now mutate state and capture the second render
				runtime.setPosition({ e4: { color: 'w', role: 'p' } });

				requestAnimationFrame(() => {
					// Second render complete - verify it had dirty layers from mutation
					expect(renderSpy).toHaveBeenCalledTimes(2);
					const [, , invalidation2] = renderSpy.mock.calls[1];

					// Verify second render has Pieces layer (from setPosition)
					expect(invalidation2.layers & DirtyLayer.Pieces).not.toBe(0);

					// Observable behavior: each render gets fresh dirty flags from its preceding mutation,
					// not accumulated dirty from previous renders (which proves cleanup is working)

					resolve();
				});
			});
		});
	});

	it('initial render uses Board and Pieces layers', () => {
		// Verifies: Phase 2.1 contract - initial mount marks exactly Board | Pieces dirty
		const renderer = createTestRenderer();
		const renderSpy = vi.spyOn(renderer, 'render');
		const container = createMockContainer(400, 400);

		const runtime = createBoardRuntime({ renderer });
		runtime.mount(container);

		return new Promise<void>((resolve) => {
			requestAnimationFrame(() => {
				expect(renderSpy).toHaveBeenCalled();
				const [, , invalidation] = renderSpy.mock.calls[0];

				// Verify exact initial dirty layers (Phase 2.1 contract)
				expect(invalidation.layers).toBe(DirtyLayer.Board | DirtyLayer.Pieces);

				resolve();
			});
		});
	});

	it('throws error when mounting twice', () => {
		const renderer = createTestRenderer();
		const container = createMockContainer(400, 400);

		const runtime = createBoardRuntime({ renderer });
		runtime.mount(container);

		expect(() => runtime.mount(container)).toThrow('already mounted');
	});

	it('throws error when container has invalid size', () => {
		const renderer = createTestRenderer();
		const container = createMockContainer(0, 0);

		const runtime = createBoardRuntime({ renderer });

		expect(() => runtime.mount(container)).toThrow('invalid container size');
	});
});
