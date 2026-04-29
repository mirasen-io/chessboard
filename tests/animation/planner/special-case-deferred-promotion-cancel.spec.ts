import { describe, expect, it } from 'vitest';
import { calculateAnimationPlan } from '../../../src/animation/planner.js';
import type { AnimationPlanningInput, AnimationTrack } from '../../../src/animation/types.js';
import { normalizeSquare } from '../../../src/state/board/normalize.js';
import { PieceCode, RoleCode, type Square } from '../../../src/state/board/types/internal.js';
import {
	makeBoardSnapshot,
	makeChangeSnapshot,
	makeSnapshot
} from '../../test-utils/animation/fixtures.js';

const e2 = normalizeSquare('e2');
const d8 = normalizeSquare('d8');
const e8 = normalizeSquare('e8');
const f7 = normalizeSquare('f7');
const f8 = normalizeSquare('f8');

function findMoveTrack(
	tracks: readonly AnimationTrack[],
	from: Square,
	to: Square,
	piece?: PieceCode
) {
	return tracks.find(
		(t) =>
			t.effect === 'move' &&
			t.fromSq === from &&
			t.toSq === to &&
			(piece === undefined || t.pieceCode === piece)
	);
}

function findFadeTrack(
	tracks: readonly AnimationTrack[],
	effect: 'fade-in' | 'fade-out',
	sq: Square,
	piece?: PieceCode
) {
	return tracks.find(
		(t) => t.effect === effect && t.sq === sq && (piece === undefined || t.pieceCode === piece)
	);
}

describe('calculateAnimationPlan — special cases', () => {
	describe('regression: cancelling deferred promotion after earlier promotion', () => {
		const regressionBoard = () =>
			makeBoardSnapshot([
				[f8, PieceCode.WhiteQueen],
				[e2, PieceCode.WhitePawn]
			]);
		const staleLastMove = {
			from: f7,
			to: f8,
			piece: PieceCode.WhitePawn as const,
			promotedTo: RoleCode.Queen as const
		};

		it('must not animate pawn toward old promoted square when deferred move is cancelled', () => {
			const prevBoard = regressionBoard();
			const currBoard = regressionBoard();
			const input: AnimationPlanningInput = {
				previous: makeSnapshot({
					board: prevBoard,
					change: makeChangeSnapshot({
						lastMove: staleLastMove,
						deferredUIMoveRequest: {
							status: 'unresolved',
							sourceSquare: e2,
							destination: { to: e8 },
							canBeAutoResolved: false,
							resolvedMoveRequest: null
						}
					})
				}),
				current: makeSnapshot({
					board: currBoard,
					change: makeChangeSnapshot({ lastMove: staleLastMove })
				})
			};
			const plan = calculateAnimationPlan(input);
			// No pawn move toward old promoted square
			expect(findMoveTrack(plan.tracks, e8, f8, PieceCode.WhitePawn)).toBeUndefined();
			// Pawn returns from projected target back to source
			const returnTrack = findMoveTrack(plan.tracks, e8, e2, PieceCode.WhitePawn);
			expect(returnTrack).toBeDefined();
			// f8 not incorrectly suppressed by stale promotion normalization
			expect(plan.suppressedSquares.has(f8)).toBe(false);
		});

		it('must not animate pawn toward old promoted square with capture-style deferred move', () => {
			const prevBoard = regressionBoard();
			const currBoard = regressionBoard();
			const input: AnimationPlanningInput = {
				previous: makeSnapshot({
					board: prevBoard,
					change: makeChangeSnapshot({
						lastMove: staleLastMove,
						deferredUIMoveRequest: {
							status: 'unresolved',
							sourceSquare: e2,
							destination: { to: d8 },
							canBeAutoResolved: false,
							resolvedMoveRequest: null
						}
					})
				}),
				current: makeSnapshot({
					board: currBoard,
					change: makeChangeSnapshot({ lastMove: staleLastMove })
				})
			};
			const plan = calculateAnimationPlan(input);
			// No pawn move toward old promoted square
			expect(findMoveTrack(plan.tracks, d8, f8, PieceCode.WhitePawn)).toBeUndefined();
			// Pawn returns from projected target back to source
			const returnTrack = findMoveTrack(plan.tracks, d8, e2, PieceCode.WhitePawn);
			expect(returnTrack).toBeDefined();
			// f8 not incorrectly suppressed by stale promotion normalization
			expect(plan.suppressedSquares.has(f8)).toBe(false);
		});

		it('same-target edge-case: deferred pawn targets same square as old promotion', () => {
			// The deferred move projects the pawn onto f8 itself (replacing the queen
			// in effective-previous). On cancel the pawn must return f8->e2; the old
			// promoted lastMove must NOT be treated as a resolution of that projection.
			const prevBoard = regressionBoard();
			const currBoard = regressionBoard();
			const input: AnimationPlanningInput = {
				previous: makeSnapshot({
					board: prevBoard,
					change: makeChangeSnapshot({
						lastMove: staleLastMove,
						deferredUIMoveRequest: {
							status: 'unresolved',
							sourceSquare: e2,
							destination: { to: f8 },
							canBeAutoResolved: false,
							resolvedMoveRequest: null
						}
					})
				}),
				current: makeSnapshot({
					board: currBoard,
					change: makeChangeSnapshot({ lastMove: staleLastMove })
				})
			};
			const plan = calculateAnimationPlan(input);
			// Cancelled pawn returns from f8 to e2
			const returnTrack = findMoveTrack(plan.tracks, f8, e2, PieceCode.WhitePawn);
			expect(returnTrack).toBeDefined();
			// No pawn fade-in at e2 (handled by move track)
			expect(findFadeTrack(plan.tracks, 'fade-in', e2, PieceCode.WhitePawn)).toBeUndefined();
		});
	});
});
