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

const d7 = normalizeSquare('d7');
const d8 = normalizeSquare('d8');

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
	describe('deferred UI move normalization', () => {
		it('incorporates deferred pawn move into effective board for planning', () => {
			const input: AnimationPlanningInput = {
				previous: makeSnapshot({ board: makeBoardSnapshot([[d7, PieceCode.BlackPawn]]) }),
				current: makeSnapshot({
					board: makeBoardSnapshot([[d7, PieceCode.BlackPawn]]),
					change: makeChangeSnapshot({
						deferredUIMoveRequest: {
							status: 'unresolved',
							sourceSquare: d7,
							destination: { to: d8 },
							canBeAutoResolved: false,
							resolvedMoveRequest: null
						}
					})
				})
			};
			const plan = calculateAnimationPlan(input);
			expect(findMoveTrack(plan.tracks, d7, d8)).toBeDefined();
		});
	});

	describe('auto-resolved promotion', () => {
		it('produces move track using original piece when promotedTo is set', () => {
			const input: AnimationPlanningInput = {
				previous: makeSnapshot({ board: makeBoardSnapshot([[d7, PieceCode.BlackPawn]]) }),
				current: makeSnapshot({
					board: makeBoardSnapshot([[d8, PieceCode.BlackQueen]]),
					change: makeChangeSnapshot({
						lastMove: { from: d7, to: d8, piece: PieceCode.BlackPawn, promotedTo: RoleCode.Queen }
					})
				})
			};
			const plan = calculateAnimationPlan(input);
			const mt = findMoveTrack(plan.tracks, d7, d8);
			expect(mt).toBeDefined();
			expect(mt!.pieceCode).toBe(PieceCode.BlackPawn);
		});
	});

	describe('deferred promotion resolve normalization', () => {
		it('normalizes correctly when deferred promotion is resolved (pawn already projected)', () => {
			// Previous: pawn on d7, deferred d7->d8 (effectively pawn already at d8)
			// Current: queen on d8, lastMove d7->d8 promoted
			// Since previous already projected pawn to d8, and current normalizes queen back to pawn,
			// the boards are identical => no tracks (piece already visually in place)
			const input: AnimationPlanningInput = {
				previous: makeSnapshot({
					board: makeBoardSnapshot([[d7, PieceCode.WhitePawn]]),
					change: makeChangeSnapshot({
						deferredUIMoveRequest: {
							status: 'unresolved',
							sourceSquare: d7,
							destination: { to: d8 },
							canBeAutoResolved: false,
							resolvedMoveRequest: null
						}
					})
				}),
				current: makeSnapshot({
					board: makeBoardSnapshot([[d8, PieceCode.WhiteQueen]]),
					change: makeChangeSnapshot({
						lastMove: { from: d7, to: d8, piece: PieceCode.WhitePawn, promotedTo: RoleCode.Queen }
					})
				})
			};
			const plan = calculateAnimationPlan(input);
			// No movement track needed: pawn was already projected to d8 in previous
			expect(plan.tracks).toHaveLength(0);
			// No fade-out/fade-in degradation
			expect(findFadeTrack(plan.tracks, 'fade-out', d7)).toBeUndefined();
			expect(findFadeTrack(plan.tracks, 'fade-in', d8)).toBeUndefined();
		});

		it('normalizes correctly when promotion arrives without prior deferred projection', () => {
			// Previous: pawn on d7, NO deferred move
			// Current: queen on d8, lastMove d7->d8 promoted
			// Normalization replaces queen with pawn on d8 => move track d7->d8
			const input: AnimationPlanningInput = {
				previous: makeSnapshot({
					board: makeBoardSnapshot([[d7, PieceCode.WhitePawn]])
				}),
				current: makeSnapshot({
					board: makeBoardSnapshot([[d8, PieceCode.WhiteQueen]]),
					change: makeChangeSnapshot({
						lastMove: { from: d7, to: d8, piece: PieceCode.WhitePawn, promotedTo: RoleCode.Queen }
					})
				})
			};
			const plan = calculateAnimationPlan(input);
			const mt = findMoveTrack(plan.tracks, d7, d8, PieceCode.WhitePawn);
			expect(mt).toBeDefined();
			expect(findFadeTrack(plan.tracks, 'fade-out', d7)).toBeUndefined();
			expect(findFadeTrack(plan.tracks, 'fade-in', d8)).toBeUndefined();
		});
	});
});
