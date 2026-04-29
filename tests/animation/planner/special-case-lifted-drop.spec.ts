import { describe, expect, it } from 'vitest';
import { calculateAnimationPlan } from '../../../src/animation/planner.js';
import type { AnimationPlanningInput, AnimationTrack } from '../../../src/animation/types.js';
import { normalizeSquare } from '../../../src/state/board/normalize.js';
import { PieceCode, type Square } from '../../../src/state/board/types/internal.js';
import {
	makeBoardSnapshot,
	makeChangeSnapshot,
	makeInteractionSnapshot,
	makeSnapshot
} from '../../test-utils/animation/fixtures.js';

const e2 = normalizeSquare('e2');
const e4 = normalizeSquare('e4');

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

describe('calculateAnimationPlan — special cases', () => {
	describe('lifted-piece-drop suppression', () => {
		it('suppresses move track without suppressing dropped endpoints', () => {
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
			expect(plan.suppressedSquares.has(e2)).toBe(false);
			expect(plan.suppressedSquares.has(e4)).toBe(false);
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
});
