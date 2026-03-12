import { describe, expect, it } from 'vitest';
import { makeRenderGeometry } from '../../../src/core/renderer/geometry';
import { SvgRenderer } from '../../../src/core/renderer/SvgRenderer';
import { DirtyLayer } from '../../../src/core/scheduler/types';
import type { BoardStateSnapshot } from '../../../src/core/state/boardTypes';

/** Minimal valid BoardStateSnapshot fixture for renderer tests */
function makeBoardSnapshot(
	overrides?: Partial<{ pieces: Uint8Array; ids: Int16Array }>
): BoardStateSnapshot {
	const pieces = overrides?.pieces ?? new Uint8Array(64);
	const ids = overrides?.ids ?? new Int16Array(64).fill(-1);
	return { pieces, ids, turn: 'white' };
}

describe('SvgRenderer structure (root/slot normalization)', () => {
	it('mount creates normalized root/slot structure in exact order', () => {
		const renderer = new SvgRenderer();
		const container = document.createElement('div');

		renderer.mount(container);

		const svg = container.querySelector('svg');
		expect(svg).toBeTruthy();

		const children = Array.from(svg!.children);
		expect(children.length).toBe(10);

		// Assert exact order
		expect(children[0].tagName).toBe('defs'); // defsStatic
		expect(children[1].tagName).toBe('g'); // boardRoot
		expect(children[2].tagName).toBe('g'); // coordsRoot
		expect(children[3].tagName).toBe('g'); // extensionsUnderPiecesRoot
		expect(children[4].tagName).toBe('g'); // piecesRoot
		expect(children[5].tagName).toBe('g'); // extensionsOverPiecesRoot
		expect(children[6].tagName).toBe('g'); // extensionsDragUnderRoot
		expect(children[7].tagName).toBe('g'); // dragRoot
		expect(children[8].tagName).toBe('g'); // extensionsDragOverRoot
		expect(children[9].tagName).toBe('defs'); // defsDynamic

		renderer.unmount();
	});

	it('legacy highlight/overlay groups are not created', () => {
		const renderer = new SvgRenderer();
		const container = document.createElement('div');

		renderer.mount(container);

		const svg = container.querySelector('svg');
		expect(svg).toBeTruthy();

		// Exactly 10 children: 2 defs + 8 g elements
		const gElements = Array.from(svg!.children).filter((el) => el.tagName === 'g');
		expect(gElements.length).toBe(8);

		renderer.unmount();
	});

	it('piece rendering appends nodes under piecesRoot (5th child)', () => {
		const renderer = new SvgRenderer();
		const container = document.createElement('div');

		renderer.mount(container);

		const svg = container.querySelector('svg');
		const piecesRoot = svg!.children[4] as SVGGElement; // 5th child (index 4)

		// Place a white pawn on e2 (square 12)
		// Encode: white=0, pawn=5 -> (0 << 3) | 5 = 5
		const pieces = new Uint8Array(64);
		const ids = new Int16Array(64).fill(-1);
		pieces[12] = 5;
		ids[12] = 1; // stable piece id

		const board = makeBoardSnapshot({ pieces, ids });
		const geometry = makeRenderGeometry(800, 'white');
		// render(board, invalidation, geometry)
		renderer.render(board, { layers: DirtyLayer.Pieces }, geometry);

		expect(piecesRoot.children.length).toBe(1);
		expect(piecesRoot.children[0].tagName).toBe('g');

		renderer.unmount();
	});

	it('defsDynamic receives clipPaths during piece rendering', () => {
		const renderer = new SvgRenderer();
		const container = document.createElement('div');

		renderer.mount(container);

		const svg = container.querySelector('svg');
		const defsDynamic = svg!.children[9] as SVGDefsElement; // 10th child (index 9)

		const pieces = new Uint8Array(64);
		const ids = new Int16Array(64).fill(-1);
		pieces[12] = 5;
		ids[12] = 1;

		const board = makeBoardSnapshot({ pieces, ids });
		const geometry = makeRenderGeometry(800, 'white');
		// render(board, invalidation, geometry)
		renderer.render(board, { layers: DirtyLayer.Pieces }, geometry);

		expect(defsDynamic.children.length).toBe(1);
		expect(defsDynamic.children[0].tagName).toBe('clipPath');

		renderer.unmount();
	});

	it('clipPaths remain valid after repeated render', () => {
		const renderer = new SvgRenderer();
		const container = document.createElement('div');
		renderer.mount(container);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const defsDynamic = (renderer as any).defsDynamic as SVGDefsElement;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const piecesRoot = (renderer as any).piecesRoot as SVGGElement;

		const pieces = new Uint8Array(64);
		const ids = new Int16Array(64).fill(-1);
		pieces[12] = 5; // white pawn on e2
		ids[12] = 1;

		const board = makeBoardSnapshot({ pieces, ids });
		const geometry = makeRenderGeometry(800, 'white');
		const invalidation = { layers: DirtyLayer.Pieces };

		// First render
		renderer.render(board, invalidation, geometry);

		const clipPath1 = defsDynamic.children[0] as SVGClipPathElement;
		const clipId = clipPath1.getAttribute('id')!;
		expect(clipId).toBeTruthy();

		// Second render (same state)
		renderer.render(board, invalidation, geometry);

		expect(defsDynamic.children.length).toBe(1);

		const liveClipPath = defsDynamic.querySelector(`#${clipId}`);
		expect(liveClipPath).toBeTruthy();
		expect(liveClipPath!.tagName).toBe('clipPath');

		const pieceGroup = piecesRoot.children[0] as SVGGElement;
		expect(pieceGroup.getAttribute('clip-path')).toBe(`url(#${clipId})`);

		renderer.unmount();
	});

	it('render() before mount() throws', () => {
		const renderer = new SvgRenderer();

		const board = makeBoardSnapshot();
		const geometry = makeRenderGeometry(800, 'white');

		expect(() => renderer.render(board, { layers: DirtyLayer.Board }, geometry)).toThrow(
			/before mount/i
		);
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
});
