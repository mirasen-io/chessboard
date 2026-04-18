/**
 * Phase 3.3 — BoardRuntime drag rendering invalidation tests.
 *
 * Verifies that drag lifecycle transitions correctly mark DirtyLayer.Drag,
 * schedule renders, and pass curated drag info to the renderer.
 *
 * These tests do NOT test pointer coordinates or hit-testing (Phase 3.4).
 * They verify invalidation routing and renderer input only.
 */

import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { SvgRenderer } from '../../../src/core/renderer/SvgRenderer';
import type { Renderer } from '../../../src/core/renderer/types';
import { createBoardRuntime } from '../../../src/core/runtime/boardRuntime';
import { DirtyLayer } from '../../../src/core/scheduler/types';
import type { Square } from '../../../src/core/state/boardTypes';

function sq(n: number): Square {
	return n as Square;
}

// ── ResizeObserver stub ────────────────────────────────────────────────────────

class StubResizeObserver {
	observe() {}
	unobserve() {}
	disconnect() {}
}

const originalResizeObserver = globalThis.ResizeObserver;

beforeAll(() => {
	globalThis.ResizeObserver = StubResizeObserver as unknown as typeof ResizeObserver;
});

afterAll(() => {
	globalThis.ResizeObserver = originalResizeObserver;
});

// ── Helpers ────────────────────────────────────────────────────────────────────

function createMockContainer(size = 400): HTMLElement {
	const el = document.createElement('div');
	Object.defineProperty(el, 'clientWidth', { value: size, configurable: true });
	Object.defineProperty(el, 'clientHeight', { value: size, configurable: true });
	return el;
}

function createTestRenderer(): Renderer {
	return new SvgRenderer();
}

