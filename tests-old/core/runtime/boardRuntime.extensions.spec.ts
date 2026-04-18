/**
 * Tests for extension lifecycle integration in boardRuntime.
 * Phase 4.2a: First lifecycle-validation extension - selectedSquare.
 */

import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createActiveTargetExtension } from '../../../src/core/extensions/activeTarget';
import { createLastMoveExtension } from '../../../src/core/extensions/lastMove';
import { createLegalMovesExtension } from '../../../src/core/extensions/legalMoves';
import { createSelectedSquareExtension } from '../../../src/core/extensions/selectedSquare';
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
			extensions: [createSelectedSquareExtension()]
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
				extensions: [createSelectedSquareExtension(), createSelectedSquareExtension()]
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

	it('selectedSquare extension re-renders highlight after setOrientation() with unchanged selection state', async () => {
		runtime.setBoardPosition('start');
		runtime.select(12 as Square); // select e2 (white pawn)
		await waitForRender();

		// Capture initial highlight position
		let rect = getHighlightRect();
		expect(rect).not.toBeNull();
		const initialX = rect?.getAttribute('x');
		const initialY = rect?.getAttribute('y');

		// Change orientation
		runtime.setOrientation('black');
		await waitForRender();

		// Verify highlight is re-rendered at new position
		rect = getHighlightRect();
		expect(rect).not.toBeNull();
		const newX = rect?.getAttribute('x');
		const newY = rect?.getAttribute('y');

		// Position should have changed due to board flip
		expect(newX).not.toBe(initialX);
		expect(newY).not.toBe(initialY);

		// Highlight should still exist for same logical square
		expect(rect).not.toBeNull();
	});
});

