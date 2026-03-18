/**
 * Unit tests for lastMove extension.
 * Phase 4.2b: First move-derived extension.
 */

import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createLastMoveExtension } from '../../../src/core/extensions/lastMove';
import { SvgRenderer } from '../../../src/core/renderer/SvgRenderer';
import { createBoardRuntime, type BoardRuntime } from '../../../src/core/runtime/boardRuntime';
import type { Square } from '../../../src/core/state/boardTypes';

// Mock ResizeObserver for jsdom
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

const originalResizeObserver = globalThis.ResizeObserver;

describe('lastMove extension', () => {
	function waitForRender(): Promise<void> {
		return new Promise<void>((resolve) => {
			requestAnimationFrame(() => resolve());
		});
	}

	beforeAll(() => {
		globalThis.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;
	});

	afterAll(() => {
		globalThis.ResizeObserver = originalResizeObserver;
	});

	let container: HTMLElement;
	let runtime: BoardRuntime;

	beforeEach(() => {
		container = document.createElement('div');
		Object.defineProperty(container, 'clientWidth', { value: 800, configurable: true });
		Object.defineProperty(container, 'clientHeight', { value: 800, configurable: true });
		document.body.appendChild(container);

		const renderer = new SvgRenderer();
		runtime = createBoardRuntime({
			renderer,
			extensions: [createLastMoveExtension()]
		});
		runtime.mount(container);
	});

	afterEach(() => {
		runtime.destroy();
		document.body.removeChild(container);
	});

	function getExtensionSlotRoot(): SVGGElement | null {
		const svg = container.querySelector('svg');
		if (!svg) return null;
		// Find the underPieces extension slot root
		const children = Array.from(svg.children);
		// Structure: defs, board, coords, extensionsUnderPieces, pieces, ...
		return children[3] as SVGGElement;
	}

	function getExtensionGroup(): SVGGElement | null {
		const slotRoot = getExtensionSlotRoot();
		if (!slotRoot) return null;
		// Find the child <g> with data-extension-id="lastMove"
		const children = Array.from(slotRoot.children);
		return children.find(
			(el) => el.getAttribute('data-extension-id') === 'lastMove'
		) as SVGGElement | null;
	}

	function getHighlightRects(): [SVGRectElement | null, SVGRectElement | null] {
		const extGroup = getExtensionGroup();
		if (!extGroup || extGroup.children.length === 0) return [null, null];
		const fromRect = extGroup.children[0] as SVGRectElement | undefined;
		const toRect = extGroup.children[1] as SVGRectElement | undefined;
		return [fromRect ?? null, toRect ?? null];
	}

	it('mounts lastMove extension on runtime mount', () => {
		const slotRoot = getExtensionSlotRoot();
		expect(slotRoot).not.toBeNull();

		const extGroup = getExtensionGroup();
		expect(extGroup).not.toBeNull();
	});

	it('does not render highlights initially (no move yet)', async () => {
		runtime.setBoardPosition('start');
		await waitForRender();

		const [fromRect, toRect] = getHighlightRects();
		expect(fromRect).toBeNull();
		expect(toRect).toBeNull();
	});

	it('renders two highlights after a move', async () => {
		runtime.setBoardPosition('start');
		runtime.move({ from: 12 as Square, to: 28 as Square }); // e2-e4
		await waitForRender();

		const [fromRect, toRect] = getHighlightRects();
		expect(fromRect).not.toBeNull();
		expect(toRect).not.toBeNull();
	});

	it('renders with default chess.com-like styling', async () => {
		runtime.setBoardPosition('start');
		runtime.move({ from: 12 as Square, to: 28 as Square }); // e2-e4
		await waitForRender();

		const [fromRect, toRect] = getHighlightRects();
		expect(fromRect?.getAttribute('fill')).toBe('rgb(255, 255, 51)');
		expect(fromRect?.getAttribute('fill-opacity')).toBe('0.5');
		expect(toRect?.getAttribute('fill')).toBe('rgb(255, 255, 51)');
		expect(toRect?.getAttribute('fill-opacity')).toBe('0.5');
	});

	it('renders with custom color and opacity', async () => {
		runtime.destroy();
		document.body.removeChild(container);

		container = document.createElement('div');
		Object.defineProperty(container, 'clientWidth', { value: 800, configurable: true });
		Object.defineProperty(container, 'clientHeight', { value: 800, configurable: true });
		document.body.appendChild(container);

		const renderer = new SvgRenderer();
		runtime = createBoardRuntime({
			renderer,
			extensions: [createLastMoveExtension({ color: 'rgb(0, 128, 255)', opacity: 0.7 })]
		});
		runtime.mount(container);

		runtime.setBoardPosition('start');
		runtime.move({ from: 12 as Square, to: 28 as Square });
		await waitForRender();

		const [fromRect, toRect] = getHighlightRects();
		expect(fromRect?.getAttribute('fill')).toBe('rgb(0, 128, 255)');
		expect(fromRect?.getAttribute('fill-opacity')).toBe('0.7');
		expect(toRect?.getAttribute('fill')).toBe('rgb(0, 128, 255)');
		expect(toRect?.getAttribute('fill-opacity')).toBe('0.7');
	});

	it('updates highlights when a new move is applied', async () => {
		runtime.setBoardPosition('start');
		runtime.move({ from: 12 as Square, to: 28 as Square }); // e2-e4
		await waitForRender();

		const [fromRect1, toRect1] = getHighlightRects();
		const firstFromX = fromRect1?.getAttribute('x');
		const firstToX = toRect1?.getAttribute('x');

		runtime.move({ from: 6 as Square, to: 21 as Square }); // g1-f3
		await waitForRender();

		const [fromRect2, toRect2] = getHighlightRects();
		const secondFromX = fromRect2?.getAttribute('x');
		const secondToX = toRect2?.getAttribute('x');

		// Different moves should have different positions
		expect(firstFromX).not.toBe(secondFromX);
		expect(firstToX).not.toBe(secondToX);
	});

	it('verifies correct from and to square geometry', async () => {
		runtime.setBoardPosition('start');
		runtime.move({ from: 12 as Square, to: 28 as Square }); // e2-e4
		await waitForRender();

		const [fromRect, toRect] = getHighlightRects();

		// e2 is square 12 (file=4, rank=1)
		// e4 is square 28 (file=4, rank=3)
		// Both should have same x (file 4), different y (rank 1 vs 3)
		const fromX = fromRect?.getAttribute('x');
		const toX = toRect?.getAttribute('x');
		expect(fromX).toBe(toX); // same file

		const fromY = fromRect?.getAttribute('y');
		const toY = toRect?.getAttribute('y');
		expect(fromY).not.toBe(toY); // different rank
	});

	it('clears highlights when position changes via setBoardPosition', async () => {
		runtime.setBoardPosition('start');
		runtime.move({ from: 12 as Square, to: 28 as Square }); // e2-e4
		await waitForRender();

		let [fromRect, toRect] = getHighlightRects();
		expect(fromRect).not.toBeNull();
		expect(toRect).not.toBeNull();

		runtime.setBoardPosition('8/8/8/8/8/8/8/8 w - - 0 1'); // empty board
		await waitForRender();

		[fromRect, toRect] = getHighlightRects();
		expect(fromRect).toBeNull();
		expect(toRect).toBeNull();
	});

	it('unmounts extension cleanly', async () => {
		runtime.setBoardPosition('start');
		runtime.move({ from: 12 as Square, to: 28 as Square });
		await waitForRender();

		const [fromRect, toRect] = getHighlightRects();
		expect(fromRect).not.toBeNull();
		expect(toRect).not.toBeNull();

		runtime.destroy();

		// Extension group should be removed
		const extGroup = getExtensionGroup();
		expect(extGroup).toBeNull();
	});
});
