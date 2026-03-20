export const SVG_NS = 'http://www.w3.org/2000/svg';

export function createSvgGroup(doc: Document, attrs: { [key: string]: string }): SVGGElement {
	const el = doc.createElementNS(SVG_NS, 'g');
	for (const [key, value] of Object.entries(attrs)) {
		el.setAttribute(key, value);
	}
	return el;
}
