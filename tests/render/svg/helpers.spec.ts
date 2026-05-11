import { describe, expect, it } from 'vitest';
import {
	clearSvgElementChildren,
	createSvgDefsElement,
	createSvgElement,
	createSvgRootElement,
	isLightSquare,
	SVG_NS,
	updateSvgElementAttributes
} from '../../../src/render/svg/helpers.js';
import { normalizeSquare } from '../../../src/state/board/normalize.js';

describe('SVG helpers', () => {
	describe('createSvgRootElement', () => {
		it('creates an SVGSVGElement in the SVG namespace', () => {
			const parent = document.createElement('div');
			const el = createSvgRootElement(parent, { 'data-chessboard-id': 'root' });
			expect(el.namespaceURI).toBe(SVG_NS);
			expect(el.tagName.toLowerCase()).toBe('svg');
		});

		it('appends to the parent HTMLElement', () => {
			const parent = document.createElement('div');
			const el = createSvgRootElement(parent, { 'data-chessboard-id': 'root' });
			expect(el.parentNode).toBe(parent);
			expect(parent.children).toHaveLength(1);
		});

		it('sets provided attributes', () => {
			const parent = document.createElement('div');
			const el = createSvgRootElement(parent, {
				'data-chessboard-id': 'my-svg',
				class: 'board'
			});
			expect(el.getAttribute('data-chessboard-id')).toBe('my-svg');
			expect(el.getAttribute('class')).toBe('board');
		});
	});

	describe('createSvgDefsElement', () => {
		it('creates a <defs> element as a direct child of the SVG root', () => {
			const parent = document.createElement('div');
			const svgRoot = createSvgRootElement(parent, { 'data-chessboard-id': 'svg' });
			const defs = createSvgDefsElement(svgRoot, { 'data-chessboard-id': 'defs-root' });
			expect(defs.tagName.toLowerCase()).toBe('defs');
			expect(defs.parentNode).toBe(svgRoot);
		});

		it('does not create nested <svg><defs> — defs is direct child of parent SVG', () => {
			const parent = document.createElement('div');
			const svgRoot = createSvgRootElement(parent, { 'data-chessboard-id': 'svg' });
			createSvgDefsElement(svgRoot, { 'data-chessboard-id': 'defs' });
			expect(svgRoot.querySelectorAll('svg')).toHaveLength(0);
			expect(svgRoot.querySelector(':scope > defs')).not.toBeNull();
		});

		it('sets provided attributes', () => {
			const parent = document.createElement('div');
			const svgRoot = createSvgRootElement(parent, { 'data-chessboard-id': 'svg' });
			const defs = createSvgDefsElement(svgRoot, { 'data-chessboard-id': 'my-defs' });
			expect(defs.getAttribute('data-chessboard-id')).toBe('my-defs');
		});

		it('inserts before the first non-defs child', () => {
			const parent = document.createElement('div');
			const svgRoot = createSvgRootElement(parent, { 'data-chessboard-id': 'svg' });
			createSvgElement(svgRoot, 'g', { 'data-chessboard-id': 'layer' });
			const defs = createSvgDefsElement(svgRoot, { 'data-chessboard-id': 'defs' });
			expect(svgRoot.children[0]).toBe(defs);
		});
	});

	describe('createSvgElement', () => {
		it('creates a <g> element as child of SVG root', () => {
			const parent = document.createElement('div');
			const svgRoot = createSvgRootElement(parent, { 'data-chessboard-id': 'svg' });
			const g = createSvgElement(svgRoot, 'g', { 'data-chessboard-id': 'layer' });
			expect(g.tagName.toLowerCase()).toBe('g');
			expect(g.parentNode).toBe(svgRoot);
		});

		it('creates an element with the specified tag under a <g> parent', () => {
			const parent = document.createElement('div');
			const svgRoot = createSvgRootElement(parent, { 'data-chessboard-id': 'svg' });
			const g = createSvgElement(svgRoot, 'g', { 'data-chessboard-id': 'layer' });
			const rect = createSvgElement(g, 'rect', { 'data-chessboard-id': 'r1' });
			expect(rect.tagName.toLowerCase()).toBe('rect');
			expect(rect.parentNode).toBe(g);
		});

		it('sets all provided attributes', () => {
			const parent = document.createElement('div');
			const svgRoot = createSvgRootElement(parent, { 'data-chessboard-id': 'svg' });
			const g = createSvgElement(svgRoot, 'g', { 'data-chessboard-id': 'layer' });
			const el = createSvgElement(g, 'circle', {
				'data-chessboard-id': 'c1',
				cx: '50',
				cy: '50',
				r: '25'
			});
			expect(el.getAttribute('cx')).toBe('50');
			expect(el.getAttribute('cy')).toBe('50');
			expect(el.getAttribute('r')).toBe('25');
		});
	});

	describe('updateSvgElementAttributes', () => {
		it('sets multiple attributes on an element', () => {
			const el = document.createElementNS(SVG_NS, 'rect');
			updateSvgElementAttributes(el, { x: '10', y: '20', width: '50' });
			expect(el.getAttribute('x')).toBe('10');
			expect(el.getAttribute('y')).toBe('20');
			expect(el.getAttribute('width')).toBe('50');
		});

		it('overwrites existing attributes', () => {
			const el = document.createElementNS(SVG_NS, 'rect');
			el.setAttribute('x', '0');
			updateSvgElementAttributes(el, { x: '99' });
			expect(el.getAttribute('x')).toBe('99');
		});
	});

	describe('clearSvgElementChildren', () => {
		it('removes all child nodes from a <g> element', () => {
			const g = document.createElementNS(SVG_NS, 'g') as SVGGElement;
			g.appendChild(document.createElementNS(SVG_NS, 'rect'));
			g.appendChild(document.createElementNS(SVG_NS, 'circle'));
			expect(g.childNodes).toHaveLength(2);
			clearSvgElementChildren(g);
			expect(g.childNodes).toHaveLength(0);
		});

		it('on empty element is a no-op', () => {
			const g = document.createElementNS(SVG_NS, 'g') as SVGGElement;
			expect(() => clearSvgElementChildren(g)).not.toThrow();
			expect(g.childNodes).toHaveLength(0);
		});

		it('removes all child nodes from a <defs> element', () => {
			const defs = document.createElementNS(SVG_NS, 'defs') as SVGDefsElement;
			defs.appendChild(document.createElementNS(SVG_NS, 'pattern'));
			defs.appendChild(document.createElementNS(SVG_NS, 'linearGradient'));
			expect(defs.childNodes).toHaveLength(2);
			clearSvgElementChildren(defs);
			expect(defs.childNodes).toHaveLength(0);
		});
	});

	describe('isLightSquare', () => {
		it('a1 is dark (file 0 + rank 0 is even)', () => {
			expect(isLightSquare(normalizeSquare('a1'))).toBe(false);
		});

		it('a2 is light (file 0 + rank 1 is odd)', () => {
			expect(isLightSquare(normalizeSquare('a2'))).toBe(true);
		});

		it('h1 is light (file 7 + rank 0 is odd)', () => {
			expect(isLightSquare(normalizeSquare('h1'))).toBe(true);
		});

		it('h8 is dark (file 7 + rank 7 is even)', () => {
			expect(isLightSquare(normalizeSquare('h8'))).toBe(false);
		});

		it('e4 is light (file 4 + rank 3 is odd)', () => {
			expect(isLightSquare(normalizeSquare('e4'))).toBe(true);
		});

		it('d4 is dark (file 3 + rank 3 is even)', () => {
			expect(isLightSquare(normalizeSquare('d4'))).toBe(false);
		});
	});
});
