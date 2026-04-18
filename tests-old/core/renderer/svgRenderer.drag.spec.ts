/**
 * Phase 3.3/3.8 — SvgRenderer drag rendering tests.
 *
 * Verifies:
 * 1. no drag => dragRoot is empty
 * 2. active drag => exactly one image in dragRoot
 * 3. active drag => source piece absent from piecesRoot
 * 4. drag end => dragRoot cleared and source piece restored in piecesRoot
 * 5. drag-only invalidation => board/coords are not redrawn
 * 6. Phase 3.8: drag visual follows pointer position
 * 7. Phase 3.8: same-square pointer movement updates drag position
 */

import { describe, expect, it } from 'vitest';
import { makeRenderGeometry } from '../../../src/core/renderer/geometry';
import { SvgRenderer } from '../../../src/core/renderer/SvgRenderer';
import type { BoardPoint } from '../../../src/core/renderer/types';
import { DirtyLayer } from '../../../src/core/scheduler/types';
import type { BoardStateSnapshot, Square } from '../../../src/core/state/boardTypes';
import type { InteractionStateSnapshot } from '../../../src/core/state/interactionTypes';

function sq(n: number): Square {
	return n as Square;
}

/** Minimal board snapshot with a single white pawn on e2 (square 12). */
function makePawnBoard(): BoardStateSnapshot {
	const pieces = new Uint8Array(64);
	const ids = new Int16Array(64).fill(-1);
	pieces[12] = 1; // white pawn encoding
	ids[12] = 1; // stable piece id
	return { pieces, ids, turn: 'white', positionEpoch: 0 };
}

/** Minimal empty board snapshot. */
function makeEmptyBoard(): BoardStateSnapshot {
	return {
		pieces: new Uint8Array(64),
		ids: new Int16Array(64).fill(-1),
		turn: 'white',
		positionEpoch: 0
	};
}

