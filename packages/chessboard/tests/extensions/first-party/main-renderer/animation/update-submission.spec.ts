import { describe, expect, it } from 'vitest';
import { rendererAnimationOnUpdate } from '../../../../../src/extensions/first-party/main-renderer/animation/update.js';
import {
	PieceCode,
	type Square,
	SQUARE_COUNT
} from '../../../../../src/state/board/types/internal.js';
import {
	createAnimationInternalState,
	createAnimationUpdateContext,
	createMockAnimationRuntimeSurface
} from '../../../../test-utils/extensions/first-party/main-renderer/animation.js';

/**
 * Helper: creates a board with a single piece at the given square.
 */
function boardWithPiece(sq: Square, piece: PieceCode): object {
	const pieces = new Uint8Array(SQUARE_COUNT);
	pieces[sq] = piece;
	return { pieces, turn: 0, positionEpoch: 0 };
}

describe('animation update – session submission', () => {
	it('calls submit with duration 180 when a piece moves', () => {
		const { surface, submit } = createMockAnimationRuntimeSurface();
		const state = createAnimationInternalState(surface);

		// Piece moves from e2 (sq 12) to e4 (sq 28)
		const prevBoard = boardWithPiece(12 as Square, PieceCode.WhitePawn);
		const currBoard = boardWithPiece(28 as Square, PieceCode.WhitePawn);

		const ctx = createAnimationUpdateContext({
			causes: ['state.board.move'],
			previousState: {
				board: prevBoard,
				change: { lastMove: null, deferredUIMoveRequest: null }
			},
			currentState: {
				board: currBoard,
				change: {
					lastMove: { from: 12, to: 28, piece: PieceCode.WhitePawn },
					deferredUIMoveRequest: null
				}
			}
		});

		rendererAnimationOnUpdate(state, ctx);

		expect(submit).toHaveBeenCalledTimes(1);
		expect(submit).toHaveBeenCalledWith({ duration: 180 });
	});

	it('stores entry under the returned session id', () => {
		const { surface, submit } = createMockAnimationRuntimeSurface();
		const state = createAnimationInternalState(surface);

		const prevBoard = boardWithPiece(12 as Square, PieceCode.WhitePawn);
		const currBoard = boardWithPiece(28 as Square, PieceCode.WhitePawn);

		const ctx = createAnimationUpdateContext({
			causes: ['state.board.move'],
			previousState: {
				board: prevBoard,
				change: { lastMove: null, deferredUIMoveRequest: null }
			},
			currentState: {
				board: currBoard,
				change: {
					lastMove: { from: 12, to: 28, piece: PieceCode.WhitePawn },
					deferredUIMoveRequest: null
				}
			}
		});

		rendererAnimationOnUpdate(state, ctx);

		// submit returns session with id=1 (first call)
		const sessionId = submit.mock.results[0].value.id;
		expect(state.entries.has(sessionId)).toBe(true);
	});

	it('stored entry has nodes: null (not yet prepared)', () => {
		const { surface, submit } = createMockAnimationRuntimeSurface();
		const state = createAnimationInternalState(surface);

		const prevBoard = boardWithPiece(0 as Square, PieceCode.WhiteRook);
		const currBoard = boardWithPiece(7 as Square, PieceCode.WhiteRook);

		const ctx = createAnimationUpdateContext({
			causes: ['state.board.move'],
			previousState: {
				board: prevBoard,
				change: { lastMove: null, deferredUIMoveRequest: null }
			},
			currentState: {
				board: currBoard,
				change: {
					lastMove: { from: 0, to: 7, piece: PieceCode.WhiteRook },
					deferredUIMoveRequest: null
				}
			}
		});

		rendererAnimationOnUpdate(state, ctx);

		const sessionId = submit.mock.results[0].value.id;
		const entry = state.entries.get(sessionId);
		expect(entry).toBeDefined();
		expect(entry!.nodes).toBeNull();
	});

	it('stored plan has non-empty tracks', () => {
		const { surface, submit } = createMockAnimationRuntimeSurface();
		const state = createAnimationInternalState(surface);

		const prevBoard = boardWithPiece(4 as Square, PieceCode.WhiteKing);
		const currBoard = boardWithPiece(5 as Square, PieceCode.WhiteKing);

		const ctx = createAnimationUpdateContext({
			causes: ['state.board.move'],
			previousState: {
				board: prevBoard,
				change: { lastMove: null, deferredUIMoveRequest: null }
			},
			currentState: {
				board: currBoard,
				change: {
					lastMove: { from: 4, to: 5, piece: PieceCode.WhiteKing },
					deferredUIMoveRequest: null
				}
			}
		});

		rendererAnimationOnUpdate(state, ctx);

		const sessionId = submit.mock.results[0].value.id;
		const entry = state.entries.get(sessionId)!;
		expect(entry.plan.tracks.length).toBeGreaterThan(0);
	});

	it('a simple piece move produces a move track from source to destination', () => {
		const { surface, submit } = createMockAnimationRuntimeSurface();
		const state = createAnimationInternalState(surface);

		const from = 12 as Square;
		const to = 28 as Square;
		const prevBoard = boardWithPiece(from, PieceCode.WhitePawn);
		const currBoard = boardWithPiece(to, PieceCode.WhitePawn);

		const ctx = createAnimationUpdateContext({
			causes: ['state.board.move'],
			previousState: {
				board: prevBoard,
				change: { lastMove: null, deferredUIMoveRequest: null }
			},
			currentState: {
				board: currBoard,
				change: {
					lastMove: { from, to, piece: PieceCode.WhitePawn },
					deferredUIMoveRequest: null
				}
			}
		});

		rendererAnimationOnUpdate(state, ctx);

		const sessionId = submit.mock.results[0].value.id;
		const entry = state.entries.get(sessionId)!;
		const moveTrack = entry.plan.tracks.find((t) => t.effect === 'move');
		expect(moveTrack).toBeDefined();
		expect(moveTrack!.effect).toBe('move');
		if (moveTrack!.effect === 'move') {
			expect(moveTrack!.fromSq).toBe(from);
			expect(moveTrack!.toSq).toBe(to);
			expect(moveTrack!.pieceCode).toBe(PieceCode.WhitePawn);
		}
	});

	it('does not submit when board changes produce no animation-relevant difference', () => {
		const { surface, submit } = createMockAnimationRuntimeSurface();
		const state = createAnimationInternalState(surface);

		// Change only the turn (no piece movement), but change state differs
		const pieces = new Uint8Array(SQUARE_COUNT);
		pieces[4] = PieceCode.WhiteKing;

		const ctx = createAnimationUpdateContext({
			causes: ['state.change.setLastMove'],
			previousState: {
				board: { pieces, turn: 0, positionEpoch: 0 },
				change: { lastMove: null, deferredUIMoveRequest: null }
			},
			currentState: {
				board: { pieces: new Uint8Array(pieces), turn: 0, positionEpoch: 0 },
				change: {
					lastMove: { from: 4, to: 5, piece: PieceCode.WhiteKing },
					deferredUIMoveRequest: null
				}
			}
		});

		rendererAnimationOnUpdate(state, ctx);

		// changeStatesEqual returns false (lastMove differs), but pieces are same
		// → planner will have no tracks since board didn't change
		expect(submit).not.toHaveBeenCalled();
		expect(state.entries.size).toBe(0);
	});
});
