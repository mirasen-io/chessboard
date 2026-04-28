import { describe, expect, it } from 'vitest';
import { calculateAnimationPlan } from '../../../src/animation/planner.js';
import type { AnimationPlanningInput, AnimationTrack } from '../../../src/animation/types.js';
import { normalizeSquare } from '../../../src/state/board/normalize.js';
import { PieceCode, RoleCode, type Square } from '../../../src/state/board/types/internal.js';
import {
	makeBoardSnapshot,
	makeChangeSnapshot,
	makeInteractionSnapshot,
	makeSnapshot
} from '../../test-utils/animation/fixtures.js';

const e2 = normalizeSquare('e2');
const e4 = normalizeSquare('e4');
const d7 = normalizeSquare('d7');
const d8 = normalizeSquare('d8');

function findMoveTrack(tracks: readonly AnimationTrack[], from: Square, to: Square) {
	return tracks.find((t) => t.effect === 'move' && t.fromSq === from && t.toSq === to);
}

describe('calculateAnimationPlan — special cases', () => {
	describe('lifted-piece-drop suppression', () => {
		it('suppresses move track but includes endpoints in suppressedSquares', () => {
			const input: AnimationPlanningInput = {
				previous: makeSnapshot({
					board: makeBoardSnapshot([[e2, PieceCode.WhitePawn]]),
					interaction: makeInteractionSnapshot({
						dragSession: {
							owner: 'core' as const,
							type: 'lifted-piece-drag' as const,
							sourceSquare: e2,
							sourcePieceCode: PieceCode.WhitePawn,
							targetSquare: e4
						}
					})
				}),
				current: makeSnapshot({
					board: makeBoardSnapshot([[e4, PieceCode.WhitePawn]]),
					change: makeChangeSnapshot({
						lastMove: { from: e2, to: e4, piece: PieceCode.WhitePawn }
					}),
					interaction: makeInteractionSnapshot({ dragSession: null })
				})
			};
			const plan = calculateAnimationPlan(input);
			expect(findMoveTrack(plan.tracks, e2, e4)).toBeUndefined();
			expect(plan.tracks).toHaveLength(0);
			expect(plan.suppressedSquares.has(e2)).toBe(true);
			expect(plan.suppressedSquares.has(e4)).toBe(true);
		});

		it('does not suppress when drag type is release-targeting', () => {
			const input: AnimationPlanningInput = {
				previous: makeSnapshot({
					board: makeBoardSnapshot([[e2, PieceCode.WhitePawn]]),
					interaction: makeInteractionSnapshot({
						dragSession: {
							owner: 'core' as const,
							type: 'release-targeting' as const,
							sourceSquare: e2,
							sourcePieceCode: PieceCode.WhitePawn,
							targetSquare: e4
						}
					})
				}),
				current: makeSnapshot({
					board: makeBoardSnapshot([[e4, PieceCode.WhitePawn]]),
					change: makeChangeSnapshot({
						lastMove: { from: e2, to: e4, piece: PieceCode.WhitePawn }
					}),
					interaction: makeInteractionSnapshot({ dragSession: null })
				})
			};
			const plan = calculateAnimationPlan(input);
			expect(findMoveTrack(plan.tracks, e2, e4)).toBeDefined();
		});

		it('does not suppress when current still has a drag session', () => {
			const input: AnimationPlanningInput = {
				previous: makeSnapshot({
					board: makeBoardSnapshot([[e2, PieceCode.WhitePawn]]),
					interaction: makeInteractionSnapshot({
						dragSession: {
							owner: 'core' as const,
							type: 'lifted-piece-drag' as const,
							sourceSquare: e2,
							sourcePieceCode: PieceCode.WhitePawn,
							targetSquare: null
						}
					})
				}),
				current: makeSnapshot({
					board: makeBoardSnapshot([[e4, PieceCode.WhitePawn]]),
					change: makeChangeSnapshot({
						lastMove: { from: e2, to: e4, piece: PieceCode.WhitePawn }
					}),
					interaction: makeInteractionSnapshot({
						dragSession: {
							owner: 'core' as const,
							type: 'lifted-piece-drag' as const,
							sourceSquare: e4,
							sourcePieceCode: PieceCode.WhitePawn,
							targetSquare: null
						}
					})
				})
			};
			const plan = calculateAnimationPlan(input);
			expect(findMoveTrack(plan.tracks, e2, e4)).toBeDefined();
		});
	});

	describe('deferred UI move normalization', () => {
		it('incorporates deferred pawn move into effective board for planning', () => {
			// Previous: pawn on d7
			// Current board still has pawn on d7 (not yet committed),
			// but deferredUIMoveRequest says d7→d8
			const input: AnimationPlanningInput = {
				previous: makeSnapshot({
					board: makeBoardSnapshot([[d7, PieceCode.BlackPawn]])
				}),
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
			// The effective current board has the pawn at d8, so d7→d8 move
			expect(findMoveTrack(plan.tracks, d7, d8)).toBeDefined();
		});
	});

	describe('auto-resolved promotion', () => {
		it('produces move track using original piece when promotedTo is set', () => {
			// Previous: pawn on d7
			// Current: queen on d8, lastMove says d7→d8 with promotedTo
			const input: AnimationPlanningInput = {
				previous: makeSnapshot({
					board: makeBoardSnapshot([[d7, PieceCode.BlackPawn]])
				}),
				current: makeSnapshot({
					board: makeBoardSnapshot([[d8, PieceCode.BlackQueen]]),
					change: makeChangeSnapshot({
						lastMove: {
							from: d7,
							to: d8,
							piece: PieceCode.BlackPawn,
							promotedTo: RoleCode.Queen
						}
					})
				})
			};
			const plan = calculateAnimationPlan(input);
			// Planner temporarily treats d8 as BlackPawn for matching
			const mt = findMoveTrack(plan.tracks, d7, d8);
			expect(mt).toBeDefined();
			expect(mt!.pieceCode).toBe(PieceCode.BlackPawn);
		});
	});
});