describe('SvgRenderer drag rendering (Phase 3.3/3.8)', () => {
	// ── 1. no drag => dragRoot is empty ───────────────────────────────────────

	it('no drag: dragRoot is empty after Drag-layer render', () => {
		const renderer = new SvgRenderer();
		const container = document.createElement('div');
		renderer.mount(container);

		const board = makePawnBoard();
		const geometry = makeRenderGeometry(800, 'white');
		const interaction: InteractionStateSnapshot = {
			selectedSquare: null,
			destinations: null,
			currentTarget: null,
			dragSession: null,
			releaseTargetingActive: false
		};

		renderer.renderDrag({
			board,
			geometry,
			interaction,
			transientVisuals: { dragPointer: null }
		});

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const dragRoot = (renderer as any).dragRoot as SVGGElement;
		expect(dragRoot.children.length).toBe(0);
		//Root must remain unused under drag-only renders
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const animationRoot = (renderer as any).animationRoot as SVGGElement;
		expect(animationRoot.children.length).toBe(0);

		renderer.unmount();
	});

	// ── 2. active drag => exactly one image in dragRoot ───────────────────────

	it('active drag: renders exactly one image in dragRoot', () => {
		const renderer = new SvgRenderer();
		const container = document.createElement('div');
		renderer.mount(container);

		const board = makePawnBoard();
		const geometry = makeRenderGeometry(800, 'white');
		const interaction: InteractionStateSnapshot = {
			selectedSquare: sq(12),
			destinations: null,
			currentTarget: null,
			dragSession: { fromSquare: sq(12) },
			releaseTargetingActive: false
		};
		const dragPointer: BoardPoint = { x: 200, y: 300 };

		renderer.renderDrag({
			board,
			geometry,
			interaction,
			transientVisuals: { dragPointer }
		});

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const dragRoot = (renderer as any).dragRoot as SVGGElement;
		expect(dragRoot.children.length).toBe(1);
		expect(dragRoot.children[0].tagName).toBe('image');

		renderer.unmount();
	});

	it('active drag: drag image references the correct piece asset', () => {
		const renderer = new SvgRenderer();
		const container = document.createElement('div');
		renderer.mount(container);

		const board = makePawnBoard();
		const geometry = makeRenderGeometry(800, 'white');
		const interaction: InteractionStateSnapshot = {
			selectedSquare: sq(12),
			destinations: null,
			currentTarget: null,
			dragSession: { fromSquare: sq(12) },
			releaseTargetingActive: false
		};
		const dragPointer: BoardPoint = { x: 200, y: 300 };

		renderer.renderDrag({
			board,
			geometry,
			interaction,
			transientVisuals: { dragPointer }
		});

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const dragRoot = (renderer as any).dragRoot as SVGGElement;
		const img = dragRoot.children[0] as SVGImageElement;
		const href = img.getAttribute('href');
		expect(href).toBeTruthy();
		// Asset URL can be either a file path (wp.svg) or a data URL
		expect(href).toMatch(/wp\.svg|data:image\/svg/);

		renderer.unmount();
	});

	it('active drag session but no drag pointer: dragRoot is empty', () => {
		const renderer = new SvgRenderer();
		const container = document.createElement('div');
		renderer.mount(container);

		const board = makePawnBoard();
		const geometry = makeRenderGeometry(800, 'white');
		const interaction: InteractionStateSnapshot = {
			selectedSquare: sq(12),
			destinations: null,
			currentTarget: null,
			dragSession: { fromSquare: sq(12) },
			releaseTargetingActive: false
		};

		renderer.renderDrag({
			board,
			geometry,
			interaction,
			transientVisuals: { dragPointer: null }
		});

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const dragRoot = (renderer as any).dragRoot as SVGGElement;
		expect(dragRoot.children.length).toBe(0);

		renderer.unmount();
	});

	// ── 3. active drag => source piece absent from piecesRoot ─────────────────

	it('active drag: source piece is absent from piecesRoot', () => {
		const renderer = new SvgRenderer();
		const container = document.createElement('div');
		renderer.mount(container);

		const board = makePawnBoard();
		const geometry = makeRenderGeometry(800, 'white');
		const interaction: InteractionStateSnapshot = {
			selectedSquare: sq(12),
			destinations: null,
			currentTarget: null,
			dragSession: { fromSquare: sq(12) },
			releaseTargetingActive: false
		};
		const dragPointer: BoardPoint = { x: 200, y: 300 };

		renderer.renderDrag({
			board,
			geometry,
			interaction,
			transientVisuals: { dragPointer }
		});

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const piecesRoot = (renderer as any).piecesRoot as SVGGElement;
		// The only piece on the board is the dragged one — piecesRoot must be empty.
		expect(piecesRoot.children.length).toBe(0);

		renderer.unmount();
	});

	it('active drag: non-source pieces remain in piecesRoot', () => {
		// Board with two pieces: pawn on e2 (sq 12) and rook on a1 (sq 0).
		const pieces = new Uint8Array(64);
		const ids = new Int16Array(64).fill(-1);
		pieces[12] = 1; // white pawn
		ids[12] = 1;
		pieces[0] = 9; // white rook encoding (rook=4, white → 4*2+1=9)
		ids[0] = 2;
		const board: BoardStateSnapshot = { pieces, ids, turn: 'white', positionEpoch: 0 };

		const renderer = new SvgRenderer();
		const container = document.createElement('div');
		renderer.mount(container);

		const geometry = makeRenderGeometry(800, 'white');
		const interaction: InteractionStateSnapshot = {
			selectedSquare: sq(12),
			destinations: null,
			currentTarget: null,
			dragSession: { fromSquare: sq(12) },
			releaseTargetingActive: false
		};
		const dragPointer: BoardPoint = { x: 200, y: 300 };

		// Establish baseline pieces with renderBoard
		renderer.renderBoard({
			board,
			invalidation: { layers: DirtyLayer.Pieces, squares: new Set() },
			geometry,
			suppressedPieceIds: new Set()
		});

		// Suppress the dragged piece (pawn at sq 12, id 1) and re-render board
		renderer.renderBoard({
			board,
			invalidation: { layers: DirtyLayer.Pieces, squares: new Set() },
			geometry,
			suppressedPieceIds: new Set([1]) // Suppress piece id 1 (the pawn)
		});

		// Now render drag visual
		renderer.renderDrag({
			board,
			geometry,
			interaction,
			transientVisuals: { dragPointer }
		});

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const piecesRoot = (renderer as any).piecesRoot as SVGGElement;
		// Only the rook remains in piecesRoot; the pawn is in dragRoot.
		expect(piecesRoot.children.length).toBe(1);

		renderer.unmount();
	});

	// ── 4. drag end => dragRoot cleared, source piece restored ────────────────

	it('drag end: dragRoot is cleared when drag becomes null', () => {
		const renderer = new SvgRenderer();
		const container = document.createElement('div');
		renderer.mount(container);

		const board = makePawnBoard();
		const geometry = makeRenderGeometry(800, 'white');
		const interactionActive: InteractionStateSnapshot = {
			selectedSquare: sq(12),
			destinations: null,
			currentTarget: null,
			dragSession: { fromSquare: sq(12) },
			releaseTargetingActive: false
		};
		const interactionEnded: InteractionStateSnapshot = {
			selectedSquare: sq(12),
			destinations: null,
			currentTarget: null,
			dragSession: null,
			releaseTargetingActive: false
		};
		const dragPointer: BoardPoint = { x: 200, y: 300 };

		// Start drag
		renderer.renderDrag({
			board,
			geometry,
			interaction: interactionActive,
			transientVisuals: { dragPointer }
		});

		// End drag (cancel / snap back)
		renderer.renderDrag({
			board,
			geometry,
			interaction: interactionEnded,
			transientVisuals: { dragPointer: null }
		});

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const dragRoot = (renderer as any).dragRoot as SVGGElement;
		expect(dragRoot.children.length).toBe(0);

		renderer.unmount();
	});

	it('drag end: source piece is restored in piecesRoot', () => {
		const renderer = new SvgRenderer();
		const container = document.createElement('div');
		renderer.mount(container);

		const board = makePawnBoard();
		const geometry = makeRenderGeometry(800, 'white');
		const interactionActive: InteractionStateSnapshot = {
			selectedSquare: sq(12),
			destinations: null,
			currentTarget: null,
			dragSession: { fromSquare: sq(12) },
			releaseTargetingActive: false
		};
		const interactionEnded: InteractionStateSnapshot = {
			selectedSquare: sq(12),
			destinations: null,
			currentTarget: null,
			dragSession: null,
			releaseTargetingActive: false
		};
		const dragPointer: BoardPoint = { x: 200, y: 300 };

		// Establish baseline pieces
		renderer.renderBoard({
			board,
			invalidation: { layers: DirtyLayer.Pieces, squares: new Set() },
			geometry,
			suppressedPieceIds: new Set()
		});

		// Start drag
		renderer.renderDrag({
			board,
			geometry,
			interaction: interactionActive,
			transientVisuals: { dragPointer }
		});

		// End drag - restore piece with renderBoard
		renderer.renderBoard({
			board,
			invalidation: { layers: DirtyLayer.Pieces, squares: new Set() },
			geometry,
			suppressedPieceIds: new Set()
		});

		// Clear drag visual
		renderer.renderDrag({
			board,
			geometry,
			interaction: interactionEnded,
			transientVisuals: { dragPointer: null }
		});

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const piecesRoot = (renderer as any).piecesRoot as SVGGElement;
		expect(piecesRoot.children.length).toBe(1);

		renderer.unmount();
	});

	it('drag end: piece node is reused (not recreated) after drag ends', () => {
		// The cached node for the dragged piece must survive the drag and be reused.
		const renderer = new SvgRenderer();
		const container = document.createElement('div');
		renderer.mount(container);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const piecesRoot = (renderer as any).piecesRoot as SVGGElement;

		const board = makePawnBoard();
		const geometry = makeRenderGeometry(800, 'white');
		const interactionNone: InteractionStateSnapshot = {
			selectedSquare: null,
			destinations: null,
			currentTarget: null,
			dragSession: null,
			releaseTargetingActive: false
		};
		const interactionActive: InteractionStateSnapshot = {
			selectedSquare: sq(12),
			destinations: null,
			currentTarget: null,
			dragSession: { fromSquare: sq(12) },
			releaseTargetingActive: false
		};
		const interactionEnded: InteractionStateSnapshot = {
			selectedSquare: sq(12),
			destinations: null,
			currentTarget: null,
			dragSession: null,
			releaseTargetingActive: false
		};
		const dragPointer: BoardPoint = { x: 200, y: 300 };

		// Initial render (no drag) — capture the piece node reference
		renderer.renderDrag({
			board,
			geometry,
			interaction: interactionNone,
			transientVisuals: { dragPointer: null }
		});
		const nodeBeforeDrag = piecesRoot.children[0] as SVGImageElement;

		// Start drag — piece leaves piecesRoot
		renderer.renderDrag({
			board,
			geometry,
			interaction: interactionActive,
			transientVisuals: { dragPointer }
		});
		expect(piecesRoot.children.length).toBe(0); // piece is in dragRoot

		// End drag — piece returns to piecesRoot
		renderer.renderDrag({
			board,
			geometry,
			interaction: interactionEnded,
			transientVisuals: { dragPointer: null }
		});
		const nodeAfterDrag = piecesRoot.children[0] as SVGImageElement;

		// Same DOM node must be reused — no recreation
		expect(nodeAfterDrag).toBe(nodeBeforeDrag);

		renderer.unmount();
	});

	// ── 5. drag-only invalidation => board/coords not redrawn ─────────────────

	it('drag-only invalidation: boardRoot is not redrawn', () => {
		const renderer = new SvgRenderer();
		const container = document.createElement('div');
		renderer.mount(container);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const boardRoot = (renderer as any).boardRoot as SVGGElement;

		const board = makeEmptyBoard();
		const geometry = makeRenderGeometry(800, 'white');
		const interaction: InteractionStateSnapshot = {
			selectedSquare: null,
			destinations: null,
			currentTarget: null,
			dragSession: null,
			releaseTargetingActive: false
		};

		// Seed baseline with renderBoard
		renderer.renderBoard({
			board,
			invalidation: { layers: DirtyLayer.All, squares: new Set() },
			geometry,
			suppressedPieceIds: new Set()
		});
		expect(boardRoot.children.length).toBe(64); // 64 squares drawn

		// Capture a board rect reference
		const firstRect = boardRoot.children[0];

		// Drag-only render — boardRoot must not be touched
		renderer.renderDrag({
			board,
			geometry,
			interaction,
			transientVisuals: { dragPointer: null }
		});

		// boardRoot still has 64 children and the same first node
		expect(boardRoot.children.length).toBe(64);
		expect(boardRoot.children[0]).toBe(firstRect);

		renderer.unmount();
	});

	it('drag-only invalidation: coordsRoot is not redrawn', () => {
		const renderer = new SvgRenderer();
		const container = document.createElement('div');
		renderer.mount(container);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const coordsRoot = (renderer as any).coordsRoot as SVGGElement;

		const board = makeEmptyBoard();
		const geometry = makeRenderGeometry(800, 'white');
		const interaction: InteractionStateSnapshot = {
			selectedSquare: null,
			destinations: null,
			currentTarget: null,
			dragSession: null,
			releaseTargetingActive: false
		};

		// Seed baseline with renderBoard
		renderer.renderBoard({
			board,
			invalidation: { layers: DirtyLayer.All, squares: new Set() },
			geometry,
			suppressedPieceIds: new Set()
		});
		expect(coordsRoot.children.length).toBe(16); // 16 coordinate labels

		const firstLabel = coordsRoot.children[0];

		// Drag-only render — coordsRoot must not be touched
		renderer.renderDrag({
			board,
			geometry,
			interaction,
			transientVisuals: { dragPointer: null }
		});

		expect(coordsRoot.children.length).toBe(16);
		expect(coordsRoot.children[0]).toBe(firstLabel);

		renderer.unmount();
	});

	it('drag-only invalidation: piecesRoot is not redrawn', () => {
		const renderer = new SvgRenderer();
		const container = document.createElement('div');
		renderer.mount(container);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const piecesRoot = (renderer as any).piecesRoot as SVGGElement;

		const board = makePawnBoard();
		const geometry = makeRenderGeometry(800, 'white');
		const interaction: InteractionStateSnapshot = {
			selectedSquare: null,
			destinations: null,
			currentTarget: null,
			dragSession: null,
			releaseTargetingActive: false
		};

		// Seed baseline with renderBoard
		renderer.renderBoard({
			board,
			invalidation: { layers: DirtyLayer.Pieces, squares: new Set() },
			geometry,
			suppressedPieceIds: new Set()
		});
		expect(piecesRoot.children.length).toBe(1);
		const pieceNode = piecesRoot.children[0];

		// Drag-only render — piecesRoot must not be touched
		renderer.renderDrag({
			board,
			geometry,
			interaction,
			transientVisuals: { dragPointer: null }
		});

		expect(piecesRoot.children.length).toBe(1);
		expect(piecesRoot.children[0]).toBe(pieceNode);

		renderer.unmount();
	});

	// ── 6. Phase 3.8: drag visual follows pointer position ────────────────────

	it('Phase 3.8: drag piece is centered under pointer', () => {
		const renderer = new SvgRenderer();
		const container = document.createElement('div');
		renderer.mount(container);

		const board = makePawnBoard();
		const geometry = makeRenderGeometry(800, 'white');
		const interaction: InteractionStateSnapshot = {
			selectedSquare: sq(12),
			destinations: null,
			currentTarget: null,
			dragSession: { fromSquare: sq(12) },
			releaseTargetingActive: false
		};
		const dragPointer: BoardPoint = { x: 250, y: 350 };

		renderer.renderDrag({
			board,
			geometry,
			interaction,
			transientVisuals: { dragPointer }
		});

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const dragRoot = (renderer as any).dragRoot as SVGGElement;
		const img = dragRoot.children[0] as SVGImageElement;

		// Piece should be centered under pointer
		const squareSize = geometry.squareSize;
		const expectedX = dragPointer.x - squareSize / 2;
		const expectedY = dragPointer.y - squareSize / 2;

		expect(img.getAttribute('x')).toBe(String(expectedX));
		expect(img.getAttribute('y')).toBe(String(expectedY));
		expect(img.getAttribute('width')).toBe(String(squareSize));
		expect(img.getAttribute('height')).toBe(String(squareSize));

		renderer.unmount();
	});

	it('Phase 3.8: drag position updates on pointer move', () => {
		const renderer = new SvgRenderer();
		const container = document.createElement('div');
		renderer.mount(container);

		const board = makePawnBoard();
		const geometry = makeRenderGeometry(800, 'white');
		const interaction: InteractionStateSnapshot = {
			selectedSquare: sq(12),
			destinations: null,
			currentTarget: null,
			dragSession: { fromSquare: sq(12) },
			releaseTargetingActive: false
		};

		// First render at position 1
		const dragPointer1: BoardPoint = { x: 200, y: 300 };
		renderer.renderDrag({
			board,
			geometry,
			interaction,
			transientVisuals: { dragPointer: dragPointer1 }
		});

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const dragRoot = (renderer as any).dragRoot as SVGGElement;
		const img1 = dragRoot.children[0] as SVGImageElement;
		const squareSize = geometry.squareSize;
		const expectedX1 = dragPointer1.x - squareSize / 2;
		const expectedY1 = dragPointer1.y - squareSize / 2;

		expect(img1.getAttribute('x')).toBe(String(expectedX1));
		expect(img1.getAttribute('y')).toBe(String(expectedY1));

		// Second render at position 2 (pointer moved)
		const dragPointer2: BoardPoint = { x: 350, y: 450 };
		renderer.renderDrag({
			board,
			geometry,
			interaction,
			transientVisuals: { dragPointer: dragPointer2 }
		});

		const img2 = dragRoot.children[0] as SVGImageElement;
		const expectedX2 = dragPointer2.x - squareSize / 2;
		const expectedY2 = dragPointer2.y - squareSize / 2;

		expect(img2.getAttribute('x')).toBe(String(expectedX2));
		expect(img2.getAttribute('y')).toBe(String(expectedY2));

		renderer.unmount();
	});

	it('Phase 3.8: same-square pointer movement updates drag position', () => {
		const renderer = new SvgRenderer();
		const container = document.createElement('div');
		renderer.mount(container);

		const board = makePawnBoard();
		const geometry = makeRenderGeometry(800, 'white');
		const interaction: InteractionStateSnapshot = {
			selectedSquare: sq(12),
			destinations: null,
			currentTarget: sq(12), // same square
			dragSession: { fromSquare: sq(12) },
			releaseTargetingActive: false
		};

		// First render at position 1 (within square 12)
		const dragPointer1: BoardPoint = { x: 200, y: 300 };
		renderer.renderDrag({
			board,
			geometry,
			interaction,
			transientVisuals: { dragPointer: dragPointer1 }
		});

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const dragRoot = (renderer as any).dragRoot as SVGGElement;
		const squareSize = geometry.squareSize;
		const expectedX1 = dragPointer1.x - squareSize / 2;
		const expectedY1 = dragPointer1.y - squareSize / 2;

		const img1 = dragRoot.children[0] as SVGImageElement;
		expect(img1.getAttribute('x')).toBe(String(expectedX1));
		expect(img1.getAttribute('y')).toBe(String(expectedY1));

		// Second render at position 2 (still within square 12, but different pixel position)
		const dragPointer2: BoardPoint = { x: 210, y: 310 };
		renderer.renderDrag({
			board,
			geometry,
			interaction,
			transientVisuals: { dragPointer: dragPointer2 }
		});

		const img2 = dragRoot.children[0] as SVGImageElement;
		const expectedX2 = dragPointer2.x - squareSize / 2;
		const expectedY2 = dragPointer2.y - squareSize / 2;

		expect(img2.getAttribute('x')).toBe(String(expectedX2));
		expect(img2.getAttribute('y')).toBe(String(expectedY2));

		renderer.unmount();
	});
});
