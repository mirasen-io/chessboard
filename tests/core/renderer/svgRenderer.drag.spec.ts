/**
 * Phase 3.3 — SvgRenderer drag rendering tests.
 *
 * Verifies:
 * 1. no drag => dragRoot is empty
 * 2. active drag => exactly one image in dragRoot
 * 3. active drag => source piece absent from piecesRoot
 * 4. drag end => dragRoot cleared and source piece restored in piecesRoot
 * 5. drag-only invalidation => board/coords are not redrawn
 */

import { describe, expect, it } from 'vitest';
import { makeRenderGeometry } from '../../../src/core/renderer/geometry';
import { SvgRenderer } from '../../../src/core/renderer/SvgRenderer';
import { DirtyLayer } from '../../../src/core/scheduler/types';
import type { BoardStateSnapshot, Square } from '../../../src/core/state/boardTypes';

function sq(n: number): Square {
	return n as Square;
}

/** Minimal board snapshot with a single white pawn on e2 (square 12). */
function makePawnBoard(): BoardStateSnapshot {
	const pieces = new Uint8Array(64);
	const ids = new Int16Array(64).fill(-1);
	pieces[12] = 1; // white pawn encoding
	ids[12] = 1; // stable piece id
	return { pieces, ids, turn: 'white' };
}

/** Minimal empty board snapshot. */
function makeEmptyBoard(): BoardStateSnapshot {
	return {
		pieces: new Uint8Array(64),
		ids: new Int16Array(64).fill(-1),
		turn: 'white'
	};
}

