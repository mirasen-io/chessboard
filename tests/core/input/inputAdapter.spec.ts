/**
 * Phase 3.7 — InputAdapter integration tests.
 *
 * Tests the DOM/pointer → controller → runtime wiring.
 * Uses real runtime, real DOM host, fake renderer, and real PointerEvent dispatch.
 *
 * Validates:
 * - Pointer event routing through the adapter
 * - Square coordinate resolution
 * - Interaction state updates via runtime snapshot
 * - Adapter lifecycle (destroy cleanup)
 * - Live geometry consultation (not cached)
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type {
	AnimationRenderContext,
	BoardRenderContext,
	DragRenderContext,
	Renderer
} from '../../../src/core/renderer/types';
import { createBoardRuntime } from '../../../src/core/runtime/boardRuntime';
import type { BoardStateSnapshot, Square } from '../../../src/core/state/boardTypes';

// ── Helpers ────────────────────────────────────────────────────────────────────

function sq(n: number): Square {
	return n as Square;
}

function waitForRender(): Promise<void> {
	return new Promise<void>((resolve) => {
		requestAnimationFrame(() => resolve());
	});
}

/**
 * Minimal fake renderer for testing.
 * Captures the latest board snapshot and render contexts for test assertions.
 * Phase 3.10: Updated to split renderer API.
 */
class FakeRenderer implements Renderer {
	lastBoardSnapshot: BoardStateSnapshot | null = null;
	lastBoardContext: BoardRenderContext | null = null;
	lastAnimationContext: AnimationRenderContext | null = null;
	lastDragContext: DragRenderContext | null = null;
	renderCount = 0;

	mount(): void {}
	unmount(): void {}

	renderBoard(ctx: BoardRenderContext): void {
		this.lastBoardSnapshot = ctx.board;
		this.lastBoardContext = ctx;
		this.renderCount++;
	}

	renderAnimations(ctx: AnimationRenderContext): void {
		this.lastAnimationContext = ctx;
	}

	renderDrag(ctx: DragRenderContext): void {
		this.lastDragContext = ctx;
	}

