const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * Creates an SVG element of the given tag name using the SVG namespace.
 */
export function createSvgElement<K extends keyof SVGElementTagNameMap>(
	tagName: K
): SVGElementTagNameMap[K] {
	return document.createElementNS(SVG_NS, tagName);
}

/**
 * Queries a single element by its exact `data-chessboard-id` attribute value.
 * Uses getAttribute filtering to avoid fragile CSS selector interpolation.
 */
export function queryByDataChessboardId(root: Element, id: string): Element | null {
	for (const el of Array.from(root.querySelectorAll('[data-chessboard-id]'))) {
		if (el.getAttribute('data-chessboard-id') === id) {
			return el;
		}
	}
	return null;
}

/**
 * Queries all elements whose `data-chessboard-id` attribute starts with the given prefix.
 * Uses getAttribute filtering to avoid fragile CSS selector interpolation.
 */
export function queryAllByDataChessboardIdPrefix(root: Element, prefix: string): Element[] {
	const results: Element[] = [];
	for (const el of Array.from(root.querySelectorAll('[data-chessboard-id]'))) {
		const value = el.getAttribute('data-chessboard-id');
		if (value !== null && value.startsWith(prefix)) {
			results.push(el);
		}
	}
	return results;
}