describe('boardRuntime lastMove extension integration', () => {
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
		const children = Array.from(svg.children);
		return children[3] as SVGGElement;
	}

	function getLastMoveExtensionGroup(): SVGGElement | null {
		const slotRoot = getExtensionSlotRoot();
		if (!slotRoot) return null;
		const children = Array.from(slotRoot.children);
		return children.find(
			(el) => el.getAttribute('data-extension-id') === 'lastMove'
		) as SVGGElement | null;
	}

	function getLastMoveHighlightRects(): [SVGRectElement | null, SVGRectElement | null] {
		const extGroup = getLastMoveExtensionGroup();
		if (!extGroup || extGroup.children.length === 0) return [null, null];
		const fromRect = extGroup.children[0] as SVGRectElement | undefined;
		const toRect = extGroup.children[1] as SVGRectElement | undefined;
		return [fromRect ?? null, toRect ?? null];
	}

	it('mounts lastMove extension correctly', () => {
		const slotRoot = getExtensionSlotRoot();
		expect(slotRoot).not.toBeNull();

		const extGroup = getLastMoveExtensionGroup();
		expect(extGroup).not.toBeNull();
	});

	it('renders lastMove highlights after move() call', async () => {
		runtime.setBoardPosition('start');
		runtime.move({ from: 12 as Square, to: 28 as Square }); // e2-e4
		await waitForRender();

		const [fromRect, toRect] = getLastMoveHighlightRects();
		expect(fromRect).not.toBeNull();
		expect(toRect).not.toBeNull();
	});

	it('renders lastMove highlights after legal dropTo() call', async () => {
		runtime.setBoardPosition('start');
		runtime.setMovability({ mode: 'strict', destinations: { 12: [28, 20] } });

		runtime.beginSourceInteraction(12 as Square, { x: 400, y: 700 });
		runtime.commitTo(28 as Square); // legal commit to e4

		await waitForRender();

		const [fromRect, toRect] = getLastMoveHighlightRects();
		expect(fromRect).not.toBeNull();
		expect(toRect).not.toBeNull();
	});

	it('clears lastMove highlights after setBoardPosition()', async () => {
		runtime.setBoardPosition('start');
		runtime.move({ from: 12 as Square, to: 28 as Square }); // e2-e4
		await waitForRender();

		let [fromRect, toRect] = getLastMoveHighlightRects();
		expect(fromRect).not.toBeNull();
		expect(toRect).not.toBeNull();

		runtime.setBoardPosition('8/8/8/8/8/8/8/8 w - - 0 1'); // empty board
		await waitForRender();

		[fromRect, toRect] = getLastMoveHighlightRects();
		expect(fromRect).toBeNull();
		expect(toRect).toBeNull();
	});

	it('lastMove persists across setTurn() (no reset)', async () => {
		runtime.setBoardPosition('start');
		runtime.move({ from: 12 as Square, to: 28 as Square }); // e2-e4
		await waitForRender();

		let [fromRect, toRect] = getLastMoveHighlightRects();
		expect(fromRect).not.toBeNull();
		expect(toRect).not.toBeNull();

		runtime.setTurn('black');
		await waitForRender();

		[fromRect, toRect] = getLastMoveHighlightRects();
		expect(fromRect).not.toBeNull();
		expect(toRect).not.toBeNull();
	});

	it('multiple extensions coexist without interference', async () => {
		runtime.destroy();
		document.body.removeChild(container);

		container = document.createElement('div');
		Object.defineProperty(container, 'clientWidth', { value: 800, configurable: true });
		Object.defineProperty(container, 'clientHeight', { value: 800, configurable: true });
		document.body.appendChild(container);

		const renderer = new SvgRenderer();
		runtime = createBoardRuntime({
			renderer,
			extensions: [createSelectedSquareExtension(), createLastMoveExtension()]
		});
		runtime.mount(container);

		runtime.setBoardPosition('start');
		runtime.select(12 as Square); // select e2
		await waitForRender();

		// selectedSquare should render
		const slotRoot = getExtensionSlotRoot();
		const selectedGroup = Array.from(slotRoot?.children ?? []).find(
			(el) => el.getAttribute('data-extension-id') === 'selectedSquare'
		) as SVGGElement | null;
		expect(selectedGroup).not.toBeNull();
		expect(selectedGroup?.children.length).toBe(1); // one highlight rect

		// lastMove should not render yet (no move)
		let [fromRect, toRect] = getLastMoveHighlightRects();
		expect(fromRect).toBeNull();
		expect(toRect).toBeNull();

		// Apply move
		runtime.move({ from: 12 as Square, to: 28 as Square }); // e2-e4
		await waitForRender();

		// selectedSquare cleared after move
		expect(selectedGroup?.children.length).toBe(0);

		// lastMove should now render
		[fromRect, toRect] = getLastMoveHighlightRects();
		expect(fromRect).not.toBeNull();
		expect(toRect).not.toBeNull();
	});

	it('lastMove extension re-renders highlights after setOrientation() with unchanged move state', async () => {
		runtime.setBoardPosition('start');
		runtime.move({ from: 12 as Square, to: 28 as Square }); // e2-e4
		await waitForRender();

		// Capture initial highlight positions
		let [fromRect, toRect] = getLastMoveHighlightRects();
		expect(fromRect).not.toBeNull();
		expect(toRect).not.toBeNull();
		const initialFromX = fromRect?.getAttribute('x');
		const initialFromY = fromRect?.getAttribute('y');
		const initialToX = toRect?.getAttribute('x');
		const initialToY = toRect?.getAttribute('y');

		// Change orientation
		runtime.setOrientation('black');
		await waitForRender();

		// Verify highlights are re-rendered at new positions
		[fromRect, toRect] = getLastMoveHighlightRects();
		expect(fromRect).not.toBeNull();
		expect(toRect).not.toBeNull();
		const newFromX = fromRect?.getAttribute('x');
		const newFromY = fromRect?.getAttribute('y');
		const newToX = toRect?.getAttribute('x');
		const newToY = toRect?.getAttribute('y');

		// Positions should have changed due to board flip
		expect(newFromX).not.toBe(initialFromX);
		expect(newFromY).not.toBe(initialFromY);
		expect(newToX).not.toBe(initialToX);
		expect(newToY).not.toBe(initialToY);

		// Highlights should still exist for same logical squares
		expect(fromRect).not.toBeNull();
		expect(toRect).not.toBeNull();
	});
});

