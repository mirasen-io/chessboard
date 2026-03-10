import { describe, expect, it } from 'vitest';
import { SvgRenderer } from '../../../src/core/renderer/SvgRenderer';
import { makeRenderGeometry } from '../../../src/core/renderer/geometry';
import { DirtyLayer } from '../../../src/core/state/types';

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

		// Verify no legacy highlight or overlay groups exist
		// (We have exactly 10 children: 2 defs + 8 g elements as per new structure)
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

		// Create minimal state with one piece
		const pieces = new Uint8Array(64);
		const ids = new Int16Array(64);

		// Place a white pawn on e2 (square 12)
		// Encode: white=0, pawn=5 -> (0 << 3) | 5 = 5
		pieces[12] = 5;
		ids[12] = 1; // stable piece id

		const state = {
			pieces,
			ids,
			orientation: 'white' as const,
			turn: 'white' as const,
			selected: null,
			lastMove: null,
			theme: {
				light: '#f0d9b5',
				dark: '#b58863',
				highlight: 'rgba(255, 255, 0, 0.5)',
				selection: 'rgba(20, 85, 30, 0.5)',
				lastMove: 'rgba(155, 199, 0, 0.41)'
			}
		};

		const geometry = makeRenderGeometry(800, 'white');
		const invalidation = { layers: DirtyLayer.Pieces };

		renderer.render(state, geometry, invalidation);

		// Verify piece node was appended to piecesRoot
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

		// Create minimal state with one piece
		const pieces = new Uint8Array(64);
		const ids = new Int16Array(64);

		// Place a white pawn on e2 (square 12)
		pieces[12] = 5;
		ids[12] = 1;

		const state = {
			pieces,
			ids,
			orientation: 'white' as const,
			turn: 'white' as const,
			selected: null,
			lastMove: null,
			theme: {
				light: '#f0d9b5',
				dark: '#b58863',
				highlight: 'rgba(255, 255, 0, 0.5)',
				selection: 'rgba(20, 85, 30, 0.5)',
				lastMove: 'rgba(155, 199, 0, 0.41)'
			}
		};

		const geometry = makeRenderGeometry(800, 'white');
		const invalidation = { layers: DirtyLayer.Pieces };

		renderer.render(state, geometry, invalidation);

		// Verify clipPath was added to defsDynamic
		expect(defsDynamic.children.length).toBe(1);
		expect(defsDynamic.children[0].tagName).toBe('clipPath');

		renderer.unmount();
	});

	it('clipPaths remain valid after repeated render', () => {
		const renderer = new SvgRenderer();
		const container = document.createElement('div');
		renderer.mount(container);

		// Access renderer fields directly (no DOM structure coupling)
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const defsDynamic = (renderer as any).defsDynamic as SVGDefsElement;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const piecesRoot = (renderer as any).piecesRoot as SVGGElement;

		// Create state with one piece
		const pieces = new Uint8Array(64);
		const ids = new Int16Array(64);
		pieces[12] = 5; // white pawn on e2
		ids[12] = 1;

		const state = {
			pieces,
			ids,
			orientation: 'white' as const,
			turn: 'white' as const,
			selected: null,
			lastMove: null,
			theme: {
				light: '#f0d9b5',
				dark: '#b58863',
				highlight: 'rgba(255, 255, 0, 0.5)',
				selection: 'rgba(20, 85, 30, 0.5)',
				lastMove: 'rgba(155, 199, 0, 0.41)'
			}
		};

		const geometry = makeRenderGeometry(800, 'white');
		const invalidation = { layers: DirtyLayer.Pieces };

		// First render
		renderer.render(state, geometry, invalidation);

		const clipPath1 = defsDynamic.children[0] as SVGClipPathElement;
		const clipId = clipPath1.getAttribute('id')!;
		expect(clipId).toBeTruthy();

		// Second render (same state)
		renderer.render(state, geometry, invalidation);

		// Assert clipPath still exists in defsDynamic by count
		expect(defsDynamic.children.length).toBe(1);

		// Assert clipPath still exists in defsDynamic by id lookup
		const liveClipPath = defsDynamic.querySelector(`#${clipId}`);
		expect(liveClipPath).toBeTruthy();
		expect(liveClipPath!.tagName).toBe('clipPath');

		// Assert piece still references valid clipPath
		const pieceGroup = piecesRoot.children[0] as SVGGElement;
		expect(pieceGroup.getAttribute('clip-path')).toBe(`url(#${clipId})`);

		renderer.unmount();
	});
});