	allocateExtensionSlots<TSlots extends string>(
		_extensionId: string,
		slotNames: readonly TSlots[]
	): Partial<Record<TSlots, SVGGElement>> {
		// Provide minimal valid slot handles for runtime mount
		const slots: Partial<Record<TSlots, SVGGElement>> = {};
		for (const name of slotNames) {
			// Create stub SVGGElement - runtime only needs a truthy container reference
			slots[name] = document.createElementNS('http://www.w3.org/2000/svg', 'g') as SVGGElement;
		}
		return slots;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	removeExtensionSlots(_extensionId: string): void {}

	// Compatibility helpers for tests that check interaction/transientVisuals
	get lastRenderContext() {
		return {
			board: this.lastBoardSnapshot,
			interaction: this.lastDragContext?.interaction ?? {
				selectedSquare: null,
				destinations: null,
				currentTarget: null,
				dragSession: null
			},
			transientVisuals: this.lastDragContext?.transientVisuals ?? {
				dragPointer: null
			}
		};
	}
}

/**
 * Create a test host element with stubbed geometry.
 * Returns a div with stable dimensions and getBoundingClientRect.
 */
function createTestHost(size = 800): HTMLElement {
	const host = document.createElement('div');
	Object.defineProperty(host, 'clientWidth', {
		value: size,
		configurable: true,
		writable: true
	});
	Object.defineProperty(host, 'clientHeight', {
		value: size,
		configurable: true,
		writable: true
	});
	// Stub getBoundingClientRect to return top-left at (0, 0)
	host.getBoundingClientRect = () => ({
		left: 0,
		top: 0,
		right: size,
		bottom: size,
		width: size,
		height: size,
		x: 0,
		y: 0,
		toJSON: () => ({})
	});
	return host;
}

/**
 * Patch pointer capture methods on a host element.
 * jsdom does not provide these by default.
 */
function patchPointerCapture(host: HTMLElement): void {
	const capturedPointers = new Set<number>();
	host.setPointerCapture = (pointerId: number) => {
		capturedPointers.add(pointerId);
	};
	host.releasePointerCapture = (pointerId: number) => {
		capturedPointers.delete(pointerId);
	};
	host.hasPointerCapture = (pointerId: number) => {
		return capturedPointers.has(pointerId);
	};
}

/**
 * Create and dispatch a PointerEvent on the given element.
 */
function dispatchPointer(
	element: HTMLElement,
	type: string,
	options: {
		clientX?: number;
		clientY?: number;
		pointerId?: number;
		isPrimary?: boolean;
		button?: number;
	} = {}
): void {
	const event = new PointerEvent(type, {
		bubbles: true,
		cancelable: true,
		clientX: options.clientX ?? 0,
		clientY: options.clientY ?? 0,
		pointerId: options.pointerId ?? 1,
		isPrimary: options.isPrimary ?? true,
		button: options.button ?? 0,
		buttons: options.button !== undefined ? 1 << options.button : 1
	});
	element.dispatchEvent(event);
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

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('InputAdapter integration (Phase 3.7)', () => {
	// ── 1. on-board pointerdown starts interaction ─────────────────────────────

	it('on-board pointerdown starts the interaction path', () => {
		const host = createTestHost(800);
		patchPointerCapture(host);
		const runtime = createBoardRuntime({
			renderer: new FakeRenderer(),
			board: { position: 'start' },
			view: { movability: { mode: 'free' } }
		});
		runtime.mount(host);

		// e2 is at square 12. With 800px board, square size = 100px.
		// e2 in white orientation: file e = 4, rank 2 = 1 → (4*100, 6*100) = (400, 600)
		dispatchPointer(host, 'pointerdown', { clientX: 450, clientY: 650 });

		const snap = runtime.getInteractionSnapshot();
		expect(snap.interaction.selectedSquare).toBe(sq(12)); // e2
		expect(snap.interaction.dragSession).not.toBeNull();
		expect(snap.interaction.dragSession!.fromSquare).toBe(sq(12));

		runtime.destroy();
	});

	// ── 2. off-board pointerdown is no-op ──────────────────────────────────────

	it('off-board pointerdown is a no-op', () => {
		const host = createTestHost(800);
		patchPointerCapture(host);
		const runtime = createBoardRuntime({
			renderer: new FakeRenderer(),
			board: { position: 'start' },
			view: { movability: { mode: 'free' } }
		});
		runtime.mount(host);

		// Dispatch outside board bounds
		dispatchPointer(host, 'pointerdown', { clientX: 900, clientY: 900 });

		const snap = runtime.getInteractionSnapshot();
		expect(snap.interaction.selectedSquare).toBeNull();
		expect(snap.interaction.dragSession).toBeNull();

		runtime.destroy();
	});

	// ── 3. pointermove updates currentTarget ───────────────────────────────────

	it('pointermove updates currentTarget through the adapter', () => {
		const host = createTestHost(800);
		patchPointerCapture(host);
		const runtime = createBoardRuntime({
			renderer: new FakeRenderer(),
			board: { position: 'start' },
			view: { movability: { mode: 'free' } }
		});
		runtime.mount(host);

		// Start interaction on e2 (12)
		dispatchPointer(host, 'pointerdown', { clientX: 450, clientY: 650 });

		// Move to e4 (28): file e = 4, rank 4 = 3 → (4*100, 4*100) = (400, 400)
		dispatchPointer(host, 'pointermove', { clientX: 450, clientY: 450 });

		const snap = runtime.getInteractionSnapshot();
		expect(snap.interaction.currentTarget).toBe(sq(28)); // e4

		runtime.destroy();
	});

	// ── 4. pointerleave routes as null target, not cancel ──────────────────────

	it('pointerleave routes as null target, not cancel', () => {
		const host = createTestHost(800);
		patchPointerCapture(host);
		const runtime = createBoardRuntime({
			renderer: new FakeRenderer(),
			board: { position: 'start' },
			view: { movability: { mode: 'free' } }
		});
		runtime.mount(host);

		// Start interaction and set a target
		dispatchPointer(host, 'pointerdown', { clientX: 450, clientY: 650 });
		dispatchPointer(host, 'pointermove', { clientX: 450, clientY: 450 });

		let snap = runtime.getInteractionSnapshot();
		expect(snap.interaction.currentTarget).toBe(sq(28)); // e4

		// Dispatch pointerleave
		dispatchPointer(host, 'pointerleave', {});

		snap = runtime.getInteractionSnapshot();
		expect(snap.interaction.currentTarget).toBeNull();
		// Interaction still active (drag session not cleared)
		expect(snap.interaction.dragSession).not.toBeNull();
		expect(snap.interaction.selectedSquare).toBe(sq(12));

		runtime.destroy();
	});

	// ── 5. pointerup routes through release/drop path ──────────────────────────

	it('pointerup routes through release/drop path', async () => {
		const host = createTestHost(800);
		patchPointerCapture(host);
		const renderer = new FakeRenderer();
		const runtime = createBoardRuntime({
			renderer,
			board: { position: { e2: { color: 'w', role: 'p' } } },
			view: { movability: { mode: 'free' } }
		});
		runtime.mount(host);

		await waitForRender();

		// Start drag on e2 (sq 12)
		dispatchPointer(host, 'pointerdown', { clientX: 450, clientY: 650 });

		// Release on e4 (sq 28)
		dispatchPointer(host, 'pointerup', { clientX: 450, clientY: 450 });

		await waitForRender();

		const snap = runtime.getInteractionSnapshot();
		// Legal completion: all interaction cleared
		expect(snap.interaction.selectedSquare).toBeNull();
		expect(snap.interaction.dragSession).toBeNull();
		expect(snap.interaction.currentTarget).toBeNull();
		// Board state: piece moved from e2 to e4 (read from renderer's captured snapshot)
		expect(renderer.lastBoardSnapshot).not.toBeNull();
		expect(renderer.lastBoardSnapshot!.pieces[12]).toBe(0); // e2 empty
		expect(renderer.lastBoardSnapshot!.pieces[28]).not.toBe(0); // e4 has piece

		runtime.destroy();
	});

	// ── 5b. same-square release is graceful ────────────────────────────────────

	it('same-square release is graceful (no throw, no move, interaction cleared)', async () => {
		const host = createTestHost(800);
		patchPointerCapture(host);
		const renderer = new FakeRenderer();
		const runtime = createBoardRuntime({
			renderer,
			board: { position: { e2: { color: 'w', role: 'p' } } },
			view: { movability: { mode: 'free' } }
		});
		runtime.mount(host);

		await waitForRender();

		// Start drag on e2 (sq 12)
		dispatchPointer(host, 'pointerdown', { clientX: 450, clientY: 650 });

		// Release on same square e2
		dispatchPointer(host, 'pointerup', { clientX: 450, clientY: 650 });

		await waitForRender();

		const snap = runtime.getInteractionSnapshot();
		// No throw occurred
		// No board move applied: piece still on e2 (read from renderer's captured snapshot)
		expect(renderer.lastBoardSnapshot).not.toBeNull();
		expect(renderer.lastBoardSnapshot!.pieces[12]).not.toBe(0); // e2 still has piece
		// Illegal completion in lifted-piece mode: drag/target cleared, selection kept
		expect(snap.interaction.dragSession).toBeNull();
		expect(snap.interaction.currentTarget).toBeNull();
		expect(snap.interaction.selectedSquare).toBe(sq(12)); // selection preserved

		runtime.destroy();
	});

	// ── 6. pointercancel routes through cancel path ───────────────────────────

	it('pointercancel routes through cancel path', () => {
		const host = createTestHost(800);
		patchPointerCapture(host);
		const runtime = createBoardRuntime({
			renderer: new FakeRenderer(),
			board: { position: 'start' },
			view: { movability: { mode: 'free' } }
		});
		runtime.mount(host);

		// Start drag
		dispatchPointer(host, 'pointerdown', { clientX: 450, clientY: 650 });
		dispatchPointer(host, 'pointermove', { clientX: 450, clientY: 450 });

		let snap = runtime.getInteractionSnapshot();
		expect(snap.interaction.dragSession).not.toBeNull();
		expect(snap.interaction.currentTarget).toBe(sq(28));

		// Cancel
		dispatchPointer(host, 'pointercancel', {});

		snap = runtime.getInteractionSnapshot();
		// Cancel clears drag and currentTarget, keeps selection
		expect(snap.interaction.dragSession).toBeNull();
		expect(snap.interaction.currentTarget).toBeNull();
		expect(snap.interaction.selectedSquare).toBe(sq(12)); // preserved

		runtime.destroy();
	});

	// ── 7. non-primary and non-left-button input is ignored ───────────────────

	it('non-primary pointer is ignored', () => {
		const host = createTestHost(800);
		patchPointerCapture(host);
		const runtime = createBoardRuntime({
			renderer: new FakeRenderer(),
			board: { position: 'start' },
			view: { movability: { mode: 'free' } }
		});
		runtime.mount(host);

		// Dispatch non-primary pointerdown
		dispatchPointer(host, 'pointerdown', {
			clientX: 450,
			clientY: 650,
			isPrimary: false
		});

		const snap = runtime.getInteractionSnapshot();
		expect(snap.interaction.selectedSquare).toBeNull();
		expect(snap.interaction.dragSession).toBeNull();

		runtime.destroy();
	});

	it('non-left-button pointer is ignored', () => {
		const host = createTestHost(800);
		patchPointerCapture(host);
		const runtime = createBoardRuntime({
			renderer: new FakeRenderer(),
			board: { position: 'start' },
			view: { movability: { mode: 'free' } }
		});
		runtime.mount(host);

		// Dispatch right-button pointerdown (button = 2)
		dispatchPointer(host, 'pointerdown', {
			clientX: 450,
			clientY: 650,
			button: 2
		});

		const snap = runtime.getInteractionSnapshot();
		expect(snap.interaction.selectedSquare).toBeNull();
		expect(snap.interaction.dragSession).toBeNull();

		runtime.destroy();
	});

	// ── 8. destroy cleanup removes active adapter behavior ────────────────────

	it('destroy cleanup removes active adapter behavior', () => {
		const host = createTestHost(800);
		patchPointerCapture(host);
		const runtime = createBoardRuntime({
			renderer: new FakeRenderer(),
			board: { position: 'start' },
			view: { movability: { mode: 'free' } }
		});
		runtime.mount(host);

		// Start interaction
		dispatchPointer(host, 'pointerdown', { clientX: 450, clientY: 650 });

		let snap = runtime.getInteractionSnapshot();
		expect(snap.interaction.selectedSquare).toBe(sq(12));

		// Destroy runtime
		runtime.destroy();

		// Dispatch pointer events after destroy
		dispatchPointer(host, 'pointermove', { clientX: 450, clientY: 450 });
		dispatchPointer(host, 'pointerup', { clientX: 450, clientY: 450 });

		// Snapshot should remain unchanged (no interaction state changes)
		snap = runtime.getInteractionSnapshot();
		expect(snap.interaction.selectedSquare).toBe(sq(12)); // unchanged from before destroy
	});

	// ── 9. geometry getter is live, not cached across orientation changes ─────

	it('geometry getter is live, not cached across orientation changes', () => {
		const host = createTestHost(800);
		patchPointerCapture(host);
		const runtime = createBoardRuntime({
			renderer: new FakeRenderer(),
			board: { position: 'start' },
			view: { orientation: 'white', movability: { mode: 'free' } }
		});
		runtime.mount(host);

		// In white orientation: a1 (sq 0) is at bottom-left (0, 700)
		// Start interaction on a1
		dispatchPointer(host, 'pointerdown', { clientX: 50, clientY: 750, pointerId: 1 });

		let snap = runtime.getInteractionSnapshot();
		expect(snap.interaction.selectedSquare).toBe(sq(0)); // a1

		// Cancel to clear interaction
		dispatchPointer(host, 'pointercancel', { pointerId: 1 });
		// Explicitly clear selection between test scenarios
		runtime.select(null);

		// Change orientation to black
		runtime.setOrientation('black');

		// In black orientation: board is flipped
		// The same physical coordinate (50, 750) now maps to h8 (sq 63)
		// because a1 moved to top-right and h8 moved to bottom-left
		dispatchPointer(host, 'pointerdown', { clientX: 50, clientY: 750, pointerId: 2 });

		snap = runtime.getInteractionSnapshot();
		// If geometry is live, this should map to h8 (63) in black orientation
		expect(snap.interaction.selectedSquare).toBe(sq(63)); // h8, proving live geometry

		runtime.destroy();
	});

	// ── 10. Phase 3.8 regression guard: drag preview initialized on pointerdown, updates on same-square pointermove ─────

	it('Phase 3.8: drag preview initialized on pointerdown, updates on same-square pointermove', async () => {
		const host = createTestHost(800);
		patchPointerCapture(host);
		const renderer = new FakeRenderer();
		const runtime = createBoardRuntime({
			renderer,
			board: { position: { e2: { color: 'w', role: 'p' } } },
			view: { movability: { mode: 'free' } }
		});
		runtime.mount(host);

		await waitForRender();

		// Start drag on e2 (sq 12): file e=4, rank 2=1 → (4*100, 6*100) = (400, 600)
		dispatchPointer(host, 'pointerdown', { clientX: 450, clientY: 650 });

		await waitForRender();

		// Assert 1: drag preview initialized immediately on pointerdown (guards missing-initial-preview bug)
		expect(renderer.lastRenderContext?.interaction.dragSession).not.toBeNull();
		expect(renderer.lastRenderContext?.transientVisuals.dragPointer).not.toBeNull();
		expect(renderer.lastRenderContext?.transientVisuals.dragPointer?.x).toBe(450);
		expect(renderer.lastRenderContext?.transientVisuals.dragPointer?.y).toBe(650);

		const renderCountAfterDown = renderer.renderCount;

		// Move pointer within same square e2 but different pixel position
		// Still on e2 (400-500, 600-700) but moved from (450, 650) to (480, 680)
		dispatchPointer(host, 'pointermove', { clientX: 480, clientY: 680 });

		await waitForRender();

		// Assert 2: drag visual updated on same-square pointermove (guards same-square no-redraw bug)
		expect(renderer.renderCount).toBeGreaterThan(renderCountAfterDown);
		expect(renderer.lastRenderContext?.transientVisuals.dragPointer?.x).toBe(480);
		expect(renderer.lastRenderContext?.transientVisuals.dragPointer?.y).toBe(680);

		// Verify semantic target remains the same (still e2)
		expect(renderer.lastRenderContext?.interaction.currentTarget).toBe(sq(12));

		runtime.destroy();
	});
});
