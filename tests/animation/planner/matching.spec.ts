import { describe, expect, it } from 'vitest';
import { calculateAnimationPlan } from '../../../src/animation/planner.js';
import type { AnimationTrack } from '../../../src/animation/types.js';
import { normalizeSquare } from '../../../src/state/board/normalize.js';
import { PieceCode, type Square } from '../../../src/state/board/types/internal.js';
import { makeBoardSnapshot, makeInput } from '../../test-utils/animation/fixtures.js';

const e1 = normalizeSquare('e1');
const e2 = normalizeSquare('e2');
const e4 = normalizeSquare('e4');
const e5 = normalizeSquare('e5');
const e7 = normalizeSquare('e7');
const g1 = normalizeSquare('g1');
const h1 = normalizeSquare('h1');
const f1 = normalizeSquare('f1');

function findMoveTrack(tracks: readonly AnimationTrack[], from: Square, to: Square) {
	return tracks.find((t) => t.effect === 'move' && t.fromSq === from && t.toSq === to);
}

function findFadeTrack(
	tracks: readonly AnimationTrack[],
	effect: 'fade-in' | 'fade-out',
	sq: Square
) {
	return tracks.find((t) => t.effect === effect && t.sq === sq);
}

describe('calculateAnimationPlan — matching', () => {
	describe('greedy nearest matching', () => {
		it('matches nearest same-code pair', () => {
			const input = makeInput({
				previous: {
					board: makeBoardSnapshot([
						[e2, PieceCode.WhitePawn],
						[e7, PieceCode.WhitePawn]
					])
				},
				current: {
					board: makeBoardSnapshot([
						[e4, PieceCode.WhitePawn],
						[e5, PieceCode.WhitePawn]
					])
				}
			});
			const plan = calculateAnimationPlan(input);
			expect(plan.tracks).toHaveLength(2);
			expect(findMoveTrack(plan.tracks, e2, e4)).toBeDefined();
			expect(findMoveTrack(plan.tracks, e7, e5)).toBeDefined();
		});

		it('does not match different piece codes', () => {
			const input = makeInput({
				previous: { board: makeBoardSnapshot([[e2, PieceCode.WhitePawn]]) },
				current: { board: makeBoardSnapshot([[e4, PieceCode.BlackPawn]]) }
			});
			const plan = calculateAnimationPlan(input);
			expect(plan.tracks.filter((t) => t.effect === 'move')).toHaveLength(0);
			expect(findFadeTrack(plan.tracks, 'fade-out', e2)).toBeDefined();
			expect(findFadeTrack(plan.tracks, 'fade-in', e4)).toBeDefined();
		});
	});

	describe('multiple pieces moving (castling-like)', () => {
		it('produces two move tracks for two pieces relocating', () => {
			const input = makeInput({
				previous: {
					board: makeBoardSnapshot([
						[e1, PieceCode.WhiteKing],
						[h1, PieceCode.WhiteRook]
					])
				},
				current: {
					board: makeBoardSnapshot([
						[g1, PieceCode.WhiteKing],
						[f1, PieceCode.WhiteRook]
					])
				}
			});
			const plan = calculateAnimationPlan(input);
			expect(plan.tracks).toHaveLength(2);
			expect(findMoveTrack(plan.tracks, e1, g1)).toBeDefined();
			expect(findMoveTrack(plan.tracks, h1, f1)).toBeDefined();
		});

		it('suppressedSquares includes all four endpoints', () => {
			const input = makeInput({
				previous: {
					board: makeBoardSnapshot([
						[e1, PieceCode.WhiteKing],
						[h1, PieceCode.WhiteRook]
					])
				},
				current: {
					board: makeBoardSnapshot([
						[g1, PieceCode.WhiteKing],
						[f1, PieceCode.WhiteRook]
					])
				}
			});
			const plan = calculateAnimationPlan(input);
			expect(plan.suppressedSquares.has(e1)).toBe(true);
			expect(plan.suppressedSquares.has(g1)).toBe(true);
			expect(plan.suppressedSquares.has(h1)).toBe(true);
			expect(plan.suppressedSquares.has(f1)).toBe(true);
		});
	});
});
