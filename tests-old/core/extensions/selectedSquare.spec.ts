/**
 * Tests for selectedSquare extension.
 * Phase 4.2a: First lifecycle-validation extension.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { createSelectedSquareExtension } from '../../../src/core/extensions/selectedSquare';
import type {
	BoardExtensionRenderContext,
	BoardExtensionUpdateContext
} from '../../../src/core/extensions/types';
import type { RenderGeometry } from '../../../src/core/renderer/types';
import type {
	InvalidationStateExtensionSnapshot,
	InvalidationWriter
} from '../../../src/core/scheduler/types';
import type { BoardStateSnapshot, Square } from '../../../src/core/state/boardTypes';
import { encodePiece } from '../../../src/core/state/encode';
import type { InteractionStateSnapshot } from '../../../src/core/state/interactionTypes';
import type { ViewStateSnapshot } from '../../../src/core/state/viewTypes';

const SVG_NS = 'http://www.w3.org/2000/svg';

describe('selectedSquare extension', () => {
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

	function createMockBoardState(pieces: Record<number, number> = {}): BoardStateSnapshot {
		const piecesArray = new Uint8Array(64);
		for (const [sq, code] of Object.entries(pieces)) {
			piecesArray[Number(sq)] = code;
		}
		return {
			pieces: piecesArray,
			ids: new Int16Array(64),
			turn: 'white',
			positionEpoch: 0
		};
	}

	function createMockInteractionState(
		selectedSquare: Square | null = null
	): InteractionStateSnapshot {
		return {
			selectedSquare,
			destinations: null,
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
		selectedSquare: Square | null,
		hasPieceAtSquare: boolean
	): BoardExtensionUpdateContext {
		const pieces: Record<number, number> = {};
		if (selectedSquare !== null && hasPieceAtSquare) {
			pieces[selectedSquare] = encodePiece({ color: 'white', role: 'pawn' });
		}
		return {
			board: createMockBoardState(pieces),
			view: createMockViewState(),
			interaction: createMockInteractionState(selectedSquare),
			lastMove: null,
			layoutVersion: 0,
			layoutChanged: false,
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
		selectedSquare: Square | null,
		hasPieceAtSquare: boolean,
		invalidationLayers: number
	): BoardExtensionRenderContext {
		const pieces: Record<number, number> = {};
		if (selectedSquare !== null && hasPieceAtSquare) {
			pieces[selectedSquare] = encodePiece({ color: 'white', role: 'pawn' });
		}
		const invalidation: InvalidationStateExtensionSnapshot = {
			layers: invalidationLayers,
			squares: new Set()
		};
		return {
			board: createMockBoardState(pieces),
			view: createMockViewState(),
			interaction: createMockInteractionState(selectedSquare),
			geometry: createMockGeometry(),
			invalidation
		};
	}

	it('mounts without errors', () => {
		const env = { slotRoots: { underPieces: slotRoot } };
		const selectedSquareExtension = createSelectedSquareExtension();

		const mounted = selectedSquareExtension.mount(env);
		expect(mounted).toBeDefined();
		expect(mounted.getPublic()).toBeUndefined();
	});

	it('marks invalidation when selectedSquare changes from null to set with piece', () => {
		const env = { slotRoots: { underPieces: slotRoot } };
		const selectedSquareExtension = createSelectedSquareExtension();

		const mounted = selectedSquareExtension.mount(env);

		// Initial update: no selection
		mounted.update(createUpdateContext(null, false));
		expect(markedLayers).toEqual([]);

		// Second update: select square with piece
		mounted.update(createUpdateContext(0 as Square, true));
		expect(markedLayers.length).toBe(1);
		expect(markedLayers[0]).toBe(1); // SelectedSquareLayer.Highlight
	});

	it('marks invalidation when selectedSquare changes from set to null', () => {
		const env = { slotRoots: { underPieces: slotRoot } };
		const selectedSquareExtension = createSelectedSquareExtension();

		const mounted = selectedSquareExtension.mount(env);

		// Initial update: square with piece selected
		mounted.update(createUpdateContext(0 as Square, true));
		markedLayers = [];

		// Second update: clear selection
		mounted.update(createUpdateContext(null, false));
		expect(markedLayers.length).toBe(1);
		expect(markedLayers[0]).toBe(1);
	});

	it('marks invalidation when piece presence changes on same square', () => {
		const env = { slotRoots: { underPieces: slotRoot } };
		const selectedSquareExtension = createSelectedSquareExtension();

		const mounted = selectedSquareExtension.mount(env);

		// Initial update: square with piece selected
		mounted.update(createUpdateContext(0 as Square, true));
		markedLayers = [];

		// Second update: same square, but no piece
		mounted.update(createUpdateContext(0 as Square, false));
		expect(markedLayers.length).toBe(1);
		expect(markedLayers[0]).toBe(1);
	});

	it('does not mark invalidation when state is unchanged', () => {
		const env = { slotRoots: { underPieces: slotRoot } };
		const selectedSquareExtension = createSelectedSquareExtension();

		const mounted = selectedSquareExtension.mount(env);

		// Initial update
		mounted.update(createUpdateContext(0 as Square, true));
		markedLayers = [];

		// Second update with same state
		mounted.update(createUpdateContext(0 as Square, true));
		expect(markedLayers).toEqual([]);
	});

	it('renders highlight rect when square is selected and has piece', () => {
		const env = { slotRoots: { underPieces: slotRoot } };
		const selectedSquareExtension = createSelectedSquareExtension();

		const mounted = selectedSquareExtension.mount(env);

		mounted.update(createUpdateContext(0 as Square, true));
		mounted.renderBoard(createRenderContext(0 as Square, true, 1));

		expect(slotRoot.children.length).toBe(1);
		const rect = slotRoot.children[0] as SVGRectElement;
		expect(rect.tagName).toBe('rect');
		expect(rect.getAttribute('fill')).toBe('rgba(255, 255, 0, 0.4)');
	});

	it('removes highlight when square is selected but has no piece', () => {
		const env = { slotRoots: { underPieces: slotRoot } };
		const selectedSquareExtension = createSelectedSquareExtension();

		const mounted = selectedSquareExtension.mount(env);

		// First render with piece
		mounted.update(createUpdateContext(0 as Square, true));
		mounted.renderBoard(createRenderContext(0 as Square, true, 1));
		expect(slotRoot.children.length).toBe(1);

		// Second render without piece
		mounted.update(createUpdateContext(0 as Square, false));
		mounted.renderBoard(createRenderContext(0 as Square, false, 1));
		expect(slotRoot.children.length).toBe(0);
	});

	it('removes highlight when selection is cleared', () => {
		const env = { slotRoots: { underPieces: slotRoot } };
		const selectedSquareExtension = createSelectedSquareExtension();

		const mounted = selectedSquareExtension.mount(env);

		// First render with selection
		mounted.update(createUpdateContext(0 as Square, true));
		mounted.renderBoard(createRenderContext(0 as Square, true, 1));
		expect(slotRoot.children.length).toBe(1);

		// Second render without selection
		mounted.update(createUpdateContext(null, false));
		mounted.renderBoard(createRenderContext(null, false, 1));
		expect(slotRoot.children.length).toBe(0);
	});

	it('does not render when invalidation layers are 0', () => {
		const env = { slotRoots: { underPieces: slotRoot } };
		const selectedSquareExtension = createSelectedSquareExtension();

		const mounted = selectedSquareExtension.mount(env);

		mounted.update(createUpdateContext(0 as Square, true));
		mounted.renderBoard(createRenderContext(0 as Square, true, 0));

		expect(slotRoot.children.length).toBe(0);
	});

	it('updates highlight position when selectedSquare changes', () => {
		const env = { slotRoots: { underPieces: slotRoot } };
		const selectedSquareExtension = createSelectedSquareExtension();

		const mounted = selectedSquareExtension.mount(env);

		// First render at square 0
		mounted.update(createUpdateContext(0 as Square, true));
		mounted.renderBoard(createRenderContext(0 as Square, true, 1));
		let rect = slotRoot.children[0] as SVGRectElement;
		expect(rect.getAttribute('x')).toBe('0');
		expect(rect.getAttribute('y')).toBe('0');

		// Second render at square 8
		mounted.update(createUpdateContext(8 as Square, true));
		mounted.renderBoard(createRenderContext(8 as Square, true, 1));
		rect = slotRoot.children[0] as SVGRectElement;
		expect(rect.getAttribute('x')).toBe('0');
		expect(rect.getAttribute('y')).toBe('100');
	});

	it('cleans up highlight on unmount', () => {
		const env = { slotRoots: { underPieces: slotRoot } };
		const selectedSquareExtension = createSelectedSquareExtension();

		const mounted = selectedSquareExtension.mount(env);

		mounted.update(createUpdateContext(0 as Square, true));
		mounted.renderBoard(createRenderContext(0 as Square, true, 1));
		expect(slotRoot.children.length).toBe(1);

		mounted.unmount();
		expect(slotRoot.children.length).toBe(0);
	});
});