describe('SvgRenderer drag rendering (Phase 3.3)', () => {
	// ── 1. no drag => dragRoot is empty ───────────────────────────────────────

	it('no drag: dragRoot is empty after Drag-layer render', () => {
		const renderer = new SvgRenderer();
		const container = document.createElement('div');
		renderer.mount(container);

		const board = makePawnBoard();
		const geometry = makeRenderGeometry(800, 'white');

		renderer.render({
			board,
			invalidation: { layers: DirtyLayer.Pieces | DirtyLayer.Drag },
			geometry,
			drag: null
		});

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const dragRoot = (renderer as any).dragRoot as SVGGElement;
		expect(dragRoot.children.length).toBe(0);

		renderer.unmount();
	});

	// ── 2. active drag => exactly one image in dragRoot ───────────────────────

	it('active drag: renders exactly one image in dragRoot', () => {
		const renderer = new SvgRenderer();
		const container = document.createElement('div');
		renderer.mount(container);

		const board = makePawnBoard();
		const geometry = makeRenderGeometry(800, 'white');

		renderer.render({
			board,
			invalidation: { layers: DirtyLayer.Pieces | DirtyLayer.Drag },
			geometry,
			drag: { sourceSquare: sq(12) }
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

		renderer.render({
			board,
			invalidation: { layers: DirtyLayer.Pieces | DirtyLayer.Drag },
			geometry,
			drag: { sourceSquare: sq(12) }
		});

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const dragRoot = (renderer as any).dragRoot as SVGGElement;
		const img = dragRoot.children[0] as SVGImageElement;
		expect(img.getAttribute('href')).toContain('wp.svg'); // white pawn

		renderer.unmount();
	});

	it('active drag: drag image is positioned at the source square', () => {
		const renderer = new SvgRenderer();
		const container = document.createElement('div');
		renderer.mount(container);

		const board = makePawnBoard();
		const geometry = makeRenderGeometry(800, 'white');
		const expectedRect = geometry.squareRect(sq(12));

		renderer.render({
			board,
			invalidation: { layers: DirtyLayer.Pieces | DirtyLayer.Drag },
			geometry,
			drag: { sourceSquare: sq(12) }
		});

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const dragRoot = (renderer as any).dragRoot as SVGGElement;
		const img = dragRoot.children[0] as SVGImageElement;
		expect(img.getAttribute('x')).toBe(String(expectedRect.x));
		expect(img.getAttribute('y')).toBe(String(expectedRect.y));
		expect(img.getAttribute('width')).toBe(String(expectedRect.size));
		expect(img.getAttribute('height')).toBe(String(expectedRect.size));

		renderer.unmount();
	});

	// ── 3. active drag => source piece absent from piecesRoot ─────────────────

	it('active drag: source piece is absent from piecesRoot', () => {
		const renderer = new SvgRenderer();
		const container = document.createElement('div');
		renderer.mount(container);

		const board = makePawnBoard();
		const geometry = makeRenderGeometry(800, 'white');

		renderer.render({
			board,
			invalidation: { layers: DirtyLayer.Pieces | DirtyLayer.Drag },
			geometry,
			drag: { sourceSquare: sq(12) }
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
		const board: BoardStateSnapshot = { pieces, ids, turn: 'white' };

		const renderer = new SvgRenderer();
		const container = document.createElement('div');
		renderer.mount(container);

		const geometry = makeRenderGeometry(800, 'white');

		renderer.render({
			board,
			invalidation: { layers: DirtyLayer.Pieces | DirtyLayer.Drag },
			geometry,
			drag: { sourceSquare: sq(12) } // dragging the pawn
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

		// Start drag
		renderer.render({
			board,
			invalidation: { layers: DirtyLayer.Pieces | DirtyLayer.Drag },
			geometry,
			drag: { sourceSquare: sq(12) }
		});

		// End drag (cancel / snap back)
		renderer.render({
			board,
			invalidation: { layers: DirtyLayer.Pieces | DirtyLayer.Drag },
			geometry,
			drag: null
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

		// Start drag
		renderer.render({
			board,
			invalidation: { layers: DirtyLayer.Pieces | DirtyLayer.Drag },
			geometry,
			drag: { sourceSquare: sq(12) }
		});

		// End drag
		renderer.render({
			board,
			invalidation: { layers: DirtyLayer.Pieces | DirtyLayer.Drag },
			geometry,
			drag: null
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

		// Initial render (no drag) — capture the piece node reference
		renderer.render({
			board,
			invalidation: { layers: DirtyLayer.Pieces },
			geometry,
			drag: null
		});
		const nodeBeforeDrag = piecesRoot.children[0] as SVGImageElement;

		// Start drag — piece leaves piecesRoot
		renderer.render({
			board,
			invalidation: { layers: DirtyLayer.Pieces | DirtyLayer.Drag },
			geometry,
			drag: { sourceSquare: sq(12) }
		});
		expect(piecesRoot.children.length).toBe(0); // piece is in dragRoot

		// End drag — piece returns to piecesRoot
		renderer.render({
			board,
			invalidation: { layers: DirtyLayer.Pieces | DirtyLayer.Drag },
			geometry,
			drag: null
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

		// Full initial render to populate boardRoot
		renderer.render({
			board,
			invalidation: { layers: DirtyLayer.Board | DirtyLayer.Pieces | DirtyLayer.Drag },
			geometry,
			drag: null
		});
		expect(boardRoot.children.length).toBe(64); // 64 squares drawn

		// Capture a board rect reference
		const firstRect = boardRoot.children[0];

		// Drag-only render — boardRoot must not be touched
		renderer.render({
			board,
			invalidation: { layers: DirtyLayer.Drag },
			geometry,
			drag: null
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

		// Full initial render to populate coordsRoot
		renderer.render({
			board,
			invalidation: { layers: DirtyLayer.Board | DirtyLayer.Pieces | DirtyLayer.Drag },
			geometry,
			drag: null
		});
		expect(coordsRoot.children.length).toBe(16); // 16 coordinate labels

		const firstLabel = coordsRoot.children[0];

		// Drag-only render — coordsRoot must not be touched
		renderer.render({
			board,
			invalidation: { layers: DirtyLayer.Drag },
			geometry,
			drag: null
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

		// Initial pieces render
		renderer.render({
			board,
			invalidation: { layers: DirtyLayer.Pieces },
			geometry,
			drag: null
		});
		expect(piecesRoot.children.length).toBe(1);
		const pieceNode = piecesRoot.children[0];

		// Drag-only render — piecesRoot must not be touched
		renderer.render({
			board,
			invalidation: { layers: DirtyLayer.Drag },
			geometry,
			drag: null
		});

		expect(piecesRoot.children.length).toBe(1);
		expect(piecesRoot.children[0]).toBe(pieceNode);

		renderer.unmount();
	});
});
