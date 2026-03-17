/**
 * Tests for extension lifecycle integration in boardRuntime.
 * Phase 4.2a: First lifecycle-validation extension - selectedSquare.
 */

import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { selectedSquareExtension } from '../../../src/core/extensions/selectedSquare';
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

describe('boardRuntime extension integration', () => {
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
			extensions: [selectedSquareExtension]
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
		// Find the child <g> with data-extension-id="selectedSquare"
		const children = Array.from(slotRoot.children);
		return children.find(
			(el) => el.getAttribute('data-extension-id') === 'selectedSquare'
		) as SVGGElement | null;
	}

	function getHighlightRect(): SVGRectElement | null {
		const extGroup = getExtensionGroup();
		if (!extGroup || extGroup.children.length === 0) return null;
		return extGroup.children[0] as SVGRectElement;
	}

	it('mounts selectedSquare extension on runtime mount', () => {
		const slotRoot = getExtensionSlotRoot();
		expect(slotRoot).not.toBeNull();

		const extGroup = getExtensionGroup();
		expect(extGroup).not.toBeNull();
	});

	it('renders highlight when square with piece is selected', async () => {
		// Initial position has pieces
		runtime.setBoardPosition('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
		runtime.select(0 as Square); // select a1 (white rook)

		await waitForRender();

		const rect = getHighlightRect();
		expect(rect).not.toBeNull();
		expect(rect?.getAttribute('fill')).toBe('rgba(255, 255, 0, 0.4)');
	});

	it('does not render highlight when selected square has no piece', async () => {
		// Initial position
		runtime.setBoardPosition('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
		runtime.select(27 as Square); // select d4 (empty square)

		await waitForRender();

		const rect = getHighlightRect();
		expect(rect).toBeNull();
	});

	it('clears highlight when selection is cleared', async () => {
		runtime.setBoardPosition('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
		runtime.select(0 as Square); // select a1
		await waitForRender();

		let rect = getHighlightRect();
		expect(rect).not.toBeNull();

		runtime.select(null); // clear selection
		await waitForRender();

		rect = getHighlightRect();
		expect(rect).toBeNull();
	});

	it('updates highlight when selection changes to different piece', async () => {
		runtime.setBoardPosition('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
		runtime.select(0 as Square); // select a1 (white rook)
		await waitForRender();

		let rect = getHighlightRect();
		const firstX = rect?.getAttribute('x');
		const firstY = rect?.getAttribute('y');

		runtime.select(4 as Square); // select e1 (white king)
		await waitForRender();

		rect = getHighlightRect();
		const secondX = rect?.getAttribute('x');
		const secondY = rect?.getAttribute('y');

		// Different columns, same row
		expect(firstX).not.toBe(secondX);
		expect(firstY).toBe(secondY);
	});

	it('clears highlight when piece is moved away from selected square', async () => {
		runtime.setBoardPosition('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
		runtime.select(12 as Square); // select e2 (white pawn)
		await waitForRender();

		let rect = getHighlightRect();
		expect(rect).not.toBeNull();

		// Move the piece away
		runtime.move({ from: 12 as Square, to: 28 as Square }); // e2-e4
		await waitForRender();

		// Selection should be cleared after move
		rect = getHighlightRect();
		expect(rect).toBeNull();
	});

	it('updates highlight after board position change', async () => {
		runtime.setBoardPosition('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
		runtime.select(0 as Square); // select a1
		await waitForRender();

		let rect = getHighlightRect();
		expect(rect).not.toBeNull();

		// Change position (clears selection)
		runtime.setBoardPosition('8/8/8/8/8/8/8/8 w - - 0 1');
		await waitForRender();

		rect = getHighlightRect();
		expect(rect).toBeNull();
	});

	it('unmounts extension on runtime destroy', async () => {
		runtime.setBoardPosition('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
		runtime.select(0 as Square);
		await waitForRender();

		const rect = getHighlightRect();
		expect(rect).not.toBeNull();

		runtime.destroy();

		// Extension group should be removed
		const extGroup = getExtensionGroup();
		expect(extGroup).toBeNull();
	});

	it('throws on duplicate extension IDs', () => {
		const renderer = new SvgRenderer();
		expect(() => {
			createBoardRuntime({
				renderer,
				extensions: [selectedSquareExtension, selectedSquareExtension]
			});
		}).toThrow("BoardRuntime: duplicate extension id 'selectedSquare'");
	});

	it('works correctly with no extensions', () => {
		const testContainer = document.createElement('div');
		Object.defineProperty(testContainer, 'clientWidth', { value: 800, configurable: true });
		Object.defineProperty(testContainer, 'clientHeight', { value: 800, configurable: true });
		document.body.appendChild(testContainer);

		const renderer = new SvgRenderer();
		const testRuntime = createBoardRuntime({ renderer, extensions: [] });

		expect(() => testRuntime.mount(testContainer)).not.toThrow();
		expect(() => testRuntime.select(0 as Square)).not.toThrow();
		expect(() => testRuntime.destroy()).not.toThrow();

		document.body.removeChild(testContainer);
	});
});
