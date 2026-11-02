import { describe, expect, it } from 'vitest';
import { rendererAnimationOnUpdate } from '../../../../../src/extensions/first-party/main-renderer/animation/update.js';
import {
	getAnimationSuppressedSquares,
	rendererAnimationClean,
	rendererAnimationPrepare,
	rendererAnimationRender
} from '../../../../../src/extensions/first-party/main-renderer/animation/render.js';
import {
	PieceCode,
	type Square,
	SQUARE_COUNT
} from '../../../../../src/state/board/types/internal.js';
import { createSvgElement } from '../../../../test-utils/dom/svg.js';
import {
	createAnimationCleanContext,
	createAnimationInternalState,
	createAnimationPrepareContext,
	createAnimationRenderContext,
	createAnimationUpdateContext,
	createMockAnimationRuntimeSurface
} from '../../../../test-utils/extensions/first-party/main-renderer/animation.js';

function boardWithPiece(sq: Square, piece: PieceCode): object {
	const pieces = new Uint8Array(SQUARE_COUNT);
	pieces[sq] = piece;
	return { pieces, turn: 0, positionEpoch: 0 };
}

function singleMoveContext() {
	const from = 12 as Square;
	const to = 28 as Square;
	return createAnimationUpdateContext({
		causes: ['state.board.move'],
		previousState: {
			board: boardWithPiece(from, PieceCode.WhitePawn),
			change: { lastMove: null, deferredUIMoveRequest: null }
		},
		currentState: {
			board: boardWithPiece(to, PieceCode.WhitePawn),
			change: {
				lastMove: { from, to, piece: PieceCode.WhitePawn },
				deferredUIMoveRequest: null
			}
		}
	});
}

describe('animation update – durationMs wiring', () => {
	it('submits with the configured positive durationMs', () => {
		const { surface, submit } = createMockAnimationRuntimeSurface();
		const state = createAnimationInternalState(surface, () => ({ durationMs: 350 }));

		rendererAnimationOnUpdate(state, singleMoveContext());

		expect(submit).toHaveBeenCalledTimes(1);
		expect(submit).toHaveBeenCalledWith({ duration: 350 });
	});

	it('reads durationMs live from the getter on each update', () => {
		const { surface, submit } = createMockAnimationRuntimeSurface();
		let durationMs = 180;
		const state = createAnimationInternalState(surface, () => ({ durationMs }));

		rendererAnimationOnUpdate(state, singleMoveContext());
		expect(submit).toHaveBeenLastCalledWith({ duration: 180 });

		durationMs = 75;
		rendererAnimationOnUpdate(state, singleMoveContext());
		expect(submit).toHaveBeenLastCalledWith({ duration: 75 });
	});

	it('submits once with the configured duration for a coordinated multi-piece move', () => {
		const { surface, submit } = createMockAnimationRuntimeSurface();
		const state = createAnimationInternalState(surface, () => ({ durationMs: 350 }));

		// Castle-shaped board change: king e1 (4) → g1 (6), rook h1 (7) → f1 (5).
		const prevPieces = new Uint8Array(SQUARE_COUNT);
		prevPieces[4] = PieceCode.WhiteKing;
		prevPieces[7] = PieceCode.WhiteRook;
		const currPieces = new Uint8Array(SQUARE_COUNT);
		currPieces[6] = PieceCode.WhiteKing;
		currPieces[5] = PieceCode.WhiteRook;

		const ctx = createAnimationUpdateContext({
			causes: ['state.board.move'],
			previousState: {
				board: { pieces: prevPieces, turn: 0, positionEpoch: 0 },
				change: { lastMove: null, deferredUIMoveRequest: null }
			},
			currentState: {
				board: { pieces: currPieces, turn: 0, positionEpoch: 1 },
				change: {
					lastMove: { from: 4, to: 6, piece: PieceCode.WhiteKing },
					deferredUIMoveRequest: null
				}
			}
		});

		rendererAnimationOnUpdate(state, ctx);

		expect(submit).toHaveBeenCalledTimes(1);
		expect(submit).toHaveBeenCalledWith({ duration: 350 });
		const sessionId = submit.mock.results[0].value.id;
		const entry = state.entries.get(sessionId)!;
		expect(entry.plan.tracks.length).toBeGreaterThan(1);
	});
});

describe('animation update – durationMs: 0 skips animation creation', () => {
	it('does not submit, does not insert an entry, and reports no suppression', () => {
		const { surface, submit } = createMockAnimationRuntimeSurface();
		const state = createAnimationInternalState(surface, () => ({ durationMs: 0 }));

		rendererAnimationOnUpdate(state, singleMoveContext());

		expect(submit).not.toHaveBeenCalled();
		expect(state.entries.size).toBe(0);
		expect(getAnimationSuppressedSquares(state)).toEqual(new Set());
	});

	it('lifecycle calls become no-ops when no entry was inserted', () => {
		const { surface } = createMockAnimationRuntimeSurface();
		const state = createAnimationInternalState(surface, () => ({ durationMs: 0 }));

		rendererAnimationOnUpdate(state, singleMoveContext());

		// No entry was added, so prepare / render / clean find nothing to act on.
		const prepCtx = createAnimationPrepareContext({ submittedSessions: [{ id: 1 }] });
		const slot = createSvgElement('g');
		expect(() => rendererAnimationPrepare(state, prepCtx, slot)).not.toThrow();

		const renderCtx = createAnimationRenderContext({
			activeSessions: [{ id: 1, progress: 0.5 }]
		});
		expect(() => rendererAnimationRender(state, renderCtx)).not.toThrow();

		const { context: cleanCtx } = createAnimationCleanContext({
			finishedSessions: [{ id: 1, status: 'ended' }]
		});
		expect(() => rendererAnimationClean(state, cleanCtx)).not.toThrow();

		expect(state.entries.size).toBe(0);
	});
});
