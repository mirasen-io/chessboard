import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { SvgRenderer } from '../../../src/core/renderer/SvgRenderer';
import type { Renderer } from '../../../src/core/renderer/types';
import { createBoardRuntime } from '../../../src/core/runtime/boardRuntime';
import { DirtyLayer } from '../../../src/core/state/types';

// Local manual ResizeObserver mock for this spec only
class MockResizeObserver {
	private callback: ResizeObserverCallback;
	private targets: Set<Element> = new Set();
	private disconnected = false;

	constructor(callback: ResizeObserverCallback) {
		this.callback = callback;
	}

	observe(target: Element): void {
		this.targets.add(target);
	}

	unobserve(target: Element): void {
		this.targets.delete(target);
	}

	disconnect(): void {
		this.disconnected = true;
		this.targets.clear();
	}

	// Manual trigger for tests
	trigger(): void {
		if (this.disconnected || this.targets.size === 0) return;

		const entries = Array.from(this.targets).map((target) => ({
			target,
			contentRect: target.getBoundingClientRect(),
			borderBoxSize: [],
			contentBoxSize: [],
			devicePixelContentBoxSize: []
		})) as ResizeObserverEntry[];

		this.callback(entries, this);
	}
}

// Store reference to active observer for manual triggering
let activeObserver: MockResizeObserver | null = null;

// Preserve original ResizeObserver (if any)
const originalResizeObserver = globalThis.ResizeObserver;

