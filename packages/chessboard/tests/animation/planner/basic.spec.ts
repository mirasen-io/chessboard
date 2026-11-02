import { describe, expect, it } from 'vitest';
import { calculateAnimationPlan } from '../../../src/animation/planner.js';
import type { AnimationPlanningInput, AnimationTrack } from '../../../src/animation/types.js';
import { normalizeSquare } from '../../../src/state/board/normalize.js';
import { PieceCode, type Square } from '../../../src/state/board/types/internal.js';
import { makeBoardSnapshot, makeInput, makeSnapshot } from '../../test-utils/animation/fixtures.js';

const e2 = normalizeSquare('e2');
const e4 = normalizeSquare('e4');
const d4 = normalizeSquare('d4');

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

describe('calculateAnimationPlan — basic', () => {
	describe('no change', () => {
		it('returns empty tracks when boards are identical', () => {
			const board = makeBoardSnapshot([[e2, PieceCode.WhitePawn]]);
			const input = makeInput({ previous: { board }, current: { board } });
			const plan = calculateAnimationPlan(input);
			expect(plan.tracks).toHaveLength(0);
			expect(plan.suppressedSquares.size).toBe(0);
		});

		it('returns empty tracks when only turn differs', () => {
			const pieces: Array<[Square, PieceCode]> = [[e2, PieceCode.WhitePawn]];
			const input: AnimationPlanningInput = {
				previous: makeSnapshot({ board: makeBoardSnapshot(pieces, { turn: 0 }) }),
				current: makeSnapshot({ board: makeBoardSnapshot(pieces, { turn: 8 }) })
			};
			const plan = calculateAnimationPlan(input);
			expect(plan.tracks).toHaveLength(0);
			expect(plan.suppressedSquares.size).toBe(0);
		});
	});

	describe('simple piece move', () => {
		it('produces one move track', () => {
			const input = makeInput({
				previous: { board: makeBoardSnapshot([[e2, PieceCode.WhitePawn]]) },
				current: { board: makeBoardSnapshot([[e4, PieceCode.WhitePawn]]) }
			});
			const plan = calculateAnimationPlan(input);
			expect(plan.tracks).toHaveLength(1);
			const t = plan.tracks[0];
			expect(t.effect).toBe('move');
			if (t.effect === 'move') {
				expect(t.fromSq).toBe(e2);
				expect(t.toSq).toBe(e4);
				expect(t.pieceCode).toBe(PieceCode.WhitePawn);
			}
		});

		it('suppressedSquares includes both endpoints', () => {
			const input = makeInput({
				previous: { board: makeBoardSnapshot([[e2, PieceCode.WhitePawn]]) },
				current: { board: makeBoardSnapshot([[e4, PieceCode.WhitePawn]]) }
			});
			const plan = calculateAnimationPlan(input);
			expect(plan.suppressedSquares.has(e2)).toBe(true);
			expect(plan.suppressedSquares.has(e4)).toBe(true);
		});
	});

	describe('piece appearance (fade-in)', () => {
		it('produces a fade-in track', () => {
			const input = makeInput({
				previous: { board: makeBoardSnapshot() },
				current: { board: makeBoardSnapshot([[e4, PieceCode.WhitePawn]]) }
			});
			const plan = calculateAnimationPlan(input);
			expect(plan.tracks).toHaveLength(1);
			expect(plan.tracks[0].effect).toBe('fade-in');
			if (plan.tracks[0].effect === 'fade-in') {
				expect(plan.tracks[0].sq).toBe(e4);
				expect(plan.tracks[0].pieceCode).toBe(PieceCode.WhitePawn);
			}
		});

		it('suppressedSquares includes the square', () => {
			const input = makeInput({
				previous: { board: makeBoardSnapshot() },
				current: { board: makeBoardSnapshot([[e4, PieceCode.WhitePawn]]) }
			});
			const plan = calculateAnimationPlan(input);
			expect(plan.suppressedSquares.has(e4)).toBe(true);
		});
	});

	describe('piece disappearance (fade-out)', () => {
		it('produces a fade-out track', () => {
			const input = makeInput({
				previous: { board: makeBoardSnapshot([[e2, PieceCode.WhitePawn]]) },
				current: { board: makeBoardSnapshot() }
			});
			const plan = calculateAnimationPlan(input);
			expect(plan.tracks).toHaveLength(1);
			expect(plan.tracks[0].effect).toBe('fade-out');
			if (plan.tracks[0].effect === 'fade-out') {
				expect(plan.tracks[0].sq).toBe(e2);
				expect(plan.tracks[0].pieceCode).toBe(PieceCode.WhitePawn);
			}
		});

		it('suppressedSquares includes the square', () => {
			const input = makeInput({
				previous: { board: makeBoardSnapshot([[e2, PieceCode.WhitePawn]]) },
				current: { board: makeBoardSnapshot() }
			});
			const plan = calculateAnimationPlan(input);
			expect(plan.suppressedSquares.has(e2)).toBe(true);
		});
	});

	describe('capture-like transition', () => {
		it('produces move track and fade-out for captured piece of different type', () => {
			const input = makeInput({
				previous: {
					board: makeBoardSnapshot([
						[e2, PieceCode.WhitePawn],
						[e4, PieceCode.BlackKnight]
					])
				},
				current: { board: makeBoardSnapshot([[e4, PieceCode.WhitePawn]]) }
			});
			const plan = calculateAnimationPlan(input);
			expect(findMoveTrack(plan.tracks, e2, e4)).toBeDefined();
			expect(findMoveTrack(plan.tracks, e2, e4)!.pieceCode).toBe(PieceCode.WhitePawn);
			const fo = findFadeTrack(plan.tracks, 'fade-out', e4);
			expect(fo).toBeDefined();
			if (fo && fo.effect === 'fade-out') {
				expect(fo.pieceCode).toBe(PieceCode.BlackKnight);
			}
		});

		it('same-code piece relocation produces a move track', () => {
			const input = makeInput({
				previous: {
					board: makeBoardSnapshot([
						[e2, PieceCode.WhitePawn],
						[d4, PieceCode.WhitePawn]
					])
				},
				current: {
					board: makeBoardSnapshot([
						[e4, PieceCode.WhitePawn],
						[d4, PieceCode.WhitePawn]
					])
				}
			});
			const plan = calculateAnimationPlan(input);
			expect(plan.tracks).toHaveLength(1);
			expect(findMoveTrack(plan.tracks, e2, e4)).toBeDefined();
		});
	});

	describe('track id assignment', () => {
		it('assigns sequential ids starting from 0', () => {
			const input = makeInput({
				previous: {
					board: makeBoardSnapshot([
						[e2, PieceCode.WhitePawn],
						[e4, PieceCode.BlackKnight]
					])
				},
				current: { board: makeBoardSnapshot([[e4, PieceCode.WhitePawn]]) }
			});
			const plan = calculateAnimationPlan(input);
			const ids = plan.tracks.map((t) => t.id).sort((a, b) => a - b);
			expect(ids[0]).toBe(0);
			for (let i = 1; i < ids.length; i++) {
				expect(ids[i]).toBe(ids[i - 1] + 1);
			}
		});
	});
});
