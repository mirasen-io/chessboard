/**
 * Unit tests for activeTarget extension.
 * Phase 4.3a: First transient interaction overlay extension.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { createActiveTargetExtension } from '../../../src/core/extensions/activeTarget';
import type {
	BoardExtensionRenderContext,
	BoardExtensionUpdateContext
} from '../../../src/core/extensions/types';
import { SVG_NS } from '../../../src/core/helpers/svg';
import type { RenderGeometry } from '../../../src/core/renderer/types';
import type {
	InvalidationStateExtensionSnapshot,
	InvalidationWriter
} from '../../../src/core/scheduler/types';
import type { BoardStateSnapshot, Square } from '../../../src/core/state/boardTypes';
import type { InteractionStateSnapshot } from '../../../src/core/state/interactionTypes';
import type { ViewStateSnapshot } from '../../../src/core/state/viewTypes';

describe('activeTarget extension', () => {
	let underPiecesRoot: SVGGElement;
	let overPiecesRoot: SVGGElement;
	let mockWriter: InvalidationWriter;
	let markedLayers: number[];

	beforeEach(() => {
		underPiecesRoot = document.createElementNS(SVG_NS, 'g');
		overPiecesRoot = document.createElementNS(SVG_NS, 'g');
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
		dragActive: boolean,
		currentTarget: Square | null
	): InteractionStateSnapshot {
		return {
			selectedSquare: dragActive ? (12 as Square) : null,
			destinations: null,
			currentTarget,
			dragSession: dragActive ? { fromSquare: 12 as Square } : null,
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
		dragActive: boolean,
		currentTarget: Square | null,
		layoutChanged = false
	): BoardExtensionUpdateContext {
		return {
			board: createMockBoardState(),
			view: createMockViewState(),
			interaction: createMockInteractionState(dragActive, currentTarget),
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
		dragActive: boolean,
		currentTarget: Square | null,
		invalidationLayers: number
	): BoardExtensionRenderContext {
		const invalidation: InvalidationStateExtensionSnapshot = {
			layers: invalidationLayers,
			squares: new Set()
		};
		return {
			board: createMockBoardState(),
			view: createMockViewState(),
			interaction: createMockInteractionState(dragActive, currentTarget),
			geometry: createMockGeometry(),
			invalidation
		};
	}

	it('mounts without errors', () => {
		const env = { slotRoots: { underPieces: underPiecesRoot, overPieces: overPiecesRoot } };
		const activeTargetExtension = createActiveTargetExtension();

		const mounted = activeTargetExtension.mount(env);
		expect(mounted).toBeDefined();
		expect(mounted.getPublic()).toBeUndefined();
	});

	it('has correct extension id', () => {
		const ext = createActiveTargetExtension();
		expect(ext.id).toBe('activeTarget');
	});

	it('requests both underPieces and overPieces slots', () => {
		const ext = createActiveTargetExtension();
		expect(ext.slots).toEqual(['underPieces', 'overPieces']);
	});

	it('marks invalidation when drag starts with target', () => {
		const env = { slotRoots: { underPieces: underPiecesRoot, overPieces: overPiecesRoot } };
		const ext = createActiveTargetExtension();
		const mounted = ext.mount(env);

		// Initial update: no drag, matches initial extension state
		mounted.update(createUpdateContext(false, null));
		expect(markedLayers).toEqual([]); // No state change from initial

		// Second update: drag starts with target
		mounted.update(createUpdateContext(true, 28 as Square));
		expect(markedLayers.length).toBe(1);
		expect(markedLayers[0]).toBe(1); // ActiveTargetLayer.Visuals
	});

	it('marks invalidation when target changes during drag', () => {
		const env = { slotRoots: { underPieces: underPiecesRoot, overPieces: overPiecesRoot } };
		const ext = createActiveTargetExtension();
		const mounted = ext.mount(env);

		// Initial update: drag with target
		mounted.update(createUpdateContext(true, 28 as Square));
		markedLayers = [];

		// Second update: drag continues with different target
		mounted.update(createUpdateContext(true, 36 as Square));
		expect(markedLayers.length).toBe(1);
		expect(markedLayers[0]).toBe(1);
	});

	it('marks invalidation when drag ends', () => {
		const env = { slotRoots: { underPieces: underPiecesRoot, overPieces: overPiecesRoot } };
		const ext = createActiveTargetExtension();
		const mounted = ext.mount(env);

		// Initial update: drag with target
		mounted.update(createUpdateContext(true, 28 as Square));
		markedLayers = [];

		// Second update: drag ends
		mounted.update(createUpdateContext(false, null));
		expect(markedLayers.length).toBe(1);
		expect(markedLayers[0]).toBe(1);
	});

	it('marks invalidation when layoutChanged is true', () => {
		const env = { slotRoots: { underPieces: underPiecesRoot, overPieces: overPiecesRoot } };
		const ext = createActiveTargetExtension();
		const mounted = ext.mount(env);

		// Initial update: drag with target
		mounted.update(createUpdateContext(true, 28 as Square));
		markedLayers = [];

		// Second update: same state but layout changed
		mounted.update(createUpdateContext(true, 28 as Square, true));
		expect(markedLayers.length).toBe(1);
		expect(markedLayers[0]).toBe(1);
	});

	it('does not mark invalidation when state unchanged', () => {
		const env = { slotRoots: { underPieces: underPiecesRoot, overPieces: overPiecesRoot } };
		const ext = createActiveTargetExtension();
		const mounted = ext.mount(env);

		// Initial update: drag with target
		mounted.update(createUpdateContext(true, 28 as Square));
		markedLayers = [];

		// Second update: same state, no layout change
		mounted.update(createUpdateContext(true, 28 as Square));
		expect(markedLayers).toEqual([]);
	});

	it('does not render when invalidation layers are 0', () => {
		const env = { slotRoots: { underPieces: underPiecesRoot, overPieces: overPiecesRoot } };
		const ext = createActiveTargetExtension();
		const mounted = ext.mount(env);

		mounted.update(createUpdateContext(true, 28 as Square));
		mounted.renderBoard(createRenderContext(true, 28 as Square, 0));

		expect(underPiecesRoot.children.length).toBe(0);
		expect(overPiecesRoot.children.length).toBe(0);
	});

	it('renders square highlight in underPieces when drag active with target', () => {
		const env = { slotRoots: { underPieces: underPiecesRoot, overPieces: overPiecesRoot } };
		const ext = createActiveTargetExtension();
		const mounted = ext.mount(env);

		mounted.update(createUpdateContext(true, 28 as Square));
		mounted.renderBoard(createRenderContext(true, 28 as Square, 1));

		expect(underPiecesRoot.children.length).toBe(1);
		const rect = underPiecesRoot.children[0] as SVGRectElement;
		expect(rect.tagName).toBe('rect');
		expect(rect.getAttribute('fill')).toBe('rgba(255, 255, 0, 1)');
		expect(rect.getAttribute('fill-opacity')).toBe('0.4');
	});

	it('renders halo in overPieces when drag active with target', () => {
		const env = { slotRoots: { underPieces: underPiecesRoot, overPieces: overPiecesRoot } };
		const ext = createActiveTargetExtension();
		const mounted = ext.mount(env);

		mounted.update(createUpdateContext(true, 28 as Square));
		mounted.renderBoard(createRenderContext(true, 28 as Square, 1));

		expect(overPiecesRoot.children.length).toBe(1);
		const circle = overPiecesRoot.children[0] as SVGCircleElement;
		expect(circle.tagName).toBe('circle');
		expect(circle.getAttribute('fill')).toBe('rgba(0, 0, 0, 1)');
		expect(circle.getAttribute('fill-opacity')).toBe('0.2');
	});

	it('does not render when drag not active', () => {
		const env = { slotRoots: { underPieces: underPiecesRoot, overPieces: overPiecesRoot } };
		const ext = createActiveTargetExtension();
		const mounted = ext.mount(env);

		mounted.update(createUpdateContext(false, 28 as Square));
		mounted.renderBoard(createRenderContext(false, 28 as Square, 1));

		expect(underPiecesRoot.children.length).toBe(0);
		expect(overPiecesRoot.children.length).toBe(0);
	});

	it('does not render when target is null', () => {
		const env = { slotRoots: { underPieces: underPiecesRoot, overPieces: overPiecesRoot } };
		const ext = createActiveTargetExtension();
		const mounted = ext.mount(env);

		mounted.update(createUpdateContext(true, null));
		mounted.renderBoard(createRenderContext(true, null, 1));

		expect(underPiecesRoot.children.length).toBe(0);
		expect(overPiecesRoot.children.length).toBe(0);
	});

	it('removes visuals when drag ends', () => {
		const env = { slotRoots: { underPieces: underPiecesRoot, overPieces: overPiecesRoot } };
		const ext = createActiveTargetExtension();
		const mounted = ext.mount(env);

		// First render with drag
		mounted.update(createUpdateContext(true, 28 as Square));
		mounted.renderBoard(createRenderContext(true, 28 as Square, 1));
		expect(underPiecesRoot.children.length).toBe(1);
		expect(overPiecesRoot.children.length).toBe(1);

		// Second render without drag
		mounted.update(createUpdateContext(false, null));
		mounted.renderBoard(createRenderContext(false, null, 1));
		expect(underPiecesRoot.children.length).toBe(0);
		expect(overPiecesRoot.children.length).toBe(0);
	});

	it('uses correct geometry positioning for square highlight', () => {
		const env = { slotRoots: { underPieces: underPiecesRoot, overPieces: overPiecesRoot } };
		const ext = createActiveTargetExtension();
		const mounted = ext.mount(env);

		// Square 28 is e4 (file=4, rank=3) -> x=400, y=300 in mock geometry
		mounted.update(createUpdateContext(true, 28 as Square));
		mounted.renderBoard(createRenderContext(true, 28 as Square, 1));

		const rect = underPiecesRoot.children[0] as SVGRectElement;
		expect(rect.getAttribute('x')).toBe('400');
		expect(rect.getAttribute('y')).toBe('300');
		expect(rect.getAttribute('width')).toBe('100');
		expect(rect.getAttribute('height')).toBe('100');
	});

	it('computes halo radius correctly from squareSize and ratio', () => {
		const env = { slotRoots: { underPieces: underPiecesRoot, overPieces: overPiecesRoot } };
		const ext = createActiveTargetExtension();
		const mounted = ext.mount(env);

		mounted.update(createUpdateContext(true, 28 as Square));
		mounted.renderBoard(createRenderContext(true, 28 as Square, 1));

		const circle = overPiecesRoot.children[0] as SVGCircleElement;
		// squareSize = 100, ratio = 1.2 -> radius = 120
		expect(circle.getAttribute('r')).toBe('120');
		// Center should be at square center: x=400+50=450, y=300+50=350
		expect(circle.getAttribute('cx')).toBe('450');
		expect(circle.getAttribute('cy')).toBe('350');
	});

	it('applies custom options correctly', () => {
		const env = { slotRoots: { underPieces: underPiecesRoot, overPieces: overPiecesRoot } };
		const ext = createActiveTargetExtension({
			squareColor: 'rgb(255, 0, 0)',
			squareOpacity: 0.6,
			haloColor: 'rgb(0, 0, 255)',
			haloOpacity: 0.8,
			haloRadiusRatio: 1.5
		});
		const mounted = ext.mount(env);

		mounted.update(createUpdateContext(true, 28 as Square));
		mounted.renderBoard(createRenderContext(true, 28 as Square, 1));

		const rect = underPiecesRoot.children[0] as SVGRectElement;
		expect(rect.getAttribute('fill')).toBe('rgb(255, 0, 0)');
		expect(rect.getAttribute('fill-opacity')).toBe('0.6');

		const circle = overPiecesRoot.children[0] as SVGCircleElement;
		expect(circle.getAttribute('fill')).toBe('rgb(0, 0, 255)');
		expect(circle.getAttribute('fill-opacity')).toBe('0.8');
		expect(circle.getAttribute('r')).toBe('150'); // 100 * 1.5
	});

	it('cleans up both visuals on unmount', () => {
		const env = { slotRoots: { underPieces: underPiecesRoot, overPieces: overPiecesRoot } };
		const ext = createActiveTargetExtension();
		const mounted = ext.mount(env);

		mounted.update(createUpdateContext(true, 28 as Square));
		mounted.renderBoard(createRenderContext(true, 28 as Square, 1));
		expect(underPiecesRoot.children.length).toBe(1);
		expect(overPiecesRoot.children.length).toBe(1);

		mounted.unmount();
		expect(underPiecesRoot.children.length).toBe(0);
		expect(overPiecesRoot.children.length).toBe(0);
	});
});
