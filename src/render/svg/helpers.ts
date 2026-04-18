import { fileOf, rankOf } from '../../state/board/coords';
import { Square } from '../../state/board/types/internal';

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
export type SvgElementOtherAttributes = SvgElementAttributes;
export type SvgElementWithIdAttributes = SvgElementAttributes & { 'data-chessboard-id': string };

export function createSvgElement<K extends SvgElementNames>(
	parentOrDoc: Element | Document,
	name: K,
	attrs: SvgElementWithIdAttributes
): SVGElementTagNameMap[K] {
	const doc = parentOrDoc instanceof Document ? parentOrDoc : parentOrDoc.ownerDocument;
	const el = doc.createElementNS(SVG_NS, name);
	for (const [key, value] of Object.entries(attrs)) {
		el.setAttribute(key, value);
	}
	if (parentOrDoc instanceof Element) {
		parentOrDoc.appendChild(el);
	}
	return el;
}

export function updateElementAttributes(element: Element, attrs: SvgElementOtherAttributes): void {
	for (const [key, value] of Object.entries(attrs)) {
		element.setAttribute(key, value);
	}
}

export function clearElementChildren(element: Element): void {
	while (element.firstChild) {
		element.removeChild(element.firstChild);
	}
}
