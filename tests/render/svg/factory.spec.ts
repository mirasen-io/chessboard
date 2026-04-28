import { describe, expect, it } from 'vitest';
import { allocateExtensionSlotRoots, createSvgRoots } from '../../../src/render/svg/factory.js';
import { SVG_NS } from '../../../src/render/svg/helpers.js';
import type { SvgRoots } from '../../../src/render/types.js';

function makeSvgRoots(): SvgRoots {
	return createSvgRoots({
		doc: document,
		sharedDataFromExtensionSystem: {
			extensions: new Map(),
			transientVisualsSubscribers: new Set()
		},
		performRender: () => {}
	});
}

describe('createSvgRoots', () => {
	it('returns an object with all expected keys', () => {
		const roots = makeSvgRoots();
		const expectedKeys = [
			'svgRoot',
			'defs',
			'board',
			'coordinates',
			'underPieces',
			'pieces',
			'overPieces',
			'animation',
			'underDrag',
			'drag',
			'overDrag'
		];
		for (const key of expectedKeys) {
			expect(roots).toHaveProperty(key);
		}
	});

	it('svgRoot is an SVGSVGElement', () => {
		const roots = makeSvgRoots();
		expect(roots.svgRoot.tagName.toLowerCase()).toBe('svg');
		expect(roots.svgRoot.namespaceURI).toBe(SVG_NS);
	});

	it('svgRoot has user-select none style', () => {
		const roots = makeSvgRoots();
		expect(roots.svgRoot.style.getPropertyValue('user-select')).toBe('none');
	});

	it('svgRoot has touch-action pinch-zoom style', () => {
		const roots = makeSvgRoots();
		expect(roots.svgRoot.style.getPropertyValue('touch-action')).toBe('pinch-zoom');
	});

	it('all layer elements are children of svgRoot', () => {
		const roots = makeSvgRoots();
		const layers = [
			roots.defs,
			roots.board,
			roots.coordinates,
			roots.underPieces,
			roots.pieces,
			roots.overPieces,
			roots.animation,
			roots.underDrag,
			roots.drag,
			roots.overDrag
		];
		for (const layer of layers) {
			expect(layer.parentNode).toBe(roots.svgRoot);
		}
	});

	it('layers are in correct stacking order', () => {
		const roots = makeSvgRoots();
		const children = Array.from(roots.svgRoot.children);
		const expectedOrder = [
			'defs-root',
			'board-root',
			'coordinates-root',
			'under-pieces-root',
			'pieces-root',
			'over-pieces-root',
			'animation-root',
			'under-drag-root',
			'drag-root',
			'over-drag-root'
		];
		const actualOrder = children.map((c) => c.getAttribute('data-chessboard-id'));
		expect(actualOrder).toEqual(expectedOrder);
	});

	it('each layer has its expected data-chessboard-id', () => {
		const roots = makeSvgRoots();
		expect(roots.defs.getAttribute('data-chessboard-id')).toBe('defs-root');
		expect(roots.board.getAttribute('data-chessboard-id')).toBe('board-root');
		expect(roots.pieces.getAttribute('data-chessboard-id')).toBe('pieces-root');
		expect(roots.drag.getAttribute('data-chessboard-id')).toBe('drag-root');
	});
});

describe('allocateExtensionSlotRoots', () => {
	it('creates a g child inside the specified slot root', () => {
		const roots = makeSvgRoots();
		const allocated = allocateExtensionSlotRoots(roots, 'test-ext', ['board']);
		expect(allocated.board).toBeDefined();
		expect(allocated.board!.tagName.toLowerCase()).toBe('g');
		expect(allocated.board!.parentNode).toBe(roots.board);
	});

	it('only allocates for requested slots', () => {
		const roots = makeSvgRoots();
		const allocated = allocateExtensionSlotRoots(roots, 'test-ext', ['pieces', 'drag']);
		expect(allocated.pieces).toBeDefined();
		expect(allocated.drag).toBeDefined();
		expect(allocated.board).toBeUndefined();
		expect(allocated.animation).toBeUndefined();
	});

	it('allocated slot g has data-chessboard-id containing extension id', () => {
		const roots = makeSvgRoots();
		const allocated = allocateExtensionSlotRoots(roots, 'my-ext', ['overPieces']);
		const id = allocated.overPieces!.getAttribute('data-chessboard-id');
		expect(id).toContain('my-ext');
		expect(id).toContain('overPieces');
	});

	it('multiple extensions can allocate in the same slot', () => {
		const roots = makeSvgRoots();
		allocateExtensionSlotRoots(roots, 'ext-a', ['board']);
		allocateExtensionSlotRoots(roots, 'ext-b', ['board']);
		expect(roots.board.children).toHaveLength(2);
	});
});