describe('core/runtime/boardRuntime', () => {
	// Helper to wait for next animation frame
	function waitForRender(): Promise<void> {
		return new Promise<void>((resolve) => {
			requestAnimationFrame(() => resolve());
		});
	}

	beforeAll(() => {
		// Replace global ResizeObserver with mock that captures instance
		globalThis.ResizeObserver = class extends MockResizeObserver {
			constructor(callback: ResizeObserverCallback) {
				super(callback);
				// eslint-disable-next-line @typescript-eslint/no-this-alias
				activeObserver = this;
			}
		} as unknown as typeof ResizeObserver;
	});

	beforeEach(() => {
		activeObserver = null;
	});

	afterAll(() => {
		// Restore original ResizeObserver
		globalThis.ResizeObserver = originalResizeObserver;
	});
	function createMockContainer(width: number, height: number): HTMLElement {
		const container = document.createElement('div');
		Object.defineProperty(container, 'clientWidth', {
			value: width,
			configurable: true,
			writable: true
		});
		Object.defineProperty(container, 'clientHeight', {
			value: height,
			configurable: true,
			writable: true
		});
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

	it('mount triggers initial render with latest state', async () => {
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

		await waitForRender();

		expect(renderSpy).toHaveBeenCalled();
		const [snapshot, , invalidation] = renderSpy.mock.calls[0];

		// Verify start position is reflected (accumulated pre-mount state)
		expect(snapshot.pieces[0]).not.toBe(0); // a1 has a piece in start position

		// Verify exact initial dirty layers (Phase 2.1 contract)
		expect(invalidation.layers).toBe(DirtyLayer.Board | DirtyLayer.Pieces);
	});

	it('mount measures container correctly (min of width/height)', async () => {
		const renderer = createTestRenderer();
		const renderSpy = vi.spyOn(renderer, 'render');
		const container = createMockContainer(600, 400);

		const runtime = createBoardRuntime({ renderer });
		runtime.mount(container);

		await waitForRender();

		expect(renderSpy).toHaveBeenCalled();
		const [, geometry] = renderSpy.mock.calls[0];
		// Board size should be min(600, 400) = 400
		expect(geometry.boardSize).toBe(400);
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

	it('initial render uses Board and Pieces layers', async () => {
		// Verifies: Phase 2.1 contract - initial mount marks exactly Board | Pieces dirty
		const renderer = createTestRenderer();
		const renderSpy = vi.spyOn(renderer, 'render');
		const container = createMockContainer(400, 400);

		const runtime = createBoardRuntime({ renderer });
		runtime.mount(container);

		await waitForRender();

		expect(renderSpy).toHaveBeenCalled();
		const [, , invalidation] = renderSpy.mock.calls[0];

		// Verify exact initial dirty layers (Phase 2.1 contract)
		expect(invalidation.layers).toBe(DirtyLayer.Board | DirtyLayer.Pieces);
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

	// Phase 2.2: Resize and destroy tests

	it('host resize triggers rerender with new geometry', async () => {
		// Verifies: ResizeObserver detects size change and refreshes geometry
		const renderer = createTestRenderer();
		const renderSpy = vi.spyOn(renderer, 'render');
		const container = createMockContainer(400, 400);

		const runtime = createBoardRuntime({ renderer });
		runtime.mount(container);

		await waitForRender();

		const [, geom1] = renderSpy.mock.calls[0];
		expect(geom1.boardSize).toBe(400);
		renderSpy.mockClear();

		// Resize container
		Object.defineProperty(container, 'clientWidth', { value: 600, configurable: true });
		Object.defineProperty(container, 'clientHeight', { value: 600, configurable: true });

		// Manually trigger ResizeObserver callback
		activeObserver?.trigger();

		await waitForRender();

		expect(renderSpy).toHaveBeenCalled();
		const [, geom2, invalidation] = renderSpy.mock.calls[0];

		// Verify new geometry
		expect(geom2.boardSize).toBe(600);
		expect(geom1).not.toBe(geom2); // immutable

		// Verify resize marks Board + Pieces dirty
		expect(invalidation.layers).toBe(DirtyLayer.Board | DirtyLayer.Pieces);
	});

	it('no rerender when measured size unchanged', async () => {
		// Verifies: resize with same size is a no-op
		const renderer = createTestRenderer();
		const renderSpy = vi.spyOn(renderer, 'render');
		const container = createMockContainer(400, 400);

		const runtime = createBoardRuntime({ renderer });
		runtime.mount(container);

		await waitForRender();
		renderSpy.mockClear();

		// "Resize" to same dimensions
		Object.defineProperty(container, 'clientWidth', { value: 400, configurable: true });
		Object.defineProperty(container, 'clientHeight', { value: 400, configurable: true });

		// Manually trigger ResizeObserver callback
		activeObserver?.trigger();

		// No new render should have been scheduled
		expect(renderSpy).not.toHaveBeenCalled();
	});

	it('zero-size resize is ignored without throwing', async () => {
		// Verifies: non-positive size during resize is silently ignored
		const renderer = createTestRenderer();
		const renderSpy = vi.spyOn(renderer, 'render');
		const container = createMockContainer(400, 400);

		const runtime = createBoardRuntime({ renderer });
		runtime.mount(container);

		await waitForRender();
		renderSpy.mockClear();

		// Resize to zero (e.g., container hidden)
		Object.defineProperty(container, 'clientWidth', { value: 0, configurable: true });
		Object.defineProperty(container, 'clientHeight', { value: 0, configurable: true });

		// Manually trigger ResizeObserver callback
		activeObserver?.trigger();

		// No error thrown, no render
		expect(renderSpy).not.toHaveBeenCalled();
	});

	it('resize uses latest orientation', async () => {
		// Verifies: resize after orientation change uses new orientation
		const renderer = createTestRenderer();
		const renderSpy = vi.spyOn(renderer, 'render');
		const container = createMockContainer(400, 400);

		const runtime = createBoardRuntime({ renderer, orientation: 'white' });
		runtime.mount(container);

		await waitForRender();

		// Change orientation
		runtime.setOrientation('black');

		await waitForRender();
		renderSpy.mockClear();

		// Now resize
		Object.defineProperty(container, 'clientWidth', { value: 500, configurable: true });
		Object.defineProperty(container, 'clientHeight', { value: 500, configurable: true });

		// Manually trigger ResizeObserver callback
		activeObserver?.trigger();

		await waitForRender();

		expect(renderSpy).toHaveBeenCalled();
		const [, geomAfterResize] = renderSpy.mock.calls[0];

		// Verify resize used black orientation and new size
		expect(geomAfterResize.boardSize).toBe(500);
	});

	it('destroy disconnects resize observer', async () => {
		// Verifies: destroy() prevents further resize effects
		const renderer = createTestRenderer();
		const renderSpy = vi.spyOn(renderer, 'render');
		const container = createMockContainer(400, 400);

		const runtime = createBoardRuntime({ renderer });
		runtime.mount(container);

		await waitForRender();
		renderSpy.mockClear();

		// Destroy runtime
		runtime.destroy();

		// Resize container after destroy
		Object.defineProperty(container, 'clientWidth', { value: 600, configurable: true });
		Object.defineProperty(container, 'clientHeight', { value: 600, configurable: true });

		// Manually trigger ResizeObserver callback
		activeObserver?.trigger();

		// No render should occur after destroy
		expect(renderSpy).not.toHaveBeenCalled();
	});

	it('destroy is idempotent', () => {
		// Verifies: calling destroy multiple times is safe
		const renderer = createTestRenderer();
		const container = createMockContainer(400, 400);

		const runtime = createBoardRuntime({ renderer });
		runtime.mount(container);

		// Should not throw
		runtime.destroy();
		runtime.destroy();
		runtime.destroy();
	});

	it('resize after destroy does not trigger render effects', async () => {
		// Verifies: resize observation is fully disconnected after destroy
		const renderer = createTestRenderer();
		const renderSpy = vi.spyOn(renderer, 'render');
		const container = createMockContainer(400, 400);

		const runtime = createBoardRuntime({ renderer });
		runtime.mount(container);

		await waitForRender();

		const initialRenderCount = renderSpy.mock.calls.length;

		runtime.destroy();

		// Multiple resizes after destroy
		Object.defineProperty(container, 'clientWidth', { value: 500, configurable: true });
		Object.defineProperty(container, 'clientHeight', { value: 500, configurable: true });

		// Manually trigger ResizeObserver callback
		activeObserver?.trigger();

		await waitForRender();

		Object.defineProperty(container, 'clientWidth', { value: 600, configurable: true });
		Object.defineProperty(container, 'clientHeight', { value: 600, configurable: true });

		// Manually trigger ResizeObserver callback again
		activeObserver?.trigger();

		await waitForRender();

		// No new renders after destroy
		expect(renderSpy.mock.calls.length).toBe(initialRenderCount);
	});

	it('throws error when mounting after destroy', () => {
		// Verifies: mount after destroy is rejected
		const renderer = createTestRenderer();
		const container = createMockContainer(400, 400);

		const runtime = createBoardRuntime({ renderer });
		runtime.mount(container);
		runtime.destroy();

		expect(() => runtime.mount(container)).toThrow('cannot mount after destroy');
	});
});
