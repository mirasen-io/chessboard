import { describe, expect, it } from 'vitest';
import {
	createPieceSymbolResolver,
	ensurePieceSymbolsDefined
} from '../../../../src/extensions/first-party/main-renderer/piece-symbols.js';
import { clearSvgElementChildren, SVG_NS } from '../../../../src/render/svg/helpers.js';
import { createSvgIdResolver } from '../../../../src/render/svg/ids.js';
import {
	ALL_NON_EMPTY_PIECE_CODES,
	PieceCode
} from '../../../../src/state/board/types/internal.js';
import { createTestPieceUrls } from '../../../test-utils/extensions/first-party/main-renderer/pieces.js';

const pieceUrls = createTestPieceUrls();

function createDefs(): SVGDefsElement {
	const svg = document.createElementNS(SVG_NS, 'svg');
	document.body.appendChild(svg);
	const defs = document.createElementNS(SVG_NS, 'defs');
	svg.appendChild(defs);
	return defs as SVGDefsElement;
}

describe('createPieceSymbolResolver', () => {
	it('returns a resolver with getId and getHref methods', () => {
		const svgIds = createSvgIdResolver();
		const resolver = createPieceSymbolResolver(svgIds);
		expect(typeof resolver.getId).toBe('function');
		expect(typeof resolver.getHref).toBe('function');
	});

	it('getHref returns # prefixed symbol id using SvgIdResolver', () => {
		const svgIds = createSvgIdResolver();
		const resolver = createPieceSymbolResolver(svgIds);
		const href = resolver.getHref(PieceCode.WhiteKing);
		expect(href).toBe(`#${svgIds.prefix}-renderer-p${PieceCode.WhiteKing}`);
	});

	it('getId returns symbol id using SvgIdResolver', () => {
		const svgIds = createSvgIdResolver();
		const resolver = createPieceSymbolResolver(svgIds);
		const id = resolver.getId(PieceCode.WhiteKing);
		expect(id).toBe(`${svgIds.prefix}-renderer-p${PieceCode.WhiteKing}`);
	});

	it('getHref is safe to pass as a bare callback', () => {
		const svgIds = createSvgIdResolver();
		const resolver = createPieceSymbolResolver(svgIds);
		const fn = resolver.getHref;
		expect(fn(PieceCode.BlackQueen)).toBe(`#${svgIds.prefix}-renderer-p${PieceCode.BlackQueen}`);
	});

	it('two resolvers with different SvgIdResolvers produce non-colliding ids', () => {
		const svgIds1 = createSvgIdResolver();
		const svgIds2 = createSvgIdResolver();
		const r1 = createPieceSymbolResolver(svgIds1);
		const r2 = createPieceSymbolResolver(svgIds2);

		const id1 = r1.getId(PieceCode.WhiteKing);
		const id2 = r2.getId(PieceCode.WhiteKing);
		expect(id1).not.toBe(id2);
	});

	it('two resolvers with different SvgIdResolvers produce non-colliding hrefs', () => {
		const svgIds1 = createSvgIdResolver();
		const svgIds2 = createSvgIdResolver();
		const r1 = createPieceSymbolResolver(svgIds1);
		const r2 = createPieceSymbolResolver(svgIds2);

		const href1 = r1.getHref(PieceCode.BlackQueen);
		const href2 = r2.getHref(PieceCode.BlackQueen);
		expect(href1).not.toBe(href2);
	});

	it('href starts with # followed by the id', () => {
		const svgIds = createSvgIdResolver();
		const resolver = createPieceSymbolResolver(svgIds);
		for (const pieceCode of ALL_NON_EMPTY_PIECE_CODES) {
			expect(resolver.getHref(pieceCode)).toBe(`#${resolver.getId(pieceCode)}`);
		}
	});
});