function waitForRender(): Promise<void> {
	return new Promise<void>((resolve) => {
		requestAnimationFrame(() => resolve());
	});
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('Phase 3.3 / BoardRuntime — drag rendering invalidation', () => {
	// ── 6. dragStart() causes drag-layer render/invalidation ──────────────────

	describe('beginSourceInteraction() — drag-layer invalidation', () => {
		it('beginSourceInteraction marks DirtyLayer.Drag | Pieces', async () => {
			const renderer = createTestRenderer();
			const renderBoardSpy = vi.spyOn(renderer, 'renderBoard');
			const runtime = createBoardRuntime({
				renderer,
				board: { position: { e2: { color: 'w', role: 'p' } } },
				view: { movability: { mode: 'free' } }
			});
			runtime.mount(createMockContainer());

			await waitForRender();
			renderBoardSpy.mockClear();

			runtime.beginSourceInteraction(sq(12), { x: 450, y: 650 }); // e2

			await waitForRender();

			expect(renderBoardSpy).toHaveBeenCalled();
			const ctx = renderBoardSpy.mock.calls[0][0];
			expect(ctx.invalidation.layers & DirtyLayer.Drag).toBe(DirtyLayer.Drag);
		});

		it('beginSourceInteraction schedules render', async () => {
			const renderer = createTestRenderer();
			const renderBoardSpy = vi.spyOn(renderer, 'renderBoard');
			const runtime = createBoardRuntime({
				renderer,
				board: { position: { e2: { color: 'w', role: 'p' } } },
				view: { movability: { mode: 'free' } }
			});
			runtime.mount(createMockContainer());

			await waitForRender();
			renderBoardSpy.mockClear();

			runtime.beginSourceInteraction(sq(12), { x: 450, y: 650 });

			await waitForRender();

			expect(renderBoardSpy).toHaveBeenCalled();
			const ctx = renderBoardSpy.mock.calls[0][0];
			expect(ctx.invalidation.layers & DirtyLayer.Pieces).toBe(DirtyLayer.Pieces);
		});

		// ── 7. runtime passes drag.sourceSquare to renderer during active drag ──

		it('renderDrag receives drag context during active drag', async () => {
			const renderer = createTestRenderer();
			const renderDragSpy = vi.spyOn(renderer, 'renderDrag');
			const runtime = createBoardRuntime({
				renderer,
				board: { position: { e2: { color: 'w', role: 'p' } } },
				view: { movability: { mode: 'free' } }
			});
			runtime.mount(createMockContainer());

			await waitForRender();
			renderDragSpy.mockClear();

			runtime.beginSourceInteraction(sq(12), { x: 450, y: 650 });
			runtime.notifyDragMove(sq(28), { x: 450, y: 550 }); // e4

			await waitForRender();

			expect(renderDragSpy).toHaveBeenCalled();
			const ctx = renderDragSpy.mock.calls[0][0];
			expect(ctx.interaction.dragSession).not.toBeNull();
			expect(ctx.interaction.dragSession!.fromSquare).toBe(sq(12));
		});

		it('renderDrag receives null drag after cancelInteraction', async () => {
			const renderer = createTestRenderer();
			const renderDragSpy = vi.spyOn(renderer, 'renderDrag');
			const runtime = createBoardRuntime({
				renderer,
				board: { position: { e2: { color: 'w', role: 'p' } } },
				view: { movability: { mode: 'free' } }
			});
			runtime.mount(createMockContainer());

			await waitForRender();

			// Initial render — no drag active
			expect(renderDragSpy).toHaveBeenCalled();
			const ctx = renderDragSpy.mock.calls[0][0];
			expect(ctx.interaction.dragSession).toBeNull();
		});
	});

	// ── 8. cancelInteraction() after active drag clears drag render state ─────

	describe('cancelInteraction() — drag render state cleared', () => {
		it('cancelInteraction() after drag marks DirtyLayer.Drag', async () => {
			const renderer = createTestRenderer();
			const renderBoardSpy = vi.spyOn(renderer, 'renderBoard');
			const runtime = createBoardRuntime({
				renderer,
				board: { position: { e2: { color: 'w', role: 'p' } } },
				view: { movability: { mode: 'free' } }
			});
			runtime.mount(createMockContainer());

			await waitForRender();

			runtime.beginSourceInteraction(sq(12), { x: 450, y: 650 });

			await waitForRender();
			renderBoardSpy.mockClear();

			runtime.cancelInteraction();

			await waitForRender();

			expect(renderBoardSpy).toHaveBeenCalled();
			const ctx = renderBoardSpy.mock.calls[0][0];
			expect(ctx.invalidation.layers & DirtyLayer.Drag).toBe(DirtyLayer.Drag);
		});

		it('cancelInteraction() after drag passes drag: null to renderer', async () => {
			const renderer = createTestRenderer();
			const renderDragSpy = vi.spyOn(renderer, 'renderDrag');
			const runtime = createBoardRuntime({
				renderer,
				board: { position: { e2: { color: 'w', role: 'p' } } },
				view: { movability: { mode: 'free' } }
			});
			runtime.mount(createMockContainer());

			await waitForRender();

			runtime.beginSourceInteraction(sq(12), { x: 450, y: 650 });

			await waitForRender();
			renderDragSpy.mockClear();

			runtime.cancelInteraction();

			await waitForRender();

			expect(renderDragSpy).toHaveBeenCalled();
			const ctx = renderDragSpy.mock.calls[0][0];
			expect(ctx.interaction.dragSession).toBeNull();
		});

		it('cancelInteraction() with no active drag does not schedule additional render', async () => {
			const renderer = createTestRenderer();
			const renderBoardSpy = vi.spyOn(renderer, 'renderBoard');
			const renderDragSpy = vi.spyOn(renderer, 'renderDrag');
			const runtime = createBoardRuntime({
				renderer,
				board: { position: { e2: { color: 'w', role: 'p' } } },
				view: { movability: { mode: 'free' } }
			});
			runtime.mount(createMockContainer());

			await waitForRender();
			renderBoardSpy.mockClear();
			renderDragSpy.mockClear();

			// select() schedules a render due to extension updates
			runtime.select(sq(12));

			await waitForRender();

			// Clear spy after select render
			renderBoardSpy.mockClear();
			renderDragSpy.mockClear();

			// cancelInteraction with no active drag should be a no-op for rendering
			runtime.cancelInteraction(); // no drag was started

			await waitForRender();

			expect(renderBoardSpy).not.toHaveBeenCalled();
			expect(renderDragSpy).not.toHaveBeenCalled();
		});
	});

	// ── 9. illegal lifted drop clears drag render state ───────────────────────

	describe('commitTo() illegal lifted-piece — drag render state cleared', () => {
		it('commitTo illegal drop in lifted-piece mode clears drag but keeps selection', async () => {
			const renderer = createTestRenderer();
			const renderBoardSpy = vi.spyOn(renderer, 'renderBoard');
			const runtime = createBoardRuntime({
				renderer,
				board: { position: { e2: { color: 'w', role: 'p' } } },
				view: {
					movability: {
						mode: 'strict',
						destinations: { 12: [28, 20] }
					}
				}
			});
			runtime.mount(createMockContainer());

			await waitForRender();

			runtime.beginSourceInteraction(sq(12), { x: 450, y: 650 });

			await waitForRender();
			renderBoardSpy.mockClear();

			runtime.commitTo(sq(36)); // e5 — not in destinations (illegal)

			await waitForRender();

			expect(renderBoardSpy).toHaveBeenCalled();
			const ctx = renderBoardSpy.mock.calls[0][0];
			expect(ctx.invalidation.layers & DirtyLayer.Drag).toBe(DirtyLayer.Drag);
		});

		it('commitTo illegal drop passes drag: null to renderer (piece snaps back)', async () => {
			const renderer = createTestRenderer();
			const renderDragSpy = vi.spyOn(renderer, 'renderDrag');
			const runtime = createBoardRuntime({
				renderer,
				board: { position: { e2: { color: 'w', role: 'p' } } },
				view: {
					movability: {
						mode: 'strict',
						destinations: { 12: [28, 20] }
					}
				}
			});
			runtime.mount(createMockContainer());

			await waitForRender();

			runtime.beginSourceInteraction(sq(12), { x: 450, y: 650 });

			await waitForRender();
			renderDragSpy.mockClear();

			runtime.commitTo(sq(36)); // illegal

			await waitForRender();

			expect(renderDragSpy).toHaveBeenCalled();
			const ctx = renderDragSpy.mock.calls[0][0];
			expect(ctx.interaction.dragSession).toBeNull();
		});

		it('commitTo illegal drop also marks DirtyLayer.Pieces (source piece returns to piecesRoot)', async () => {
			const renderer = createTestRenderer();
			const renderBoardSpy = vi.spyOn(renderer, 'renderBoard');
			const runtime = createBoardRuntime({
				renderer,
				board: { position: { e2: { color: 'w', role: 'p' } } },
				view: {
					movability: {
						mode: 'strict',
						destinations: { 12: [28, 20] }
					}
				}
			});
			runtime.mount(createMockContainer());

			await waitForRender();

			runtime.beginSourceInteraction(sq(12), { x: 450, y: 650 });

			await waitForRender();
			renderBoardSpy.mockClear();

			runtime.commitTo(sq(36)); // illegal

			await waitForRender();

			expect(renderBoardSpy).toHaveBeenCalled();
			const ctx = renderBoardSpy.mock.calls[0][0];
			expect(ctx.invalidation.layers & DirtyLayer.Pieces).toBe(DirtyLayer.Pieces);
		});
	});

	// ── 10. legal drop clears drag render state while preserving move invalidation

	describe('commitTo() legal — drag cleared, move invalidation preserved', () => {
		it('commitTo legal drop clears drag and preserves move invalidation', async () => {
			const renderer = createTestRenderer();
			const renderBoardSpy = vi.spyOn(renderer, 'renderBoard');
			const runtime = createBoardRuntime({
				renderer,
				board: { position: { e2: { color: 'w', role: 'p' } } },
				view: { movability: { mode: 'free' } }
			});
			runtime.mount(createMockContainer());

			await waitForRender();

			runtime.beginSourceInteraction(sq(12), { x: 450, y: 650 });

			await waitForRender();
			renderBoardSpy.mockClear();

			runtime.commitTo(sq(28)); // e4 — legal

			await waitForRender();

			expect(renderBoardSpy).toHaveBeenCalled();
			const ctx = renderBoardSpy.mock.calls[0][0];
			expect(ctx.invalidation.layers & DirtyLayer.Drag).toBe(DirtyLayer.Drag);
		});

		it('commitTo legal drop passes drag: null to renderer', async () => {
			const renderer = createTestRenderer();
			const renderDragSpy = vi.spyOn(renderer, 'renderDrag');
			const runtime = createBoardRuntime({
				renderer,
				board: { position: { e2: { color: 'w', role: 'p' } } },
				view: { movability: { mode: 'free' } }
			});
			runtime.mount(createMockContainer());

			await waitForRender();

			runtime.beginSourceInteraction(sq(12), { x: 450, y: 650 });

			await waitForRender();
			renderDragSpy.mockClear();

			runtime.commitTo(sq(28)); // legal

			await waitForRender();

			expect(renderDragSpy).toHaveBeenCalled();
			const ctx = renderDragSpy.mock.calls[0][0];
			expect(ctx.interaction.dragSession).toBeNull();
		});

		it('commitTo legal drop also marks DirtyLayer.Pieces and preserves dirty squares from move', async () => {
			// moveReducer marks Pieces + squares (e2=12, e4=28).
			// commitTo legal must OR in Drag without clearing those squares.
			const renderer = createTestRenderer();
			const renderBoardSpy = vi.spyOn(renderer, 'renderBoard');
			const runtime = createBoardRuntime({
				renderer,
				board: { position: { e2: { color: 'w', role: 'p' } } },
				view: { movability: { mode: 'free' } }
			});
			runtime.mount(createMockContainer());

			await waitForRender();

			runtime.beginSourceInteraction(sq(12), { x: 450, y: 650 });

			await waitForRender();
			renderBoardSpy.mockClear();

			runtime.commitTo(sq(28)); // legal move e2→e4

			await waitForRender();

			expect(renderBoardSpy).toHaveBeenCalled();
			const ctx = renderBoardSpy.mock.calls[0][0];
			// Both Pieces and Drag must be set
			expect(ctx.invalidation.layers & DirtyLayer.Pieces).toBe(DirtyLayer.Pieces);
			expect(ctx.invalidation.layers & DirtyLayer.Drag).toBe(DirtyLayer.Drag);
			// Dirty squares from the move must be preserved
			expect(ctx.invalidation.squares).toBeDefined();
			expect(ctx.invalidation.squares!.has(sq(12))).toBe(true); // e2 (from)
			expect(ctx.invalidation.squares!.has(sq(28))).toBe(true); // e4 (to)
		});
	});
});
