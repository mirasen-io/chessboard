import { beforeEach, describe, expect, it } from 'vitest';
import {
	cleanAnimationPlan,
	prepareAnimationPlan,
	renderAnimationPlan
} from '../../../src/animation/render/plan.js';
import type { PieceHrefResolver } from '../../../src/animation/render/types.js';
import type { AnimationPlan, AnimationTrack } from '../../../src/animation/types.js';
import type { SceneRenderGeometry } from '../../../src/layout/geometry/types.js';
import { normalizeSquare } from '../../../src/state/board/normalize.js';
import { PieceCode, type Square } from '../../../src/state/board/types/internal.js';
import {
	createMockGeometry,
	createMockPieceHrefResolver,
	createSvgLayer
} from '../../test-utils/animation/render.js';

const e2 = normalizeSquare('e2');
const e4 = normalizeSquare('e4');
const d4 = normalizeSquare('d4');
const f7 = normalizeSquare('f7');

function makePlan(tracks: AnimationTrack[]): AnimationPlan {
	return { tracks, suppressedSquares: new Set<Square>() };
}

describe('animation render plan', () => {
	let layer: SVGGElement;
	let geometry: SceneRenderGeometry;
	let resolveHref: PieceHrefResolver;

	beforeEach(() => {
		document.body.innerHTML = '';
		layer = createSvgLayer();
		geometry = createMockGeometry(50);
		resolveHref = createMockPieceHrefResolver();
	});

	describe('prepareAnimationPlan', () => {
		it('creates use nodes for a move track', () => {
			const plan = makePlan([
				{ id: 0, effect: 'move', pieceCode: PieceCode.WhitePawn, fromSq: e2, toSq: e4 }
			]);
			const nodes = prepareAnimationPlan(plan, geometry, resolveHref, layer);
			expect(layer.querySelectorAll('use')).toHaveLength(1);
			expect(nodes.size).toBe(1);
			expect(nodes.has(0)).toBe(true);
		});

		it('creates use nodes for fade-in and fade-out tracks', () => {
			const plan = makePlan([
				{ id: 0, effect: 'fade-in', pieceCode: PieceCode.WhiteKnight, sq: e4 },
				{ id: 1, effect: 'fade-out', pieceCode: PieceCode.BlackRook, sq: d4 }
			]);
			const nodes = prepareAnimationPlan(plan, geometry, resolveHref, layer);
			expect(layer.querySelectorAll('use')).toHaveLength(2);
			expect(nodes.size).toBe(2);
			expect(nodes.has(0)).toBe(true);
			expect(nodes.has(1)).toBe(true);
		});

		it('creates use nodes for a static track', () => {
			const plan = makePlan([
				{ id: 0, effect: 'static', pieceCode: PieceCode.BlackBishop, sq: f7 }
			]);
			const nodes = prepareAnimationPlan(plan, geometry, resolveHref, layer);
			expect(layer.querySelectorAll('use')).toHaveLength(1);
			expect(nodes.size).toBe(1);
		});

		it('handles a plan with mixed track types', () => {
			const plan = makePlan([
				{ id: 0, effect: 'move', pieceCode: PieceCode.WhitePawn, fromSq: e2, toSq: e4 },
				{ id: 1, effect: 'fade-in', pieceCode: PieceCode.WhiteKnight, sq: d4 },
				{ id: 2, effect: 'fade-out', pieceCode: PieceCode.BlackQueen, sq: f7 },
				{ id: 3, effect: 'static', pieceCode: PieceCode.BlackKing, sq: e2 }
			]);
			const nodes = prepareAnimationPlan(plan, geometry, resolveHref, layer);
			expect(layer.querySelectorAll('use')).toHaveLength(4);
			expect(nodes.size).toBe(4);
		});

		it('returns an empty map for an empty plan', () => {
			const plan = makePlan([]);
			const nodes = prepareAnimationPlan(plan, geometry, resolveHref, layer);
			expect(nodes.size).toBe(0);
			expect(layer.querySelectorAll('use')).toHaveLength(0);
		});
	});

	describe('renderAnimationPlan', () => {
		it('updates move-track node position on progress change', () => {
			const plan = makePlan([
				{ id: 0, effect: 'move', pieceCode: PieceCode.WhitePawn, fromSq: e2, toSq: e4 }
			]);
			const nodes = prepareAnimationPlan(plan, geometry, resolveHref, layer);
			renderAnimationPlan(nodes, geometry, 1);
			const node = nodes.get(0)!;
			const toRect = geometry.getSquareRect(e4);
			expect(node.root.getAttribute('x')).toBe(toRect.x.toString());
			expect(node.root.getAttribute('y')).toBe(toRect.y.toString());
		});

		it('updates fade-in opacity on progress change', () => {
			const plan = makePlan([
				{ id: 0, effect: 'fade-in', pieceCode: PieceCode.WhiteKnight, sq: e4 }
			]);
			const nodes = prepareAnimationPlan(plan, geometry, resolveHref, layer);
			renderAnimationPlan(nodes, geometry, 0.75);
			const node = nodes.get(0)!;
			expect(node.root.getAttribute('opacity')).toBe('0.75');
		});

		it('updates fade-out opacity on progress change', () => {
			const plan = makePlan([
				{ id: 0, effect: 'fade-out', pieceCode: PieceCode.BlackRook, sq: d4 }
			]);
			const nodes = prepareAnimationPlan(plan, geometry, resolveHref, layer);
			renderAnimationPlan(nodes, geometry, 0.75);
			const node = nodes.get(0)!;
			// fade-out opacity = 1 - progress
			expect(node.root.getAttribute('opacity')).toBe('0.25');
		});

		it('leaves static-track node unchanged', () => {
			const plan = makePlan([
				{ id: 0, effect: 'static', pieceCode: PieceCode.BlackBishop, sq: f7 }
			]);
			const nodes = prepareAnimationPlan(plan, geometry, resolveHref, layer);
			const node = nodes.get(0)!;
			const xBefore = node.root.getAttribute('x');
			const yBefore = node.root.getAttribute('y');
			renderAnimationPlan(nodes, geometry, 0.5);
			expect(node.root.getAttribute('x')).toBe(xBefore);
			expect(node.root.getAttribute('y')).toBe(yBefore);
		});
	});

	describe('cleanAnimationPlan', () => {
		it('removes all use nodes from the DOM', () => {
			const plan = makePlan([
				{ id: 0, effect: 'move', pieceCode: PieceCode.WhitePawn, fromSq: e2, toSq: e4 },
				{ id: 1, effect: 'fade-in', pieceCode: PieceCode.WhiteKnight, sq: d4 },
				{ id: 2, effect: 'static', pieceCode: PieceCode.BlackKing, sq: f7 }
			]);
			const nodes = prepareAnimationPlan(plan, geometry, resolveHref, layer);
			expect(layer.querySelectorAll('use')).toHaveLength(3);
			cleanAnimationPlan(nodes);
			expect(layer.querySelectorAll('use')).toHaveLength(0);
		});

		it('clears the node map', () => {
			const plan = makePlan([
				{ id: 0, effect: 'move', pieceCode: PieceCode.WhitePawn, fromSq: e2, toSq: e4 }
			]);
			const nodes = prepareAnimationPlan(plan, geometry, resolveHref, layer);
			expect(nodes.size).toBe(1);
			cleanAnimationPlan(nodes);
			expect(nodes.size).toBe(0);
		});
	});

	describe('unsupported effect', () => {
		it('prepareAnimationPlan throws RangeError for unsupported effect', () => {
			const plan = makePlan([
				{
					id: 0,
					effect: 'unknown' as never,
					pieceCode: PieceCode.WhitePawn,
					sq: e4
				} as unknown as AnimationTrack
			]);
			expect(() => prepareAnimationPlan(plan, geometry, resolveHref, layer)).toThrow(RangeError);
		});
	});
});
