import { beforeEach, describe, expect, it } from 'vitest';
import {
	cleanFadeTrack,
	prepareFadeTrack,
	renderFadeTrack
} from '../../../src/animation/render/fade.js';
import type { AnimationTrackFade } from '../../../src/animation/types.js';
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

function makeFadeTrack(
	effect: 'fade-in' | 'fade-out',
	overrides: Partial<AnimationTrackFade> = {}
): AnimationTrackFade {
	return {
		id: overrides.id ?? 0,
		pieceCode: overrides.pieceCode ?? PieceCode.WhitePawn,
		sq: overrides.sq ?? e4,
		effect
	};
}

describe('fade render track', () => {
	let layer: SVGElement;
	let geometry: SceneRenderGeometry;
	let pieceUrls: PieceUrls;

	beforeEach(() => {
		document.body.innerHTML = '';
		layer = createSvgLayer();
		geometry = createMockGeometry(50);
		pieceUrls = createMockPieceUrls();
	});

	describe('prepareFadeTrack', () => {
		it('fade-in appends an SVG image element to the layer', () => {
			const track = makeFadeTrack('fade-in');
			prepareFadeTrack(track, geometry, pieceUrls, layer);
			expect(layer.querySelectorAll('image')).toHaveLength(1);
		});

		it('fade-in starts with opacity 0', () => {
			const track = makeFadeTrack('fade-in');
			const node = prepareFadeTrack(track, geometry, pieceUrls, layer);
			expect(node.root.getAttribute('opacity')).toBe('0');
		});

		it('fade-out appends an SVG image element to the layer', () => {
			const track = makeFadeTrack('fade-out');
			prepareFadeTrack(track, geometry, pieceUrls, layer);
			expect(layer.querySelectorAll('image')).toHaveLength(1);
		});

		it('fade-out starts with opacity 1', () => {
			const track = makeFadeTrack('fade-out');
			const node = prepareFadeTrack(track, geometry, pieceUrls, layer);
			expect(node.root.getAttribute('opacity')).toBe('1');
		});

		it('positions the image at the track square rect', () => {
			const track = makeFadeTrack('fade-in', { sq: e4 });
			const node = prepareFadeTrack(track, geometry, pieceUrls, layer);
			const rect = geometry.getSquareRect(e4);
			expect(node.root.getAttribute('x')).toBe(rect.x.toString());
			expect(node.root.getAttribute('y')).toBe(rect.y.toString());
		});

		it('sets width and height from geometry square size', () => {
			const track = makeFadeTrack('fade-in');
			const node = prepareFadeTrack(track, geometry, pieceUrls, layer);
			expect(node.root.getAttribute('width')).toBe('50');
			expect(node.root.getAttribute('height')).toBe('50');
		});

		it('sets href to the piece URL for the track piece code', () => {
			const track = makeFadeTrack('fade-in', { pieceCode: PieceCode.BlackQueen });
			const node = prepareFadeTrack(track, geometry, pieceUrls, layer);
			expect(node.root.getAttribute('href')).toBe('http://test/bQ.svg');
		});
	});

	describe('renderFadeTrack', () => {
		it('fade-in at progress 0 has opacity 0', () => {
			const track = makeFadeTrack('fade-in');
			const node = prepareFadeTrack(track, geometry, pieceUrls, layer);
			renderFadeTrack(node, 0);
			expect(node.root.getAttribute('opacity')).toBe('0');
		});

		it('fade-in at progress 0.5 has opacity 0.5', () => {
			const track = makeFadeTrack('fade-in');
			const node = prepareFadeTrack(track, geometry, pieceUrls, layer);
			renderFadeTrack(node, 0.5);
			expect(node.root.getAttribute('opacity')).toBe('0.5');
		});

		it('fade-in at progress 1 has opacity 1', () => {
			const track = makeFadeTrack('fade-in');
			const node = prepareFadeTrack(track, geometry, pieceUrls, layer);
			renderFadeTrack(node, 1);
			expect(node.root.getAttribute('opacity')).toBe('1');
		});

		it('fade-out at progress 0 has opacity 1', () => {
			const track = makeFadeTrack('fade-out');
			const node = prepareFadeTrack(track, geometry, pieceUrls, layer);
			renderFadeTrack(node, 0);
			expect(node.root.getAttribute('opacity')).toBe('1');
		});

		it('fade-out at progress 0.5 has opacity 0.5', () => {
			const track = makeFadeTrack('fade-out');
			const node = prepareFadeTrack(track, geometry, pieceUrls, layer);
			renderFadeTrack(node, 0.5);
			expect(node.root.getAttribute('opacity')).toBe('0.5');
		});

		it('fade-out at progress 1 has opacity 0', () => {
			const track = makeFadeTrack('fade-out');
			const node = prepareFadeTrack(track, geometry, pieceUrls, layer);
			renderFadeTrack(node, 1);
			expect(node.root.getAttribute('opacity')).toBe('0');
		});
	});

	describe('cleanFadeTrack', () => {
		it('removes the image node from the DOM', () => {
			const track = makeFadeTrack('fade-in');
			const node = prepareFadeTrack(track, geometry, pieceUrls, layer);
			expect(layer.querySelectorAll('image')).toHaveLength(1);
			cleanFadeTrack(node);
			expect(layer.querySelectorAll('image')).toHaveLength(0);
		});
	});
});