describe('ensurePieceSymbolsDefined', () => {
	it('creates 12 symbol elements in defs', () => {
		const defs = createDefs();
		const svgIds = createSvgIdResolver();
		const resolver = createPieceSymbolResolver(svgIds);
		ensurePieceSymbolsDefined(defs, pieceUrls, resolver);
		expect(defs.children).toHaveLength(12);
	});

	it('symbols are direct children of defs', () => {
		const defs = createDefs();
		const svgIds = createSvgIdResolver();
		const resolver = createPieceSymbolResolver(svgIds);
		ensurePieceSymbolsDefined(defs, pieceUrls, resolver);
		for (const child of Array.from(defs.children)) {
			expect(child.parentElement).toBe(defs);
			expect(child.tagName).toBe('symbol');
		}
	});

	it('symbols do not carry data-chessboard-extension-id (per-extension defs owns them)', () => {
		const defs = createDefs();
		const svgIds = createSvgIdResolver();
		const resolver = createPieceSymbolResolver(svgIds);
		ensurePieceSymbolsDefined(defs, pieceUrls, resolver);
		for (const child of Array.from(defs.children)) {
			expect(child.hasAttribute('data-chessboard-extension-id')).toBe(false);
		}
	});

	it('each symbol has data-chessboard-id="piece-symbol-{pieceCode}"', () => {
		const defs = createDefs();
		const svgIds = createSvgIdResolver();
		const resolver = createPieceSymbolResolver(svgIds);
		ensurePieceSymbolsDefined(defs, pieceUrls, resolver);
		for (const pieceCode of ALL_NON_EMPTY_PIECE_CODES) {
			const symbol = defs.querySelector(`[data-chessboard-id="piece-symbol-${pieceCode}"]`);
			expect(symbol).not.toBeNull();
		}
	});

	it('each symbol has viewBox="0 0 1 1"', () => {
		const defs = createDefs();
		const svgIds = createSvgIdResolver();
		const resolver = createPieceSymbolResolver(svgIds);
		ensurePieceSymbolsDefined(defs, pieceUrls, resolver);
		for (const child of Array.from(defs.children)) {
			expect(child.getAttribute('viewBox')).toBe('0 0 1 1');
		}
	});

	it('each symbol has an id matching the resolver getId pattern', () => {
		const defs = createDefs();
		const svgIds = createSvgIdResolver();
		const resolver = createPieceSymbolResolver(svgIds);
		ensurePieceSymbolsDefined(defs, pieceUrls, resolver);
		for (const pieceCode of ALL_NON_EMPTY_PIECE_CODES) {
			const expectedId = resolver.getId(pieceCode);
			const symbol = defs.querySelector(`#${expectedId}`);
			expect(symbol).not.toBeNull();
		}
	});

	it('symbol child image uses x=0, y=0, width=1, height=1', () => {
		const defs = createDefs();
		const svgIds = createSvgIdResolver();
		const resolver = createPieceSymbolResolver(svgIds);
		ensurePieceSymbolsDefined(defs, pieceUrls, resolver);
		for (const child of Array.from(defs.children)) {
			const image = child.querySelector('image');
			expect(image).not.toBeNull();
			expect(image!.getAttribute('x')).toBe('0');
			expect(image!.getAttribute('y')).toBe('0');
			expect(image!.getAttribute('width')).toBe('1');
			expect(image!.getAttribute('height')).toBe('1');
		}
	});

	it('symbol child image has correct href from piece URLs config', () => {
		const defs = createDefs();
		const svgIds = createSvgIdResolver();
		const resolver = createPieceSymbolResolver(svgIds);
		ensurePieceSymbolsDefined(defs, pieceUrls, resolver);
		for (const pieceCode of ALL_NON_EMPTY_PIECE_CODES) {
			const symbol = defs.querySelector(`[data-chessboard-id="piece-symbol-${pieceCode}"]`);
			const image = symbol!.querySelector('image');
			expect(image!.getAttribute('href')).toBe(pieceUrls[pieceCode]);
		}
	});

	it('repeated calls do not duplicate symbols (idempotent)', () => {
		const defs = createDefs();
		const svgIds = createSvgIdResolver();
		const resolver = createPieceSymbolResolver(svgIds);
		ensurePieceSymbolsDefined(defs, pieceUrls, resolver);
		ensurePieceSymbolsDefined(defs, pieceUrls, resolver);
		ensurePieceSymbolsDefined(defs, pieceUrls, resolver);
		expect(defs.children).toHaveLength(12);
	});

	it('clearSvgElementChildren removes all symbols from defs', () => {
		const defs = createDefs();
		const svgIds = createSvgIdResolver();
		const resolver = createPieceSymbolResolver(svgIds);
		ensurePieceSymbolsDefined(defs, pieceUrls, resolver);
		expect(defs.children).toHaveLength(12);

		clearSvgElementChildren(defs);
		expect(defs.children).toHaveLength(0);
	});
});
