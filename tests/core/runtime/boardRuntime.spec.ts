import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { SvgRenderer } from '../../../src/core/renderer/SvgRenderer';
import type { Renderer } from '../../../src/core/renderer/types';
import { createBoardRuntime } from '../../../src/core/runtime/boardRuntime';
import { DirtyLayer } from '../../../src/core/scheduler/types';
import type { Square } from '../../../src/core/state/boardTypes';

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

let activeObserver: MockResizeObserver | null = null;
const originalResizeObserver = globalThis.ResizeObserver;

describe('core/runtime/boardRuntime', () => {
	function waitForRender(): Promise<void> {
		return new Promise<void>((resolve) => {
			requestAnimationFrame(() => resolve());
		});
	}

	beforeAll(() => {
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

	// ── Pre-mount / mount ──────────────────────────────────────────────────────

	it('allows pre-mount state mutations without rendering', () => {
		const renderer = createTestRenderer();
		const renderBoardSpy = vi.spyOn(renderer, 'renderBoard');
		const mountSpy = vi.spyOn(renderer, 'mount');

		const runtime = createBoardRuntime({ renderer, board: { position: 'start' } });
		runtime.setBoardPosition({ e2: { color: 'w', role: 'p' } });
		runtime.setOrientation('black');

		expect(mountSpy).not.toHaveBeenCalled();
		expect(renderBoardSpy).not.toHaveBeenCalled();
	});

	it('mount triggers initial render with latest state', async () => {
		const renderer = createTestRenderer();
		const renderBoardSpy = vi.spyOn(renderer, 'renderBoard');
		const mountSpy = vi.spyOn(renderer, 'mount');
		const container = createMockContainer(400, 400);

		const runtime = createBoardRuntime({ renderer });
		runtime.setBoardPosition('start'); // pre-mount mutation

		runtime.mount(container);

		expect(mountSpy).toHaveBeenCalledTimes(1);
		expect(mountSpy).toHaveBeenCalledWith(container);

		await waitForRender();

		expect(renderBoardSpy).toHaveBeenCalled();
		const ctx = renderBoardSpy.mock.calls[0][0];

		expect(ctx.board.pieces[0]).not.toBe(0); // a1 has a piece in start position
		// mount marks DirtyLayer.All (Board | Pieces | Drag = 7)
		expect(ctx.invalidation.layers).toBe(DirtyLayer.All);
	});

	it('mount measures container correctly (min of width/height)', async () => {
		const renderer = createTestRenderer();
		const renderBoardSpy = vi.spyOn(renderer, 'renderBoard');
		const container = createMockContainer(600, 400);

		const runtime = createBoardRuntime({ renderer });
		runtime.mount(container);

		await waitForRender();

		expect(renderBoardSpy).toHaveBeenCalled();
		const ctx = renderBoardSpy.mock.calls[0][0];
		expect(ctx.geometry.boardSize).toBe(400); // min(600, 400)
	});

	it('post-mount state mutation schedules render', () => {
		const renderer = createTestRenderer();
		const renderBoardSpy = vi.spyOn(renderer, 'renderBoard');
		const container = createMockContainer(400, 400);

		const runtime = createBoardRuntime({ renderer });
		runtime.mount(container);

		return new Promise<void>((resolve) => {
			requestAnimationFrame(() => {
				renderBoardSpy.mockClear();

				runtime.setBoardPosition({ e4: { color: 'w', role: 'p' } });

				requestAnimationFrame(() => {
					expect(renderBoardSpy).toHaveBeenCalled();
					const ctx = renderBoardSpy.mock.calls[0][0];
					expect(ctx.board.pieces[28]).not.toBe(0); // e4 = 28
					resolve();
				});
			});
		});
	});

	it('orientation change recreates geometry', () => {
		const renderer = createTestRenderer();
		const renderBoardSpy = vi.spyOn(renderer, 'renderBoard');
		const container = createMockContainer(400, 400);

		const runtime = createBoardRuntime({ renderer, view: { orientation: 'white' } });
		runtime.mount(container);

		return new Promise<void>((resolve) => {
			requestAnimationFrame(() => {
				const ctx1 = renderBoardSpy.mock.calls[0][0];
				const geom1 = ctx1.geometry;
				const a1BeforeChange = geom1.squareRect(0);
				renderBoardSpy.mockClear();

				runtime.setOrientation('black');

				requestAnimationFrame(() => {
					expect(renderBoardSpy).toHaveBeenCalled();
					const [ctx2] = renderBoardSpy.mock.calls[0];
					const geom2 = ctx2.geometry;

					expect(geom1).not.toBe(geom2); // immutable — new object

					// a1 moves from bottom-left (white) to top-right (black)
					const a1AfterChange = geom2.squareRect(0);
					expect(a1BeforeChange.x).not.toBe(a1AfterChange.x);
					expect(a1BeforeChange.y).not.toBe(a1AfterChange.y);

					resolve();
				});
			});
		});
	});

	it('each render receives fresh dirty flags from preceding mutations', () => {
		const renderer = createTestRenderer();
		const renderBoardSpy = vi.spyOn(renderer, 'renderBoard');
		const container = createMockContainer(400, 400);

		const runtime = createBoardRuntime({ renderer });
		runtime.mount(container);

		return new Promise<void>((resolve) => {
			requestAnimationFrame(() => {
				const ctx1 = renderBoardSpy.mock.calls[0][0];
				// mount marks DirtyLayer.All (Board | Pieces | Drag = 7)
				expect(ctx1.invalidation.layers).toBe(DirtyLayer.All);

				runtime.setBoardPosition({ e4: { color: 'w', role: 'p' } });

				requestAnimationFrame(() => {
					expect(renderBoardSpy).toHaveBeenCalledTimes(2);
					const ctx2 = renderBoardSpy.mock.calls[1][0];
					expect(ctx2.invalidation.layers & DirtyLayer.Pieces).not.toBe(0);
					resolve();
				});
			});
		});
	});

	it('initial render uses DirtyLayer.All', async () => {
		// mount() marks DirtyLayer.All (Board | Pieces | Drag) for a full initial redraw
		const renderer = createTestRenderer();
		const renderBoardSpy = vi.spyOn(renderer, 'renderBoard');
		const container = createMockContainer(400, 400);

		const runtime = createBoardRuntime({ renderer });
		runtime.mount(container);

		await waitForRender();

		expect(renderBoardSpy).toHaveBeenCalled();
		const ctx = renderBoardSpy.mock.calls[0][0];
		expect(ctx.invalidation.layers).toBe(DirtyLayer.All);
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

	// ── Resize and destroy ─────────────────────────────────────────────────────

	it('host resize triggers rerender with new geometry', async () => {
		const renderer = createTestRenderer();
		const renderBoardSpy = vi.spyOn(renderer, 'renderBoard');
		const container = createMockContainer(400, 400);

		const runtime = createBoardRuntime({ renderer });
		runtime.mount(container);

		await waitForRender();

		const ctx1 = renderBoardSpy.mock.calls[0][0];
		const geom1 = ctx1.geometry;
		expect(geom1.boardSize).toBe(400);
		renderBoardSpy.mockClear();

		Object.defineProperty(container, 'clientWidth', { value: 600, configurable: true });
		Object.defineProperty(container, 'clientHeight', { value: 600, configurable: true });

		activeObserver?.trigger();

		await waitForRender();

		expect(renderBoardSpy).toHaveBeenCalled();
		const [ctx2] = renderBoardSpy.mock.calls[0];
		const { invalidation, geometry: geom2 } = ctx2;

		expect(geom2.boardSize).toBe(600);
		expect(geom1).not.toBe(geom2); // immutable

		expect(invalidation.layers).toBe(DirtyLayer.Board | DirtyLayer.Pieces);
	});

	it('no rerender when measured size unchanged', async () => {
		const renderer = createTestRenderer();
		const renderBoardSpy = vi.spyOn(renderer, 'renderBoard');
		const container = createMockContainer(400, 400);

		const runtime = createBoardRuntime({ renderer });
		runtime.mount(container);

		await waitForRender();
		renderBoardSpy.mockClear();

		Object.defineProperty(container, 'clientWidth', { value: 400, configurable: true });
		Object.defineProperty(container, 'clientHeight', { value: 400, configurable: true });

		activeObserver?.trigger();

		expect(renderBoardSpy).not.toHaveBeenCalled();
	});

	it('zero-size resize is ignored without throwing', async () => {
		const renderer = createTestRenderer();
		const renderBoardSpy = vi.spyOn(renderer, 'renderBoard');
		const container = createMockContainer(400, 400);

		const runtime = createBoardRuntime({ renderer });
		runtime.mount(container);

		await waitForRender();
		renderBoardSpy.mockClear();

		Object.defineProperty(container, 'clientWidth', { value: 0, configurable: true });
		Object.defineProperty(container, 'clientHeight', { value: 0, configurable: true });

		activeObserver?.trigger();

		expect(renderBoardSpy).not.toHaveBeenCalled();
	});

	it('resize uses latest orientation', async () => {
		const renderer = createTestRenderer();
		const renderBoardSpy = vi.spyOn(renderer, 'renderBoard');
		const container = createMockContainer(400, 400);

		const runtime = createBoardRuntime({ renderer, view: { orientation: 'white' } });
		runtime.mount(container);

		await waitForRender();

		runtime.setOrientation('black');

		await waitForRender();
		renderBoardSpy.mockClear();

		Object.defineProperty(container, 'clientWidth', { value: 500, configurable: true });
		Object.defineProperty(container, 'clientHeight', { value: 500, configurable: true });

		activeObserver?.trigger();

		await waitForRender();

		expect(renderBoardSpy).toHaveBeenCalled();
		const ctx = renderBoardSpy.mock.calls[0][0];
		expect(ctx.geometry.boardSize).toBe(500);
	});

	it('destroy disconnects resize observer', async () => {
		const renderer = createTestRenderer();
		const renderBoardSpy = vi.spyOn(renderer, 'renderBoard');
		const container = createMockContainer(400, 400);

		const runtime = createBoardRuntime({ renderer });
		runtime.mount(container);

		await waitForRender();
		renderBoardSpy.mockClear();

		runtime.destroy();

		Object.defineProperty(container, 'clientWidth', { value: 600, configurable: true });
		Object.defineProperty(container, 'clientHeight', { value: 600, configurable: true });

		activeObserver?.trigger();

		expect(renderBoardSpy).not.toHaveBeenCalled();
	});

	it('destroy is idempotent', () => {
		const renderer = createTestRenderer();
		const container = createMockContainer(400, 400);

		const runtime = createBoardRuntime({ renderer });
		runtime.mount(container);

		runtime.destroy();
		runtime.destroy();
		runtime.destroy();
	});

	it('resize after destroy does not trigger render effects', async () => {
		const renderer = createTestRenderer();
		const renderBoardSpy = vi.spyOn(renderer, 'renderBoard');
		const container = createMockContainer(400, 400);

		const runtime = createBoardRuntime({ renderer });
		runtime.mount(container);

		await waitForRender();

		const initialRenderCount = renderBoardSpy.mock.calls.length;

		runtime.destroy();

		Object.defineProperty(container, 'clientWidth', { value: 500, configurable: true });
		Object.defineProperty(container, 'clientHeight', { value: 500, configurable: true });
		activeObserver?.trigger();

		await waitForRender();

		Object.defineProperty(container, 'clientWidth', { value: 600, configurable: true });
		Object.defineProperty(container, 'clientHeight', { value: 600, configurable: true });
		activeObserver?.trigger();

		await waitForRender();

		expect(renderBoardSpy.mock.calls.length).toBe(initialRenderCount);
	});

	it('throws error when mounting after destroy', () => {
		const renderer = createTestRenderer();
		const container = createMockContainer(400, 400);

		const runtime = createBoardRuntime({ renderer });
		runtime.mount(container);
		runtime.destroy();

		expect(() => runtime.mount(container)).toThrow('cannot mount after destroy');
	});

	// ── Board state / view state split: selection and orientation ──────────────

	it('setBoardPosition clears selection after a successful change', () => {
		// Verifies: runtime clears viewState.selected when board position changes
		const renderer = createTestRenderer();
		const container = createMockContainer(400, 400);

		const runtime = createBoardRuntime({ renderer, board: { position: 'start' } });
		runtime.mount(container);

		// Set a selection
		const selChanged = runtime.select(12); // e2
		expect(selChanged).toBe(true);

		// Change board position — should clear selection
		runtime.setBoardPosition({ e4: { color: 'w', role: 'p' } });

		// Observable: select(null) returns false only if selection is already null
		const clearResult = runtime.select(null);
		expect(clearResult).toBe(false); // already null — confirms selection was cleared
	});

	it('setOrientation before mount does not throw and persists orientation', () => {
		// Verifies: setOrientation is safe pre-mount and stores the new orientation
		const renderer = createTestRenderer();

		const runtime = createBoardRuntime({ renderer, view: { orientation: 'white' } });

		// Must not throw
		expect(() => runtime.setOrientation('black')).not.toThrow();

		// Orientation must be persisted: verify via geometry after mount
		const container = createMockContainer(400, 400);
		const renderBoardSpy = vi.spyOn(renderer, 'renderBoard');
		runtime.mount(container);

		return new Promise<void>((resolve) => {
			requestAnimationFrame(() => {
				expect(renderBoardSpy).toHaveBeenCalled();
				const ctx = renderBoardSpy.mock.calls[0][0];
				const geometry = ctx.geometry;

				// Black orientation: a1 (sq=0) should be at top-right, not bottom-left
				// For white: a1.y = 7 * squareSize (bottom row)
				// For black: a1.y = 0 (top row)
				const a1 = geometry.squareRect(0);
				expect(a1.y).toBe(0); // top row confirms black orientation
				expect(geometry.orientation).toBe('black');

				resolve();
			});
		});
	});

	it('setOrientation no-op before mount does not schedule render on mount', async () => {
		// Verifies: no-op setOrientation (same value) does not cause extra scheduling
		const renderer = createTestRenderer();
		const renderBoardSpy = vi.spyOn(renderer, 'renderBoard');
		const container = createMockContainer(400, 400);

		const runtime = createBoardRuntime({ renderer, view: { orientation: 'white' } });

		// No-op: same orientation
		const changed = runtime.setOrientation('white');
		expect(changed).toBe(false);

		runtime.mount(container);

		await waitForRender();

		// Only the initial mount render should have occurred
		expect(renderBoardSpy).toHaveBeenCalledTimes(1);
	});

	// ── Scheduling contract ────────────────────────────────────────────────────

	it('setBoardPosition schedules render when mounted', async () => {
		// setBoardPosition has InvalidationWriter → runtime schedules after change
		const renderer = createTestRenderer();
		const renderBoardSpy = vi.spyOn(renderer, 'renderBoard');
		const container = createMockContainer(400, 400);

		const runtime = createBoardRuntime({ renderer });
		runtime.mount(container);

		await waitForRender();
		renderBoardSpy.mockClear();

		runtime.setBoardPosition({ e4: { color: 'w', role: 'p' } });

		await waitForRender();

		expect(renderBoardSpy).toHaveBeenCalled();
	});

	it('setTurn does not schedule render', async () => {
		// setTurn has no InvalidationWriter → runtime does not schedule
		const renderer = createTestRenderer();
		const renderBoardSpy = vi.spyOn(renderer, 'renderBoard');
		const container = createMockContainer(400, 400);

		const runtime = createBoardRuntime({ renderer, board: { position: 'start' } });
		runtime.mount(container);

		await waitForRender();
		const initialCallCount = renderBoardSpy.mock.calls.length;

		runtime.setTurn('black');

		await waitForRender();

		// setTurn must not trigger additional renders
		expect(renderBoardSpy.mock.calls.length).toBe(initialCallCount);
	});

	it('move schedules render when mounted', async () => {
		// move has InvalidationWriter → runtime schedules after move
		const renderer = createTestRenderer();
		const renderBoardSpy = vi.spyOn(renderer, 'renderBoard');
		const container = createMockContainer(400, 400);

		const runtime = createBoardRuntime({
			renderer,
			board: { position: { e2: { color: 'w', role: 'p' } } }
		});
		runtime.mount(container);

		await waitForRender();
		renderBoardSpy.mockClear();

		runtime.move({ from: 'e2', to: 'e4' });

		await waitForRender();

		expect(renderBoardSpy).toHaveBeenCalled();
	});

	it('setOrientation schedules render when mounted and changed', async () => {
		// setOrientation has InvalidationWriter → runtime schedules after change
		const renderer = createTestRenderer();
		const renderBoardSpy = vi.spyOn(renderer, 'renderBoard');
		const container = createMockContainer(400, 400);

		const runtime = createBoardRuntime({ renderer, view: { orientation: 'white' } });
		runtime.mount(container);

		await waitForRender();
		renderBoardSpy.mockClear();

		runtime.setOrientation('black');

		await waitForRender();

		expect(renderBoardSpy).toHaveBeenCalled();
	});

	it('setOrientation no-op does not schedule render', async () => {
		// No-op setOrientation (same value) → returns false → no scheduling
		const renderer = createTestRenderer();
		const renderBoardSpy = vi.spyOn(renderer, 'renderBoard');
		const container = createMockContainer(400, 400);

		const runtime = createBoardRuntime({ renderer, view: { orientation: 'white' } });
		runtime.mount(container);

		await waitForRender();
		renderBoardSpy.mockClear();

		const changed = runtime.setOrientation('white'); // no-op
		expect(changed).toBe(false);

		await waitForRender();

		expect(renderBoardSpy).not.toHaveBeenCalled();
	});

	it('select does not schedule render when no extensions are registered', async () => {
		// select without extensions: updates interaction state but no invalidation → no render scheduled
		const renderer = createTestRenderer();
		const renderBoardSpy = vi.spyOn(renderer, 'renderBoard');
		const container = createMockContainer(400, 400);

		const runtime = createBoardRuntime({ renderer, board: { position: 'start' } });
		runtime.mount(container);

		await waitForRender();
		renderBoardSpy.mockClear();

		runtime.select(12); // e2

		await waitForRender();

		expect(renderBoardSpy).not.toHaveBeenCalled();
	});

	it('setMovability does not schedule render when no extensions are registered', async () => {
		// setMovability without extensions: updates view state but no invalidation → no render scheduled
		const renderer = createTestRenderer();
		const renderBoardSpy = vi.spyOn(renderer, 'renderBoard');
		const container = createMockContainer(400, 400);

		const runtime = createBoardRuntime({ renderer });
		runtime.mount(container);

		await waitForRender();
		renderBoardSpy.mockClear();

		runtime.setMovability({ mode: 'free' });

		await waitForRender();

		expect(renderBoardSpy).not.toHaveBeenCalled();
	});

	it('no-op setMovability (structurally equal) does not schedule render', async () => {
		const renderer = createTestRenderer();
		const renderBoardSpy = vi.spyOn(renderer, 'renderBoard');
		const container = createMockContainer(400, 400);

		const runtime = createBoardRuntime({
			renderer,
			view: { movability: { mode: 'strict', destinations: { 12: [28, 20] } } }
		});
		runtime.mount(container);

		await waitForRender();
		const initialCallCount = renderBoardSpy.mock.calls.length;

		runtime.setMovability({ mode: 'strict', destinations: { 12: [28, 20] } });

		await waitForRender();

		expect(renderBoardSpy.mock.calls.length).toBe(initialCallCount);
	});

	it('coalesces multiple scheduling mutations into a single render in one frame', async () => {
		// Two scheduling mutations before the next frame must produce exactly one render call.
		const renderer = createTestRenderer();
		const renderBoardSpy = vi.spyOn(renderer, 'renderBoard');
		const container = createMockContainer(400, 400);

		// Start with an empty board so setBoardPosition below is a guaranteed state change
		const runtime = createBoardRuntime({ renderer, board: { position: {} } });
		runtime.mount(container);

		await waitForRender();
		renderBoardSpy.mockClear();

		// Two scheduling mutations — both call scheduler.schedule() internally
		runtime.setBoardPosition({ e4: { color: 'w', role: 'p' } });
		runtime.setOrientation('black');

		await waitForRender();

		expect(renderBoardSpy).toHaveBeenCalledTimes(1);
	});

	it('setOrientation render receives DirtyLayer.All', async () => {
		// setOrientation marks DirtyLayer.All; the render that follows must reflect that.
		const renderer = createTestRenderer();
		const renderBoardSpy = vi.spyOn(renderer, 'renderBoard');
		const container = createMockContainer(400, 400);

		const runtime = createBoardRuntime({ renderer, view: { orientation: 'white' } });
		runtime.mount(container);

		await waitForRender();
		renderBoardSpy.mockClear();

		runtime.setOrientation('black');

		await waitForRender();

		expect(renderBoardSpy).toHaveBeenCalledTimes(1);
		const ctx = renderBoardSpy.mock.calls[0][0];
		expect(ctx.invalidation.layers).toBe(DirtyLayer.All);
	});

	it('move render receives DirtyLayer.Pieces and dirty squares', async () => {
		// move marks DirtyLayer.Pieces and the affected squares; verify both reach the renderer.
		const renderer = createTestRenderer();
		const renderBoardSpy = vi.spyOn(renderer, 'renderBoard');
		const container = createMockContainer(400, 400);

		const runtime = createBoardRuntime({
			renderer,
			board: { position: { e2: { color: 'w', role: 'p' } } }
		});
		runtime.mount(container);

		await waitForRender();
		renderBoardSpy.mockClear();

		const result = runtime.move({ from: 'e2', to: 'e4' });
		expect(result).toBeTruthy(); // move was applied

		await waitForRender();

		expect(renderBoardSpy).toHaveBeenCalledTimes(1);
		const ctx = renderBoardSpy.mock.calls[0][0];
		expect(ctx.invalidation.layers & DirtyLayer.Pieces).toBe(DirtyLayer.Pieces);
		expect(ctx.invalidation.squares).toBeDefined();
		expect(ctx.invalidation.squares!.has(12)).toBe(true); // e2 = 12
		expect(ctx.invalidation.squares!.has(28)).toBe(true); // e4 = 28
	});

	// ── Movability consultation ────────────────────────────────────────────────

	it('null movability blocks all move attempts', () => {
		const renderer = createTestRenderer();
		const container = createMockContainer(400, 400);

		const runtime = createBoardRuntime({
			renderer,
			board: { position: 'start' },
			view: { movability: undefined }
		});
		runtime.mount(container);

		expect(runtime.canStartMoveFrom(12)).toBe(false);
		expect(runtime.isMoveAttemptAllowed(12, 28)).toBe(false);
	});

	it('disabled movability blocks all move attempts', () => {
		const renderer = createTestRenderer();
		const container = createMockContainer(400, 400);

		const runtime = createBoardRuntime({
			renderer,
			board: { position: 'start' },
			view: { movability: { mode: 'disabled' } }
		});
		runtime.mount(container);

		expect(runtime.canStartMoveFrom(12)).toBe(false);
		expect(runtime.isMoveAttemptAllowed(12, 28)).toBe(false);
	});

	it('free movability allows start from any occupied square', () => {
		const renderer = createTestRenderer();
		const container = createMockContainer(400, 400);

		const runtime = createBoardRuntime({
			renderer,
			board: { position: 'start' },
			view: { movability: { mode: 'free' } }
		});
		runtime.mount(container);

		// Free mode: any occupied square can start a move (no color check)
		expect(runtime.canStartMoveFrom(12)).toBe(true); // white pawn e2
		expect(runtime.canStartMoveFrom(1)).toBe(true); // white knight b1
		expect(runtime.canStartMoveFrom(52)).toBe(true); // black pawn e7
		expect(runtime.canStartMoveFrom(57)).toBe(true); // black knight b8
	});

	it('strict movability allows start only when source has destinations', () => {
		const renderer = createTestRenderer();
		const container = createMockContainer(400, 400);

		const runtime = createBoardRuntime({
			renderer,
			board: { position: 'start' },
			view: {
				movability: {
					mode: 'strict',
					destinations: { 12: [28, 20] }
				}
			}
		});
		runtime.mount(container);

		expect(runtime.canStartMoveFrom(12)).toBe(true); // e2 has destinations
		expect(runtime.canStartMoveFrom(11)).toBe(false); // d2 has no destinations
	});

	it('strict movability allows only listed target squares', () => {
		const renderer = createTestRenderer();
		const container = createMockContainer(400, 400);

		const runtime = createBoardRuntime({
			renderer,
			board: { position: 'start' },
			view: {
				movability: {
					mode: 'strict',
					destinations: { 12: [28, 20] }
				}
			}
		});
		runtime.mount(container);

		expect(runtime.isMoveAttemptAllowed(12, 28)).toBe(true); // e2->e4 listed
		expect(runtime.isMoveAttemptAllowed(12, 20)).toBe(true); // e2->e3 listed
		expect(runtime.isMoveAttemptAllowed(12, 36)).toBe(false); // e2->e5 not listed
	});

	it('changing movability via setMovability changes eligibility behavior', () => {
		const renderer = createTestRenderer();
		const container = createMockContainer(400, 400);

		const runtime = createBoardRuntime({
			renderer,
			board: { position: 'start' },
			view: { movability: { mode: 'disabled' } }
		});
		runtime.mount(container);

		expect(runtime.canStartMoveFrom(12)).toBe(false);

		// Free mode: any occupied square allowed
		runtime.setMovability({ mode: 'free' });
		expect(runtime.canStartMoveFrom(12)).toBe(true);
		expect(runtime.canStartMoveFrom(52)).toBe(true);

		// Strict mode: only squares with destinations allowed
		runtime.setMovability({ mode: 'strict', destinations: { 12: [28, 20] } });
		expect(runtime.canStartMoveFrom(12)).toBe(true); // has destinations
		expect(runtime.canStartMoveFrom(52)).toBe(false); // no destinations
	});

	it('strict resolver-based movability: canStartMoveFrom works correctly', () => {
		const renderer = createTestRenderer();
		const container = createMockContainer(400, 400);

		const resolver = (sq: Square): readonly Square[] | undefined => {
			if (sq === 12) return [28, 20] as const; // e2 -> e4, e3
			if (sq === 52) return [44, 36] as const; // e7 -> e5, e6
			return undefined;
		};

		const runtime = createBoardRuntime({
			renderer,
			board: { position: 'start' },
			view: { movability: { mode: 'strict', destinations: resolver } }
		});
		runtime.mount(container);

		expect(runtime.canStartMoveFrom(12)).toBe(true); // e2 has destinations
		expect(runtime.canStartMoveFrom(52)).toBe(true); // e7 has destinations
		expect(runtime.canStartMoveFrom(11)).toBe(false); // d2 has no destinations
	});

	it('strict resolver-based movability: isMoveAttemptAllowed works correctly', () => {
		const renderer = createTestRenderer();
		const container = createMockContainer(400, 400);

		const resolver = (sq: Square): readonly Square[] | undefined => {
			if (sq === 12) return [28, 20] as const; // e2 -> e4, e3
			return undefined;
		};

		const runtime = createBoardRuntime({
			renderer,
			board: { position: 'start' },
			view: { movability: { mode: 'strict', destinations: resolver } }
		});
		runtime.mount(container);

		expect(runtime.isMoveAttemptAllowed(12, 28)).toBe(true); // e2->e4 listed
		expect(runtime.isMoveAttemptAllowed(12, 20)).toBe(true); // e2->e3 listed
		expect(runtime.isMoveAttemptAllowed(12, 36)).toBe(false); // e2->e5 not listed
	});

	it('strict resolver-based movability: active destinations derived correctly', async () => {
		const renderer = createTestRenderer();
		const container = createMockContainer(400, 400);

		const resolver = (sq: Square): readonly Square[] | undefined => {
			if (sq === 12) return [28, 20] as const; // e2 -> e4, e3
			return undefined;
		};

		const runtime = createBoardRuntime({
			renderer,
			board: { position: 'start' },
			view: { movability: { mode: 'strict', destinations: resolver } }
		});
		runtime.mount(container);

		await waitForRender();

		runtime.select(12);

		const snap = runtime.getInteractionSnapshot();
		expect(snap.interaction.selectedSquare).toBe(12);
		expect(snap.interaction.destinations).toEqual([28, 20]);
	});

	// ── Core rendering path: geometry/orientation flow ─────────────────────────

	it('render geometry carries orientation — board snapshot does not', async () => {
		// Verifies: orientation is delivered to the renderer via RenderGeometry,
		// not via BoardStateSnapshot. BoardStateSnapshot has no orientation field.
		const renderer = createTestRenderer();
		const renderBoardSpy = vi.spyOn(renderer, 'renderBoard');
		const container = createMockContainer(400, 400);

		const runtime = createBoardRuntime({ renderer, view: { orientation: 'black' } });
		runtime.mount(container);

		await waitForRender();

		expect(renderBoardSpy).toHaveBeenCalled();
		const ctx = renderBoardSpy.mock.calls[0][0];
		const { board: boardSnapshot, geometry } = ctx;

		// Geometry carries orientation
		expect(geometry.orientation).toBe('black');

		// Board snapshot does NOT carry orientation
		expect('orientation' in boardSnapshot).toBe(false);
	});

	it('geometry orientation updates when setOrientation is called', async () => {
		// Verifies: after setOrientation, the next render receives geometry with the new orientation
		const renderer = createTestRenderer();
		const renderBoardSpy = vi.spyOn(renderer, 'renderBoard');
		const container = createMockContainer(400, 400);

		const runtime = createBoardRuntime({ renderer, view: { orientation: 'white' } });
		runtime.mount(container);

		await waitForRender();
		renderBoardSpy.mockClear();

		runtime.setOrientation('black');

		await waitForRender();

		expect(renderBoardSpy).toHaveBeenCalled();
		const ctx = renderBoardSpy.mock.calls[0][0];
		expect(ctx.geometry.orientation).toBe('black');
	});

	// ── Interaction state wiring ───────────────────────────────────────────────

	it('select() routes through interaction state: no-op on same square', () => {
		// Verifies: select() is wired to interaction state, not view state.
		// Selecting the same square twice returns false on the second call (no-op).
		const renderer = createTestRenderer();
		const container = createMockContainer(400, 400);

		const runtime = createBoardRuntime({ renderer, board: { position: 'start' } });
		runtime.mount(container);

		expect(runtime.select(12)).toBe(true); // changed: null → 12 in interaction state
		expect(runtime.select(12)).toBe(false); // no-op: already 12 in interaction state
	});

	it('select() routes through interaction state: no-op on already-null', () => {
		// Verifies: select(null) on a fresh runtime returns false (already null in interaction state).
		const renderer = createTestRenderer();
		const container = createMockContainer(400, 400);

		const runtime = createBoardRuntime({ renderer, board: { position: 'start' } });
		runtime.mount(container);

		expect(runtime.select(null)).toBe(false); // no-op: already null in interaction state
	});

	it('setBoardPosition resets runtime selection after position change', () => {
		// Verifies: setBoardPosition clears the selection owned by interaction state.
		// Observable: select(null) returns false only if selectedSquare is already null.
		const renderer = createTestRenderer();
		const container = createMockContainer(400, 400);

		const runtime = createBoardRuntime({ renderer, board: { position: 'start' } });
		runtime.mount(container);

		runtime.select(12); // set selection in interaction state

		runtime.setBoardPosition({ e4: { color: 'w', role: 'p' } });

		// selection was cleared: select(null) is a no-op (already null)
		expect(runtime.select(null)).toBe(false);
		// re-selecting works cleanly after the clear
		expect(runtime.select(12)).toBe(true);
	});

	// ── Interaction lifecycle ──────────────────────────────────────────────────

	describe('Interaction lifecycle', () => {
		it('select() under strict movability derives active destinations', async () => {
			const renderer = createTestRenderer();
			const container = createMockContainer(400, 400);

			const runtime = createBoardRuntime({
				renderer,
				board: { position: 'start' },
				view: { movability: { mode: 'strict', destinations: { 12: [28, 20] } } }
			});
			runtime.mount(container);

			await waitForRender();

			const changed = runtime.select(12);
			expect(changed).toBe(true);

			const snap = runtime.getInteractionSnapshot();
			expect(snap.interaction.selectedSquare).toBe(12);
			expect(snap.interaction.destinations).toEqual([28, 20]);
			expect(snap.interaction.dragSession).toBeNull();
			expect(snap.interaction.currentTarget).toBeNull();
		});

		it('select(null) clears selectedSquare, destinations, dragSession, and currentTarget', async () => {
			const renderer = createTestRenderer();
			const container = createMockContainer(400, 400);

			const runtime = createBoardRuntime({
				renderer,
				board: { position: 'start' },
				view: { movability: { mode: 'strict', destinations: { 12: [28, 20] } } }
			});
			runtime.mount(container);

			await waitForRender();

			runtime.select(12);

			const cleared = runtime.select(null);
			expect(cleared).toBe(true);

			const snap = runtime.getInteractionSnapshot();
			expect(snap.interaction.selectedSquare).toBeNull();
			expect(snap.interaction.destinations).toBeNull();
			expect(snap.interaction.dragSession).toBeNull();
			expect(snap.interaction.currentTarget).toBeNull();
		});

		it('beginSourceInteraction() creates dragSession and keeps selectedSquare/destinations', async () => {
			const renderer = createTestRenderer();
			const renderDragSpy = vi.spyOn(renderer, 'renderDrag');
			const container = createMockContainer(400, 400);

			const runtime = createBoardRuntime({
				renderer,
				board: { position: 'start' },
				view: { movability: { mode: 'strict', destinations: { 12: [28, 20] } } }
			});
			runtime.mount(container);

			await waitForRender();
			renderDragSpy.mockClear();

			const result = runtime.beginSourceInteraction(12, { x: 450, y: 650 });
			expect(result).toBe(true);

			const snap = runtime.getInteractionSnapshot();
			expect(snap.interaction.selectedSquare).toBe(12);
			expect(snap.interaction.destinations).toEqual([28, 20]);
			expect(snap.interaction.dragSession).not.toBeNull();
			expect(snap.interaction.dragSession!.fromSquare).toBe(12);

			await waitForRender();

			expect(renderDragSpy).toHaveBeenCalled();
			const ctx = renderDragSpy.mock.calls[0][0];
			expect(ctx.interaction.dragSession).not.toBeNull();
			expect(ctx.interaction.dragSession!.fromSquare).toBe(12);
		});

		it('notifyDragMove() updates currentTarget during drag', () => {
			const renderer = createTestRenderer();
			const container = createMockContainer(400, 400);

			const runtime = createBoardRuntime({
				renderer,
				board: { position: 'start' },
				view: { movability: { mode: 'strict', destinations: { 12: [28, 20] } } }
			});
			runtime.mount(container);

			runtime.beginSourceInteraction(12, { x: 450, y: 650 });

			let snap = runtime.getInteractionSnapshot();
			expect(snap.interaction.currentTarget).toBe(12);

			runtime.notifyDragMove(28, null);
			snap = runtime.getInteractionSnapshot();
			expect(snap.interaction.currentTarget).toBe(28);

			runtime.notifyDragMove(null, null);
			snap = runtime.getInteractionSnapshot();
			expect(snap.interaction.currentTarget).toBeNull();
		});

		it('cancelInteraction() clears dragSession + currentTarget, keeps selectedSquare + destinations', () => {
			const renderer = createTestRenderer();
			const container = createMockContainer(400, 400);

			const runtime = createBoardRuntime({
				renderer,
				board: { position: 'start' },
				view: { movability: { mode: 'strict', destinations: { 12: [28, 20] } } }
			});
			runtime.mount(container);

			runtime.beginSourceInteraction(12, { x: 450, y: 650 });
			runtime.notifyDragMove(28, null);

			const changed = runtime.cancelInteraction();
			expect(changed).toBe(true);

			const snap = runtime.getInteractionSnapshot();
			expect(snap.interaction.dragSession).toBeNull();
			expect(snap.interaction.currentTarget).toBeNull();
			expect(snap.interaction.selectedSquare).toBe(12);
			expect(snap.interaction.destinations).toEqual([28, 20]);
		});

		it('commitTo() from lifted drag: legal drop clears all interaction and applies move', async () => {
			const renderer = createTestRenderer();
			const renderDragSpy = vi.spyOn(renderer, 'renderDrag');
			const container = createMockContainer(400, 400);

			const runtime = createBoardRuntime({
				renderer,
				board: { position: 'start' },
				view: { movability: { mode: 'strict', destinations: { 12: [28, 20] } } }
			});
			runtime.mount(container);

			await waitForRender();
			renderDragSpy.mockClear();

			runtime.beginSourceInteraction(12, { x: 450, y: 650 });

			renderDragSpy.mockClear();
			const move = runtime.commitTo(28);
			expect(move).toBeTruthy();
			expect(move!.from).toBe(12);
			expect(move!.to).toBe(28);

			const snap = runtime.getInteractionSnapshot();
			expect(snap.interaction.selectedSquare).toBeNull();
			expect(snap.interaction.destinations).toBeNull();
			expect(snap.interaction.dragSession).toBeNull();
			expect(snap.interaction.currentTarget).toBeNull();

			await waitForRender();

			expect(renderDragSpy).toHaveBeenCalled();
			const ctx = renderDragSpy.mock.calls[0][0];
			expect(ctx.interaction.dragSession).toBeNull();
		});

		it('commitTo() from lifted drag: illegal drop keeps selection', () => {
			const renderer = createTestRenderer();
			const container = createMockContainer(400, 400);

			const runtime = createBoardRuntime({
				renderer,
				board: { position: 'start' },
				view: { movability: { mode: 'strict', destinations: { 12: [28, 20] } } }
			});
			runtime.mount(container);

			runtime.beginSourceInteraction(12, { x: 450, y: 650 });

			const res = runtime.commitTo(36); // unlisted target
			expect(res).toBeNull();

			const snap = runtime.getInteractionSnapshot();
			expect(snap.interaction.dragSession).toBeNull();
			expect(snap.interaction.currentTarget).toBeNull();
			expect(snap.interaction.selectedSquare).toBe(12);
			expect(snap.interaction.destinations).toEqual([28, 20]);
		});

		it('commitTo() from tap-to-move: legal completion applies move', () => {
			const renderer = createTestRenderer();
			const container = createMockContainer(400, 400);

			const runtime = createBoardRuntime({
				renderer,
				board: { position: { e2: { color: 'w', role: 'p' } } },
				view: { movability: { mode: 'strict', destinations: { 12: [28, 20] } } }
			});
			runtime.mount(container);

			runtime.select(12); // tap-to-move: select without drag
			const move = runtime.commitTo(28);
			expect(move).not.toBeNull();
			expect(move!.from).toBe(12);
			expect(move!.to).toBe(28);

			const snap = runtime.getInteractionSnapshot();
			expect(snap.interaction.selectedSquare).toBeNull();
		});

		it('commitTo() from release-targeting: illegal drop on different square clears selection', () => {
			const renderer = createTestRenderer();
			const container = createMockContainer(400, 400);

			const runtime = createBoardRuntime({
				renderer,
				board: { position: 'start' },
				view: { movability: { mode: 'strict', destinations: { 12: [28, 20] } } }
			});
			runtime.mount(container);

			runtime.select(12);
			runtime.startReleaseTargeting(36, null);
			const res = runtime.commitTo(36); // illegal, different square
			expect(res).toBeNull();

			const snap = runtime.getInteractionSnapshot();
			expect(snap.interaction.selectedSquare).toBeNull();
			expect(snap.interaction.destinations).toBeNull();
			expect(snap.interaction.dragSession).toBeNull();
			expect(snap.interaction.currentTarget).toBeNull();
		});

		it('commitTo() from release-targeting: illegal drop on source square preserves selection', () => {
			const renderer = createTestRenderer();
			const container = createMockContainer(400, 400);

			const runtime = createBoardRuntime({
				renderer,
				board: { position: 'start' },
				view: { movability: { mode: 'strict', destinations: { 12: [28, 20] } } }
			});
			runtime.mount(container);

			runtime.select(12);
			runtime.startReleaseTargeting(12, null);
			const res = runtime.commitTo(12); // illegal same-square
			expect(res).toBeNull();

			const snap = runtime.getInteractionSnapshot();
			expect(snap.interaction.selectedSquare).toBe(12);
			expect(snap.interaction.dragSession).toBeNull();
			expect(snap.interaction.releaseTargetingActive).toBe(false);
			expect(snap.interaction.currentTarget).toBeNull();
		});

		it('renderer ownership: piece moves between piecesRoot and dragRoot during drag lifecycle', async () => {
			const renderer = createTestRenderer();
			const container = createMockContainer(400, 400);

			const runtime = createBoardRuntime({
				renderer,
				board: { position: { e2: { color: 'w', role: 'p' } } },
				view: { movability: { mode: 'strict', destinations: { 12: [28, 20] } } }
			});
			runtime.mount(container);

			await waitForRender();

			runtime.beginSourceInteraction(12, { x: 450, y: 650 });
			runtime.notifyDragMove(28, { x: 200, y: 300 });

			await waitForRender();

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const piecesRoot = (renderer as any).piecesRoot as SVGGElement;
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const dragRoot = (renderer as any).dragRoot as SVGGElement;

			expect(piecesRoot.children.length).toBe(0);
			expect(dragRoot.children.length).toBe(1);

			runtime.commitTo(36); // illegal drop

			await waitForRender();

			expect(dragRoot.children.length).toBe(0);
			expect(piecesRoot.children.length).toBe(1);
		});
	});
});
