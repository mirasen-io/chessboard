import { describe, expect, it } from 'vitest';
import { makeRenderGeometry } from '../../../src/core/renderer/geometry';
import { SvgRenderer } from '../../../src/core/renderer/SvgRenderer';
import { DirtyLayer } from '../../../src/core/scheduler/types';
import { type BoardStateSnapshot, type Square } from '../../../src/core/state/boardTypes';

/** Minimal valid BoardStateSnapshot fixture for renderer tests */
function makeBoardSnapshot(
	overrides?: Partial<{ pieces: Uint8Array; ids: Int16Array }>
): BoardStateSnapshot {
	const pieces = overrides?.pieces ?? new Uint8Array(64);
	const ids = overrides?.ids ?? new Int16Array(64).fill(-1);
	return { pieces, ids, turn: 'white', positionEpoch: 0 };
}

describe('SvgRenderer structure (root/slot normalization)', () => {
	it('mount creates normalized root/slot structure in exact order', () => {
		const renderer = new SvgRenderer();
		const container = document.createElement('div');

		renderer.mount(container);

		const svg = container.querySelector('svg');
		expect(svg).toBeTruthy();

		const children = Array.from(svg!.children);
		expect(children.length).toBe(11);

		// Assert exact order
		expect(children[0].tagName).toBe('defs'); // defsStatic
		expect(children[1].tagName).toBe('g'); // boardRoot
		expect(children[2].tagName).toBe('g'); // coordsRoot
		expect(children[3].tagName).toBe('g'); // extensionsUnderPiecesRoot
		expect(children[4].tagName).toBe('g'); // piecesRoot
		expect(children[5].tagName).toBe('g'); // extensionsOverPiecesRoot
		expect(children[6].tagName).toBe('g'); // animationRoot
		expect(children[7].tagName).toBe('g'); // extensionsDragUnderRoot
		expect(children[8].tagName).toBe('g'); // dragRoot
		expect(children[9].tagName).toBe('g'); // extensionsDragOverRoot
		expect(children[10].tagName).toBe('defs'); // defsDynamic

		renderer.unmount();
	});

	it('legacy highlight/overlay groups are not created', () => {
		const renderer = new SvgRenderer();
		const container = document.createElement('div');

		renderer.mount(container);

		const svg = container.querySelector('svg');
		expect(svg).toBeTruthy();

		// Exactly 11 children: 2 defs + 9 g elements
		const gElements = Array.from(svg!.children).filter((el) => el.tagName === 'g');
		expect(gElements.length).toBe(9);

		renderer.unmount();
	});

	it('piece rendering appends nodes under piecesRoot (5th child)', () => {
		// Each piece is a locally-bounded <image> element, not a <g clip-path>.
		const renderer = new SvgRenderer();
		const container = document.createElement('div');

		renderer.mount(container);

		const svg = container.querySelector('svg');
		const piecesRoot = svg!.children[4] as SVGGElement; // 5th child (index 4)

		// Place a white pawn on e2 (square 12)
		// Encoding: pawn=1, white → code 1
		const pieces = new Uint8Array(64);
		const ids = new Int16Array(64).fill(-1);
		pieces[12] = 1; // white pawn
		ids[12] = 1; // stable piece id

		const board = makeBoardSnapshot({ pieces, ids });
		const geometry = makeRenderGeometry(800, 'white');
		renderer.renderBoard({
			board,
			invalidation: { layers: DirtyLayer.Pieces, squares: new Set() },
			geometry,
			suppressedPieceIds: new Set<number>()
		});

		expect(piecesRoot.children.length).toBe(1);
		const pieceNode = piecesRoot.children[0];
		expect(pieceNode.tagName).toBe('image');
		// Piece node is locally bounded: x, y, width, height are set to the square rect
		expect(pieceNode.getAttribute('x')).toBeTruthy();
		expect(pieceNode.getAttribute('y')).toBeTruthy();
		expect(pieceNode.getAttribute('width')).toBeTruthy();
		expect(pieceNode.getAttribute('height')).toBeTruthy();

		renderer.unmount();
	});

	it('defsDynamic is not used for piece rendering', () => {
		// Pieces use per-piece <image> elements; no per-piece clipPath defs are needed.
		const renderer = new SvgRenderer();
		const container = document.createElement('div');

		renderer.mount(container);

		const svg = container.querySelector('svg');
		const defsDynamic = svg!.children[10] as SVGDefsElement; // 11th child (index 10)

		const pieces = new Uint8Array(64);
		const ids = new Int16Array(64).fill(-1);
		pieces[12] = 1; // white pawn
		ids[12] = 1;

		const board = makeBoardSnapshot({ pieces, ids });
		const geometry = makeRenderGeometry(800, 'white');
		renderer.renderBoard({
			board,
			invalidation: { layers: DirtyLayer.Pieces, squares: new Set() },
			geometry,
			suppressedPieceIds: new Set<number>()
		});

		expect(defsDynamic.children.length).toBe(0);

		renderer.unmount();
	});

	it('piece node is reused across renders', () => {
		// Verifies stable per-piece DOM-node reuse keyed by piece id.
		const renderer = new SvgRenderer();
		const container = document.createElement('div');
		renderer.mount(container);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const piecesRoot = (renderer as any).piecesRoot as SVGGElement;

		const pieces = new Uint8Array(64);
		const ids = new Int16Array(64).fill(-1);
		pieces[12] = 1; // white pawn on e2 (encoding: pawn=1, white → code 1)
		ids[12] = 1;

		const board = makeBoardSnapshot({ pieces, ids });
		const geometry = makeRenderGeometry(800, 'white');
		const invalidation = { layers: DirtyLayer.Pieces, squares: new Set<Square>() };

		// First render
		renderer.renderBoard({
			board,
			invalidation,
			geometry,
			suppressedPieceIds: new Set<number>()
		});
		const pieceNode1 = piecesRoot.children[0] as SVGImageElement;
		expect(pieceNode1.tagName).toBe('image');
		// href references the per-piece asset for white pawn
		const href = pieceNode1.getAttribute('href');
		expect(href).toBeTruthy();
		expect(href).toMatch(/wp\.svg|data:image\/svg/);

		// Second render (same state) — same DOM node must be reused, not recreated
		renderer.renderBoard({
			board,
			invalidation,
			geometry,
			suppressedPieceIds: new Set<number>()
		});
		const pieceNode2 = piecesRoot.children[0];
		expect(pieceNode2).toBe(pieceNode1); // same object reference

		renderer.unmount();
	});

	it('render() before mount() throws', () => {
		const renderer = new SvgRenderer();

		const board = makeBoardSnapshot();
		const geometry = makeRenderGeometry(800, 'white');

		expect(() =>
			renderer.renderBoard({
				board,
				invalidation: { layers: DirtyLayer.Board, squares: new Set() },
				geometry,
				suppressedPieceIds: new Set<number>()
			})
		).toThrow(/before mount/i);
	});

	it('board snapshot passed to render does not contain orientation, selected, or movability', () => {
		// Verifies: BoardStateSnapshot contract — view-owned fields are absent from the snapshot type.
		// Orientation is delivered via RenderGeometry; selection and movability are view-only.
		const board = makeBoardSnapshot();

		expect('orientation' in board).toBe(false);
		expect('selected' in board).toBe(false);
		expect('movability' in board).toBe(false);

		// Confirm the fields that ARE present
		expect('pieces' in board).toBe(true);
		expect('ids' in board).toBe(true);
		expect('turn' in board).toBe(true);
	});

	it('extension slot roots are empty after mount', () => {
		const renderer = new SvgRenderer();
		const container = document.createElement('div');

		renderer.mount(container);

		const svg = container.querySelector('svg');
		expect(svg).toBeTruthy();

		// Get slot roots (indices 3, 5, 7, 9)
		const extensionsUnderPiecesRoot = svg!.children[3] as SVGGElement;
		const extensionsOverPiecesRoot = svg!.children[5] as SVGGElement;
		const extensionsDragUnderRoot = svg!.children[7] as SVGGElement;
		const extensionsDragOverRoot = svg!.children[9] as SVGGElement;

		// Verify all slot roots are empty (no extension children yet)
		expect(extensionsUnderPiecesRoot.children.length).toBe(0);
		expect(extensionsOverPiecesRoot.children.length).toBe(0);
		expect(extensionsDragUnderRoot.children.length).toBe(0);
		expect(extensionsDragOverRoot.children.length).toBe(0);

		renderer.unmount();
	});

	it('pieces layer refreshes when suppressedPieceIds changes even without invalidation', () => {
		// Regression test: when suppression changes but normal invalidation doesn't request pieces redraw,
		// the renderer should still refresh the pieces layer to restore/hide pieces correctly.
		const renderer = new SvgRenderer();
		const container = document.createElement('div');
		renderer.mount(container);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const piecesRoot = (renderer as any).piecesRoot as SVGGElement;

		// Board with one piece: white pawn on e2
		const pieces = new Uint8Array(64);
		const ids = new Int16Array(64).fill(-1);
		pieces[12] = 1; // white pawn
		ids[12] = 1; // piece id 1

		const board = makeBoardSnapshot({ pieces, ids });
		const geometry = makeRenderGeometry(800, 'white');

		// First render: suppress piece id 1
		renderer.renderBoard({
			board,
			invalidation: { layers: DirtyLayer.Pieces, squares: new Set() },
			geometry,
			suppressedPieceIds: new Set([1])
		});

		// Piece should be suppressed (not in piecesRoot)
		expect(piecesRoot.children.length).toBe(0);

		// Second render: no invalidation, but unsuppress (empty set)
		// This should trigger a pieces refresh due to suppression change
		renderer.renderBoard({
			board,
			invalidation: { layers: 0, squares: new Set() }, // no layers marked dirty
			geometry,
			suppressedPieceIds: new Set() // suppression removed
		});

		// Piece should now be visible in piecesRoot
		expect(piecesRoot.children.length).toBe(1);
		const pieceNode = piecesRoot.children[0] as SVGImageElement;
		expect(pieceNode.tagName).toBe('image');

		renderer.unmount();
	});
});
