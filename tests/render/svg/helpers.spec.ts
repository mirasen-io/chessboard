import { describe, expect, it } from 'vitest';
import {
	clearElementChildren,
	createSvgElement,
	isLightSquare,
	SVG_NS,
	updateElementAttributes
} from '../../../src/render/svg/helpers.js';
import { normalizeSquare } from '../../../src/state/board/normalize.js';

describe('SVG helpers', () => {
	describe('createSvgElement', () => {
		it('creates an element in the SVG namespace', () => {
			const el = createSvgElement(document, 'g', { 'data-chessboard-id': 'test' });
			expect(el.namespaceURI).toBe(SVG_NS);
		});

		it('creates element with the specified tag name', () => {
			const el = createSvgElement(document, 'rect', { 'data-chessboard-id': 'r1' });
			expect(el.tagName.toLowerCase()).toBe('rect');
		});

		it('sets all provided attributes', () => {
			const el = createSvgElement(document, 'g', {
				'data-chessboard-id': 'my-id',
				class: 'foo'
			});
			expect(el.getAttribute('data-chessboard-id')).toBe('my-id');
			expect(el.getAttribute('class')).toBe('foo');
		});

		it('with Document as parent does not append to document', () => {
			const el = createSvgElement(document, 'g', { 'data-chessboard-id': 'orphan' });
			expect(el.parentNode).toBeNull();
		});

		it('with Element as parent appends as child', () => {
			const svg = document.createElementNS(SVG_NS, 'svg');
			const child = createSvgElement(svg, 'g', { 'data-chessboard-id': 'child' });
			expect(child.parentNode).toBe(svg);
			expect(svg.children).toHaveLength(1);
		});
	});

	describe('updateElementAttributes', () => {
		it('sets multiple attributes on an element', () => {
			const el = document.createElementNS(SVG_NS, 'rect');
			updateElementAttributes(el, { x: '10', y: '20', width: '50' });
			expect(el.getAttribute('x')).toBe('10');
			expect(el.getAttribute('y')).toBe('20');
			expect(el.getAttribute('width')).toBe('50');
		});

		it('overwrites existing attributes', () => {
			const el = document.createElementNS(SVG_NS, 'rect');
			el.setAttribute('x', '0');
			updateElementAttributes(el, { x: '99' });
			expect(el.getAttribute('x')).toBe('99');
		});
	});

	describe('clearElementChildren', () => {
		it('removes all child nodes', () => {
			const parent = document.createElementNS(SVG_NS, 'g');
			parent.appendChild(document.createElementNS(SVG_NS, 'rect'));
			parent.appendChild(document.createElementNS(SVG_NS, 'circle'));
			expect(parent.childNodes).toHaveLength(2);
			clearElementChildren(parent);
			expect(parent.childNodes).toHaveLength(0);
		});

		it('on empty element is a no-op', () => {
			const parent = document.createElementNS(SVG_NS, 'g');
			expect(() => clearElementChildren(parent)).not.toThrow();
			expect(parent.childNodes).toHaveLength(0);
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
