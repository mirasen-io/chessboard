/**
 * Tests for legalMoves extension.
 * Phase 4.3c batch 2: Legal moves destination hints MVP.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { createLegalMovesExtension } from '../../../src-old/core/extensions/legalMoves';
import type {
	BoardExtensionRenderContext,
	BoardExtensionUpdateContext
} from '../../../src-old/core/extensions/types';
import type { RenderGeometry } from '../../../src-old/core/renderer/types';
import type {
	InvalidationStateExtensionSnapshot,
	InvalidationWriter
} from '../../../src-old/core/scheduler/types';
import type { BoardStateSnapshot, Square } from '../../../src-old/core/state/boardTypes';
import type { InteractionStateSnapshot } from '../../../src-old/core/state/interactionTypes';
import type { ViewStateSnapshot } from '../../../src-old/core/state/viewTypes';

const SVG_NS = 'http://www.w3.org/2000/svg';

describe('legalMoves extension', () => {
	let slotRoot: SVGGElement;
	let mockWriter: InvalidationWriter;
	let markedLayers: number[];

	beforeEach(() => {
		slotRoot = document.createElementNS(SVG_NS, 'g');
		markedLayers = [];
		mockWriter = {
			markLayer: (layer: number) => markedLayers.push(layer),
			markSquares: () => {}
		};
	});

	function createMockBoardState(): BoardStateSnapshot {
		return {
			pieces: new Uint8Array(64),
			ids: new Int16Array(64),
			turn: 'white',
			positionEpoch: 0
		};
	}

	function createMockInteractionState(
		destinations: readonly Square[] | null = null
	): InteractionStateSnapshot {
		return {
			selectedSquare: destinations ? (12 as Square) : null,
			destinations,
			currentTarget: null,
			dragSession: null,
			releaseTargetingActive: false
		};
	}

	function createMockViewState(): ViewStateSnapshot {
		return {
			orientation: 'white',
			movability: { mode: 'free' }
		};
	}

	function createUpdateContext(
		destinations: readonly Square[] | null,
		layoutChanged = false
	): BoardExtensionUpdateContext {
		return {
			board: createMockBoardState(),
			view: createMockViewState(),
			interaction: createMockInteractionState(destinations),
			lastMove: null,
			layoutVersion: 0,
			layoutChanged,
			writer: mockWriter
		};
	}

	function createMockGeometry(): RenderGeometry {
		return {
			boardSize: 800,
			squareSize: 100,
			orientation: 'white',
			squareRect: (sq: Square) => ({
				x: (sq % 8) * 100,
				y: Math.floor(sq / 8) * 100,
				size: 100
			})
		};
	}

	function createRenderContext(
		destinations: readonly Square[] | null,
		invalidationLayers: number
	): BoardExtensionRenderContext {
		const invalidation: InvalidationStateExtensionSnapshot = {
			layers: invalidationLayers,
			squares: new Set()
		};
		return {
			board: createMockBoardState(),
			view: createMockViewState(),
			interaction: createMockInteractionState(destinations),
			geometry: createMockGeometry(),
			invalidation
		};
	}

	it('mounts without errors', () => {
		const env = { slotRoots: { overPieces: slotRoot } };
		const legalMovesExtension = createLegalMovesExtension();

		const mounted = legalMovesExtension.mount(env);
		expect(mounted).toBeDefined();
		expect(mounted.getPublic()).toBeUndefined();
	});

	it('has correct extension id', () => {
		const ext = createLegalMovesExtension();
		expect(ext.id).toBe('legalMoves');
	});

	it('requests overPieces slot', () => {
		const ext = createLegalMovesExtension();
		expect(ext.slots).toEqual(['overPieces']);
	});

	it('marks invalidation when destinations change from null to set', () => {
		const env = { slotRoots: { overPieces: slotRoot } };
		const legalMovesExtension = createLegalMovesExtension();

		const mounted = legalMovesExtension.mount(env);

		// Initial update: no destinations
		mounted.update(createUpdateContext(null));
		expect(markedLayers).toEqual([]);

		// Second update: destinations set
		mounted.update(createUpdateContext([28, 20] as Square[]));
		expect(markedLayers.length).toBe(1);
		expect(markedLayers[0]).toBe(1); // LegalMovesLayer.Dots
	});

	it('marks invalidation when destinations change from set to null', () => {
		const env = { slotRoots: { overPieces: slotRoot } };
		const legalMovesExtension = createLegalMovesExtension();

		const mounted = legalMovesExtension.mount(env);

		// Initial update: destinations set
		mounted.update(createUpdateContext([28, 20] as Square[]));
		markedLayers = [];

		// Second update: destinations cleared
		mounted.update(createUpdateContext(null));
		expect(markedLayers.length).toBe(1);
		expect(markedLayers[0]).toBe(1);
	});

	it('marks invalidation when destinations reference changes', () => {
		const env = { slotRoots: { overPieces: slotRoot } };
		const legalMovesExtension = createLegalMovesExtension();

		const mounted = legalMovesExtension.mount(env);

		// Initial update: destinations
		const firstDestinations = [28, 20] as Square[];
		mounted.update(createUpdateContext(firstDestinations));
		markedLayers = [];

		// Second update: different array reference with same content
		const secondDestinations = [28, 20] as Square[];
		mounted.update(createUpdateContext(secondDestinations));
		expect(markedLayers.length).toBe(1);
		expect(markedLayers[0]).toBe(1);
	});

	it('marks invalidation when layoutChanged is true', () => {
		const env = { slotRoots: { overPieces: slotRoot } };
		const legalMovesExtension = createLegalMovesExtension();

		const mounted = legalMovesExtension.mount(env);

		// Initial update: destinations
		const destinations = [28, 20] as Square[];
		mounted.update(createUpdateContext(destinations));
		markedLayers = [];

		// Second update: same reference but layout changed
		mounted.update(createUpdateContext(destinations, true));
		expect(markedLayers.length).toBe(1);
		expect(markedLayers[0]).toBe(1);
	});

	it('does not mark invalidation when state unchanged', () => {
		const env = { slotRoots: { overPieces: slotRoot } };
		const legalMovesExtension = createLegalMovesExtension();

		const mounted = legalMovesExtension.mount(env);

		// Initial update
		const destinations = [28, 20] as Square[];
		mounted.update(createUpdateContext(destinations));
		markedLayers = [];

		// Second update with same state
		mounted.update(createUpdateContext(destinations));
		expect(markedLayers).toEqual([]);
	});

	it('does not render when invalidation layers are 0', () => {
		const env = { slotRoots: { overPieces: slotRoot } };
		const legalMovesExtension = createLegalMovesExtension();

		const mounted = legalMovesExtension.mount(env);

		mounted.update(createUpdateContext([28, 20] as Square[]));
		mounted.renderBoard(createRenderContext([28, 20] as Square[], 0));

		expect(slotRoot.children.length).toBe(0);
	});

	it('renders dots when destinations present', () => {
		const env = { slotRoots: { overPieces: slotRoot } };
		const legalMovesExtension = createLegalMovesExtension();

		const mounted = legalMovesExtension.mount(env);

		const destinations = [28, 20] as Square[];
		mounted.update(createUpdateContext(destinations));
		mounted.renderBoard(createRenderContext(destinations, 1));

		expect(slotRoot.children.length).toBe(2);
		expect(slotRoot.children[0].tagName).toBe('circle');
		expect(slotRoot.children[1].tagName).toBe('circle');
	});

	it('does not render when destinations is null', () => {
		const env = { slotRoots: { overPieces: slotRoot } };
		const legalMovesExtension = createLegalMovesExtension();

		const mounted = legalMovesExtension.mount(env);

		mounted.update(createUpdateContext(null));
		mounted.renderBoard(createRenderContext(null, 1));

		expect(slotRoot.children.length).toBe(0);
	});

	it('does not render when destinations is empty array', () => {
		const env = { slotRoots: { overPieces: slotRoot } };
		const legalMovesExtension = createLegalMovesExtension();

		const mounted = legalMovesExtension.mount(env);

		mounted.update(createUpdateContext([]));
		mounted.renderBoard(createRenderContext([], 1));

		expect(slotRoot.children.length).toBe(0);
	});

	it('renders correct number of dots matching destinations count', () => {
		const env = { slotRoots: { overPieces: slotRoot } };
		const legalMovesExtension = createLegalMovesExtension();

		const mounted = legalMovesExtension.mount(env);

		const destinations = [28, 20, 36] as Square[];
		mounted.update(createUpdateContext(destinations));
		mounted.renderBoard(createRenderContext(destinations, 1));

		expect(slotRoot.children.length).toBe(3);
	});

	it('applies correct visual attributes to dots', () => {
		const env = { slotRoots: { overPieces: slotRoot } };
		const legalMovesExtension = createLegalMovesExtension();

		const mounted = legalMovesExtension.mount(env);

		const destinations = [28] as Square[];
		mounted.update(createUpdateContext(destinations));
		mounted.renderBoard(createRenderContext(destinations, 1));

		const circle = slotRoot.children[0] as SVGCircleElement;
		expect(circle.getAttribute('fill')).toBe('rgb(0, 0, 0)');
		expect(circle.getAttribute('fill-opacity')).toBe('0.35');
		expect(circle.getAttribute('stroke')).toBe('rgb(255, 255, 255)');
		expect(circle.getAttribute('stroke-opacity')).toBe('0.18');
		expect(circle.getAttribute('stroke-width')).toBe('1');
	});

	it('positions dots correctly at square centers', () => {
		const env = { slotRoots: { overPieces: slotRoot } };
		const legalMovesExtension = createLegalMovesExtension();

		const mounted = legalMovesExtension.mount(env);

		// Square 28 is e4 (file=4, rank=3) -> x=400, y=300 in mock geometry
		// Center should be at x=450, y=350
		const destinations = [28] as Square[];
		mounted.update(createUpdateContext(destinations));
		mounted.renderBoard(createRenderContext(destinations, 1));

		const circle = slotRoot.children[0] as SVGCircleElement;
		expect(circle.getAttribute('cx')).toBe('450');
		expect(circle.getAttribute('cy')).toBe('350');
	});

	it('sizes dot radius correctly as 12.5% of square size', () => {
		const env = { slotRoots: { overPieces: slotRoot } };
		const legalMovesExtension = createLegalMovesExtension();

		const mounted = legalMovesExtension.mount(env);

		const destinations = [28] as Square[];
		mounted.update(createUpdateContext(destinations));
		mounted.renderBoard(createRenderContext(destinations, 1));

		const circle = slotRoot.children[0] as SVGCircleElement;
		// squareSize = 100, radius = 100 * 0.125 = 12.5
		expect(circle.getAttribute('r')).toBe('12.5');
	});

	it('clears dots when destinations become null', () => {
		const env = { slotRoots: { overPieces: slotRoot } };
		const legalMovesExtension = createLegalMovesExtension();

		const mounted = legalMovesExtension.mount(env);

		// First render with destinations
		const destinations = [28, 20] as Square[];
		mounted.update(createUpdateContext(destinations));
		mounted.renderBoard(createRenderContext(destinations, 1));
		expect(slotRoot.children.length).toBe(2);

		// Second render without destinations
		mounted.update(createUpdateContext(null));
		mounted.renderBoard(createRenderContext(null, 1));
		expect(slotRoot.children.length).toBe(0);
	});

	it('updates dots when destinations change', () => {
		const env = { slotRoots: { overPieces: slotRoot } };
		const legalMovesExtension = createLegalMovesExtension();

		const mounted = legalMovesExtension.mount(env);

		// First render with two destinations
		const firstDestinations = [28, 20] as Square[];
		mounted.update(createUpdateContext(firstDestinations));
		mounted.renderBoard(createRenderContext(firstDestinations, 1));
		expect(slotRoot.children.length).toBe(2);

		// Second render with three destinations
		const secondDestinations = [28, 20, 36] as Square[];
		mounted.update(createUpdateContext(secondDestinations));
		mounted.renderBoard(createRenderContext(secondDestinations, 1));
		expect(slotRoot.children.length).toBe(3);
	});

	it('cleans up dots on unmount', () => {
		const env = { slotRoots: { overPieces: slotRoot } };
		const legalMovesExtension = createLegalMovesExtension();

		const mounted = legalMovesExtension.mount(env);

		const destinations = [28, 20] as Square[];
		mounted.update(createUpdateContext(destinations));
		mounted.renderBoard(createRenderContext(destinations, 1));
		expect(slotRoot.children.length).toBe(2);

		mounted.unmount();
		expect(slotRoot.children.length).toBe(0);
	});
});
