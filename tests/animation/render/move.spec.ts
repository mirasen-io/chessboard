import { beforeEach, describe, expect, it } from 'vitest';
import {
	cleanMoveTrack,
	prepareMoveTrack,
	renderMoveTrack
} from '../../../src/animation/render/move.js';
import type { AnimationTrackMove } from '../../../src/animation/types.js';
import type { PieceUrls } from '../../../src/extensions/first-party/main-renderer/types/internal.js';
import type { SceneRenderGeometry } from '../../../src/layout/geometry/types.js';
import { normalizeSquare } from '../../../src/state/board/normalize.js';
import { PieceCode } from '../../../src/state/board/types/internal.js';
import {
	createMockGeometry,
	createMockPieceUrls,
	createSvgLayer
} from '../../test-utils/animation/render.js';

const e2 = normalizeSquare('e2');
const e4 = normalizeSquare('e4');

function makeTrack(overrides: Partial<AnimationTrackMove> = {}): AnimationTrackMove {
	return {
		id: overrides.id ?? 0,
		pieceCode: overrides.pieceCode ?? PieceCode.WhitePawn,
		fromSq: overrides.fromSq ?? e2,
		toSq: overrides.toSq ?? e4,
		effect: 'move'
	};
}

describe('move render track', () => {
	let layer: SVGElement;
	let geometry: SceneRenderGeometry;
	let pieceUrls: PieceUrls;

	beforeEach(() => {
		document.body.innerHTML = '';
		layer = createSvgLayer();
		geometry = createMockGeometry(50);
		pieceUrls = createMockPieceUrls();
	});

	describe('prepareMoveTrack', () => {
		it('appends an SVG image element to the layer', () => {
			const track = makeTrack();
			prepareMoveTrack(track, geometry, pieceUrls, layer);
			const images = layer.querySelectorAll('image');
			expect(images).toHaveLength(1);
		});

		it('positions the image at the source square rect', () => {
			const track = makeTrack({ fromSq: e2 });
			const node = prepareMoveTrack(track, geometry, pieceUrls, layer);
			const fromRect = geometry.getSquareRect(e2);
			expect(node.root.getAttribute('x')).toBe(fromRect.x.toString());
			expect(node.root.getAttribute('y')).toBe(fromRect.y.toString());
		});

		it('sets width and height from geometry square size', () => {
			const track = makeTrack();
			const node = prepareMoveTrack(track, geometry, pieceUrls, layer);
			expect(node.root.getAttribute('width')).toBe('50');
			expect(node.root.getAttribute('height')).toBe('50');
		});

		it('sets href to the piece URL for the track piece code', () => {
			const track = makeTrack({ pieceCode: PieceCode.BlackKnight });
			const node = prepareMoveTrack(track, geometry, pieceUrls, layer);
			expect(node.root.getAttribute('href')).toBe('http://test/bN.svg');
		});

		it('returns a PreparedMoveNode with the track fields and root element', () => {
			const track = makeTrack({ id: 7, pieceCode: PieceCode.WhiteRook });
			const node = prepareMoveTrack(track, geometry, pieceUrls, layer);
			expect(node.id).toBe(7);
			expect(node.pieceCode).toBe(PieceCode.WhiteRook);
			expect(node.fromSq).toBe(e2);
			expect(node.toSq).toBe(e4);
			expect(node.effect).toBe('move');
			expect(node.root).toBeInstanceOf(Element);
		});
	});

	describe('renderMoveTrack', () => {
		it('at progress 0 the image stays at the source square', () => {
			const track = makeTrack({ fromSq: e2, toSq: e4 });
			const node = prepareMoveTrack(track, geometry, pieceUrls, layer);
			renderMoveTrack(node, geometry, 0);
			const fromRect = geometry.getSquareRect(e2);
			expect(node.root.getAttribute('x')).toBe(fromRect.x.toString());
			expect(node.root.getAttribute('y')).toBe(fromRect.y.toString());
		});

		it('at progress 1 the image moves to the target square', () => {
			const track = makeTrack({ fromSq: e2, toSq: e4 });
			const node = prepareMoveTrack(track, geometry, pieceUrls, layer);
			renderMoveTrack(node, geometry, 1);
			const toRect = geometry.getSquareRect(e4);
			expect(node.root.getAttribute('x')).toBe(toRect.x.toString());
			expect(node.root.getAttribute('y')).toBe(toRect.y.toString());
		});

		it('at progress 0.5 the image is halfway between source and target', () => {
			const track = makeTrack({ fromSq: e2, toSq: e4 });
			const node = prepareMoveTrack(track, geometry, pieceUrls, layer);
			renderMoveTrack(node, geometry, 0.5);
			const fromRect = geometry.getSquareRect(e2);
			const toRect = geometry.getSquareRect(e4);
			const expectedX = fromRect.x + (toRect.x - fromRect.x) * 0.5;
			const expectedY = fromRect.y + (toRect.y - fromRect.y) * 0.5;
			expect(node.root.getAttribute('x')).toBe(expectedX.toString());
			expect(node.root.getAttribute('y')).toBe(expectedY.toString());
		});
	});

	describe('cleanMoveTrack', () => {
		it('removes the image node from the DOM', () => {
			const track = makeTrack();
			const node = prepareMoveTrack(track, geometry, pieceUrls, layer);
			expect(layer.querySelectorAll('image')).toHaveLength(1);
			cleanMoveTrack(node);
			expect(layer.querySelectorAll('image')).toHaveLength(0);
		});
	});
});
