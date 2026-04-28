import { beforeEach, describe, expect, it } from 'vitest';
import {
	cleanStaticTrack,
	prepareStaticTrack,
	renderStaticTrack
} from '../../../src/animation/render/static.js';
import type { AnimationTrackStatic } from '../../../src/animation/types.js';
import type { PieceUrls } from '../../../src/extensions/first-party/main-renderer/types/internal.js';
import type { SceneRenderGeometry } from '../../../src/layout/geometry/types.js';
import { normalizeSquare } from '../../../src/state/board/normalize.js';
import { PieceCode } from '../../../src/state/board/types/internal.js';
import {
	createMockGeometry,
	createMockPieceUrls,
	createSvgLayer
} from '../../test-utils/animation/render.js';

const e4 = normalizeSquare('e4');

function makeStaticTrack(overrides: Partial<AnimationTrackStatic> = {}): AnimationTrackStatic {
	return {
		id: overrides.id ?? 0,
		pieceCode: overrides.pieceCode ?? PieceCode.WhitePawn,
		sq: overrides.sq ?? e4,
		effect: 'static'
	};
}

describe('static render track', () => {
	let layer: SVGElement;
	let geometry: SceneRenderGeometry;
	let pieceUrls: PieceUrls;

	beforeEach(() => {
		document.body.innerHTML = '';
		layer = createSvgLayer();
		geometry = createMockGeometry(50);
		pieceUrls = createMockPieceUrls();
	});

	describe('prepareStaticTrack', () => {
		it('appends an SVG image element to the layer', () => {
			const track = makeStaticTrack();
			prepareStaticTrack(track, geometry, pieceUrls, layer);
			expect(layer.querySelectorAll('image')).toHaveLength(1);
		});

		it('positions the image at the track square rect', () => {
			const track = makeStaticTrack({ sq: e4 });
			const node = prepareStaticTrack(track, geometry, pieceUrls, layer);
			const rect = geometry.getSquareRect(e4);
			expect(node.root.getAttribute('x')).toBe(rect.x.toString());
			expect(node.root.getAttribute('y')).toBe(rect.y.toString());
		});

		it('sets width and height from geometry square size', () => {
			const track = makeStaticTrack();
			const node = prepareStaticTrack(track, geometry, pieceUrls, layer);
			expect(node.root.getAttribute('width')).toBe('50');
			expect(node.root.getAttribute('height')).toBe('50');
		});

		it('sets href to the piece URL for the track piece code', () => {
			const track = makeStaticTrack({ pieceCode: PieceCode.BlackBishop });
			const node = prepareStaticTrack(track, geometry, pieceUrls, layer);
			expect(node.root.getAttribute('href')).toBe('http://test/bB.svg');
		});

		it('returns a PreparedStaticNode with the track fields and root element', () => {
			const track = makeStaticTrack({ id: 3, pieceCode: PieceCode.WhiteKing });
			const node = prepareStaticTrack(track, geometry, pieceUrls, layer);
			expect(node.id).toBe(3);
			expect(node.pieceCode).toBe(PieceCode.WhiteKing);
			expect(node.sq).toBe(e4);
			expect(node.effect).toBe('static');
			expect(node.root).toBeInstanceOf(Element);
		});
	});

	describe('renderStaticTrack', () => {
		it('is a no-op: does not change position or attributes', () => {
			const track = makeStaticTrack();
			const node = prepareStaticTrack(track, geometry, pieceUrls, layer);
			const xBefore = node.root.getAttribute('x');
			const yBefore = node.root.getAttribute('y');
			const hrefBefore = node.root.getAttribute('href');
			renderStaticTrack(node);
			expect(node.root.getAttribute('x')).toBe(xBefore);
			expect(node.root.getAttribute('y')).toBe(yBefore);
			expect(node.root.getAttribute('href')).toBe(hrefBefore);
		});
	});

	describe('cleanStaticTrack', () => {
		it('removes the image node from the DOM', () => {
			const track = makeStaticTrack();
			const node = prepareStaticTrack(track, geometry, pieceUrls, layer);
			expect(layer.querySelectorAll('image')).toHaveLength(1);
			cleanStaticTrack(node);
			expect(layer.querySelectorAll('image')).toHaveLength(0);
		});
	});
});
