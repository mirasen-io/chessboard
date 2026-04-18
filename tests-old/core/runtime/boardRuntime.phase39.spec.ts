/**
 * Phase 3.9 — BoardRuntime committed animation skip policy tests.
 *
 * Verifies that:
 * 1. Legal drag-drop completion skips committed move animation
 * 2. Legal non-drag completion (via selectedSquare) starts committed move animation
 *
 * These tests verify the policy outcome by inspecting renderer state after render completes.
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { SvgRenderer } from '../../../src/core/renderer/SvgRenderer';
import type { Renderer } from '../../../src/core/renderer/types';
import { createBoardRuntime } from '../../../src/core/runtime/boardRuntime';
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

describe('BoardRuntime Phase 3.9: committed animation skip policy', () => {
	it('legal drag-drop completion: skips committed animation', async () => {
		const renderer = createTestRenderer();
		const runtime = createBoardRuntime({
			renderer,
			board: { position: { e2: { color: 'w', role: 'p' } } },
			view: { movability: { mode: 'free' } }
		});
		runtime.mount(createMockContainer());

		await waitForRender();

		// Drag-drop completion: beginSourceInteraction (enters drag mode) + commitTo(legal)
		runtime.beginSourceInteraction(sq(12), { x: 450, y: 650 }); // e2
		runtime.commitTo(sq(28)); // e4 (legal)

		await waitForRender();

		// Verify: committed animation is skipped (no transient nodes in animationRoot)
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const animationRoot = (renderer as any).animationRoot as SVGGElement;
		expect(animationRoot.children.length).toBe(0);

		runtime.destroy();
	});

	it('legal non-drag completion: starts committed animation', async () => {
		const renderer = createTestRenderer();
		const runtime = createBoardRuntime({
			renderer,
			board: { position: { e2: { color: 'w', role: 'p' } } },
			view: { movability: { mode: 'free' } }
		});
		runtime.mount(createMockContainer());

		await waitForRender();

		// Non-drag completion: select + startReleaseTargeting + commitTo(legal)
		runtime.select(sq(12)); // e2
		runtime.startReleaseTargeting(sq(28), null); // e4
		runtime.commitTo(sq(28)); // e4 (legal, no drag)

		await waitForRender();

		// Verify: committed animation starts (transient node exists in animationRoot)
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const animationRoot = (renderer as any).animationRoot as SVGGElement;
		expect(animationRoot.children.length).toBe(1);

		runtime.destroy();
	});
});
