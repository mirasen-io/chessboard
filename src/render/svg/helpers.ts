import { fileOf, rankOf } from '../../state/board/coords.js';
import { Square } from '../../state/board/types/internal.js';

export const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * Helper to compute light/dark square parity.
 * Returns true for light squares, false for dark.
 * Convention: a1 is dark in many sets; here we follow theming from state (renderer decides).
 * If you need the classic pattern where a1 is dark, use: (file + rank) % 2 === 1
 */
export function isLightSquare(sq: Square): boolean {
	const f = fileOf(sq);
	const r = rankOf(sq);
	return ((f + r) & 1) === 1;
}

export type SvgElementNames = keyof SVGElementTagNameMap;

// Helper to create SVG elements with attributes.
// We need to exclude 'id' from generic attributes to enforce its presence for uniqueness in the document.
export type SvgElementAttributes = Record<string, string>;
export type SvgElementWithIdAttributes = SvgElementAttributes & { 'data-chessboard-id': string };
export type SvgElementOtherAttributes = SvgElementAttributes & {
	'data-chessboard-id'?: never;
};

function _updateElementAttributes(element: SVGElement, attrs: SvgElementAttributes): void {
	for (const [key, value] of Object.entries(attrs)) {
		element.setAttribute(key, value);
	}
}

export function createSvgRootElement(
	parent: HTMLElement,
	attrs: SvgElementWithIdAttributes
): SVGSVGElement {
	const doc = parent.ownerDocument;
	const el = doc.createElementNS(SVG_NS, 'svg');
	_updateElementAttributes(el, attrs);
	parent.appendChild(el);
	return el;
}

export function createSvgDefsElement(
	parent: SVGSVGElement,
	attrs: SvgElementWithIdAttributes
): SVGDefsElement {
	const doc = parent.ownerDocument;
	const el = doc.createElementNS(SVG_NS, 'defs');
	_updateElementAttributes(el, attrs);
	// Keep extension-owned defs roots before visual roots.
	const firstNonDefsChild = Array.from(parent.children).find(
		(child) => child.tagName.toLowerCase() !== 'defs'
	);
	parent.insertBefore(el, firstNonDefsChild ?? null);
	return el;
}

export function createSvgElement<K extends Exclude<SvgElementNames, 'svg' | 'defs'>>(
	parent: SVGElement,
	name: K,
	attrs: SvgElementWithIdAttributes
): SVGElementTagNameMap[K] {
	const doc = parent.ownerDocument;
	const el = doc.createElementNS(SVG_NS, name);
	_updateElementAttributes(el, attrs);
	parent.appendChild(el);
	return el;
}

export function updateSvgElementAttributes(
	element: SVGElement,
	attrs: SvgElementOtherAttributes
): void {
	_updateElementAttributes(element, attrs);
}

export function clearSvgElementChildren(element: SVGElement): void {
	while (element.firstChild) {
		element.removeChild(element.firstChild);
	}
}