describe('boardRuntime activeTarget extension integration', () => {
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
			extensions: [createActiveTargetExtension()]
		});
		runtime.mount(container);
	});

	afterEach(() => {
		runtime.destroy();
		document.body.removeChild(container);
	});

	function getUnderPiecesSlotRoot(): SVGGElement | null {
		const svg = container.querySelector('svg');
		if (!svg) return null;
		const children = Array.from(svg.children);
		return children[3] as SVGGElement;
	}

	function getOverPiecesSlotRoot(): SVGGElement | null {
		const svg = container.querySelector('svg');
		if (!svg) return null;
		const children = Array.from(svg.children);
		return children[5] as SVGGElement;
	}

	function getActiveTargetUnderPiecesGroup(): SVGGElement | null {
		const slotRoot = getUnderPiecesSlotRoot();
		if (!slotRoot) return null;
		const children = Array.from(slotRoot.children);
		return children.find(
			(el) => el.getAttribute('data-extension-id') === 'activeTarget'
		) as SVGGElement | null;
	}

	function getActiveTargetOverPiecesGroup(): SVGGElement | null {
		const slotRoot = getOverPiecesSlotRoot();
		if (!slotRoot) return null;
		const children = Array.from(slotRoot.children);
		return children.find(
			(el) => el.getAttribute('data-extension-id') === 'activeTarget'
		) as SVGGElement | null;
	}

	function getSquareHighlight(): SVGRectElement | null {
		const group = getActiveTargetUnderPiecesGroup();
		if (!group || group.children.length === 0) return null;
		return group.children[0] as SVGRectElement;
	}

	function getHaloCircle(): SVGCircleElement | null {
		const group = getActiveTargetOverPiecesGroup();
		if (!group || group.children.length === 0) return null;
		return group.children[0] as SVGCircleElement;
	}

	it('mounts activeTarget extension correctly', () => {
		const underGroup = getActiveTargetUnderPiecesGroup();
		const overGroup = getActiveTargetOverPiecesGroup();

		expect(underGroup).not.toBeNull();
		expect(overGroup).not.toBeNull();
	});

	it('allocates both underPieces and overPieces slots', () => {
		const underSlot = getUnderPiecesSlotRoot();
		const overSlot = getOverPiecesSlotRoot();

		expect(underSlot).not.toBeNull();
		expect(overSlot).not.toBeNull();

		// Verify extension groups exist in both slots
		const underGroup = getActiveTargetUnderPiecesGroup();
		const overGroup = getActiveTargetOverPiecesGroup();

		expect(underGroup).not.toBeNull();
		expect(overGroup).not.toBeNull();
	});

	it('does not render visuals initially (no drag)', async () => {
		runtime.setBoardPosition('start');
		await waitForRender();

		const square = getSquareHighlight();
		const halo = getHaloCircle();

		expect(square).toBeNull();
		expect(halo).toBeNull();
	});

	it('does not render during selection without drag', async () => {
		runtime.setBoardPosition('start');
		runtime.select(12 as Square); // select e2
		await waitForRender();

		const square = getSquareHighlight();
		const halo = getHaloCircle();

		expect(square).toBeNull();
		expect(halo).toBeNull();
	});

	it('renders both visuals during active drag with target', async () => {
		runtime.setBoardPosition('start');
		runtime.setMovability({ mode: 'strict', destinations: { 12: [28, 20] } });
		runtime.beginSourceInteraction(12 as Square, { x: 400, y: 700 });
		runtime.notifyDragMove(28 as Square, { x: 400, y: 300 }); // target e4

		await waitForRender();

		const square = getSquareHighlight();
		const halo = getHaloCircle();

		expect(square).not.toBeNull();
		expect(halo).not.toBeNull();
	});

	it('clears visuals when drag ends', async () => {
		runtime.setBoardPosition('start');
		runtime.setMovability({ mode: 'strict', destinations: { 12: [28, 20] } });
		runtime.beginSourceInteraction(12 as Square, { x: 400, y: 700 });
		runtime.notifyDragMove(28 as Square, { x: 400, y: 300 });

		await waitForRender();

		let square = getSquareHighlight();
		let halo = getHaloCircle();
		expect(square).not.toBeNull();
		expect(halo).not.toBeNull();

		runtime.cancelInteraction();
		await waitForRender();

		square = getSquareHighlight();
		halo = getHaloCircle();
		expect(square).toBeNull();
		expect(halo).toBeNull();
	});

	it('updates target visuals when target changes during drag', async () => {
		runtime.setBoardPosition('start');
		runtime.setMovability({ mode: 'strict', destinations: { 12: [28, 18] } });
		runtime.beginSourceInteraction(12 as Square, { x: 400, y: 700 });
		runtime.notifyDragMove(28 as Square, { x: 400, y: 300 });

		await waitForRender();

		let square = getSquareHighlight();
		const firstX = square?.getAttribute('x');

		runtime.notifyDragMove(18 as Square, { x: 200, y: 500 }); // change target to c3
		await waitForRender();

		square = getSquareHighlight();
		const secondX = square?.getAttribute('x');

		expect(firstX).not.toBe(secondX);
		expect(square).not.toBeNull();
	});

	it('activeTarget coexists with other extensions without interference', async () => {
		runtime.destroy();
		document.body.removeChild(container);

		container = document.createElement('div');
		Object.defineProperty(container, 'clientWidth', { value: 800, configurable: true });
		Object.defineProperty(container, 'clientHeight', { value: 800, configurable: true });
		document.body.appendChild(container);

		const renderer = new SvgRenderer();
		runtime = createBoardRuntime({
			renderer,
			extensions: [
				createSelectedSquareExtension(),
				createLastMoveExtension(),
				createActiveTargetExtension()
			]
		});
		runtime.mount(container);

		runtime.setBoardPosition('start');
		runtime.setMovability({ mode: 'strict', destinations: { 12: [28, 20] } });

		// Select should show selectedSquare highlight
		runtime.select(12 as Square);
		await waitForRender();

		const underSlot = getUnderPiecesSlotRoot();
		const selectedGroup = Array.from(underSlot?.children ?? []).find(
			(el) => el.getAttribute('data-extension-id') === 'selectedSquare'
		) as SVGGElement | null;
		expect(selectedGroup).not.toBeNull();
		expect(selectedGroup?.children.length).toBe(1);

		// activeTarget should not render yet
		let square = getSquareHighlight();
		expect(square).toBeNull();

		// Start drag with target
		runtime.beginSourceInteraction(12 as Square, { x: 400, y: 700 });
		runtime.notifyDragMove(28 as Square, { x: 400, y: 300 });
		await waitForRender();

		// activeTarget should now render
		square = getSquareHighlight();
		const halo = getHaloCircle();
		expect(square).not.toBeNull();
		expect(halo).not.toBeNull();

		// Complete move
		runtime.commitTo(28 as Square);
		await waitForRender();

		// activeTarget should clear
		square = getSquareHighlight();
		expect(square).toBeNull();

		// lastMove should render
		const lastMoveGroup = Array.from(underSlot?.children ?? []).find(
			(el) => el.getAttribute('data-extension-id') === 'lastMove'
		) as SVGGElement | null;
		expect(lastMoveGroup).not.toBeNull();
		expect(lastMoveGroup?.children.length).toBe(2); // from and to rects
	});

	it('all four extensions coexist without interference', async () => {
		runtime.destroy();
		document.body.removeChild(container);

		container = document.createElement('div');
		Object.defineProperty(container, 'clientWidth', { value: 800, configurable: true });
		Object.defineProperty(container, 'clientHeight', { value: 800, configurable: true });
		document.body.appendChild(container);

		const renderer = new SvgRenderer();
		runtime = createBoardRuntime({
			renderer,
			extensions: [
				createSelectedSquareExtension(),
				createLastMoveExtension(),
				createActiveTargetExtension(),
				createLegalMovesExtension()
			]
		});
		runtime.mount(container);

		runtime.setBoardPosition('start');
		runtime.setMovability({ mode: 'strict', destinations: { 12: [28, 20] } });

		// Select square e2 with destinations
		runtime.select(12 as Square);
		await waitForRender();

		// Verify all extension groups allocated
		const underSlot = getUnderPiecesSlotRoot();
		const overSlot = getOverPiecesSlotRoot();

		const selectedGroup = Array.from(underSlot?.children ?? []).find(
			(el) => el.getAttribute('data-extension-id') === 'selectedSquare'
		);
		const lastMoveGroup = Array.from(underSlot?.children ?? []).find(
			(el) => el.getAttribute('data-extension-id') === 'lastMove'
		);
		const activeTargetUnderGroup = Array.from(underSlot?.children ?? []).find(
			(el) => el.getAttribute('data-extension-id') === 'activeTarget'
		);
		const activeTargetOverGroup = Array.from(overSlot?.children ?? []).find(
			(el) => el.getAttribute('data-extension-id') === 'activeTarget'
		);
		const legalMovesGroup = Array.from(overSlot?.children ?? []).find(
			(el) => el.getAttribute('data-extension-id') === 'legalMoves'
		);

		expect(selectedGroup).not.toBeNull();
		expect(lastMoveGroup).not.toBeNull();
		expect(activeTargetUnderGroup).not.toBeNull();
		expect(activeTargetOverGroup).not.toBeNull();
		expect(legalMovesGroup).not.toBeNull();

		// selectedSquare should render (has piece)
		expect((selectedGroup as SVGGElement).children.length).toBe(1);

		// legalMoves should render (has destinations)
		expect((legalMovesGroup as SVGGElement).children.length).toBe(2); // two dots

		// activeTarget should not render (no drag)
		expect((activeTargetUnderGroup as SVGGElement).children.length).toBe(0);

		// lastMove should not render (no move yet)
		expect((lastMoveGroup as SVGGElement).children.length).toBe(0);
	});
});
