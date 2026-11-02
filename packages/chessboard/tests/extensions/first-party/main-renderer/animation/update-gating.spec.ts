import { describe, expect, it } from 'vitest';
import { rendererAnimationOnUpdate } from '../../../../../src/extensions/first-party/main-renderer/animation/update.js';
import { PieceCode, SQUARE_COUNT } from '../../../../../src/state/board/types/internal.js';
import {
	createAnimationInternalState,
	createAnimationUpdateContext,
	createMockAnimationRuntimeSurface
} from '../../../../test-utils/extensions/first-party/main-renderer/animation.js';

describe('animation update – gating: not renderable', () => {
	it('no-op when context is not mounted', () => {
		const { surface, submit } = createMockAnimationRuntimeSurface();
		const state = createAnimationInternalState(surface);

		const ctx = createAnimationUpdateContext({
			isMounted: false,
			causes: ['state.board.setPosition']
		});

		rendererAnimationOnUpdate(state, ctx);

		expect(submit).not.toHaveBeenCalled();
		expect(state.entries.size).toBe(0);
	});

	it('no-op when mounted but geometry is null', () => {
		const { surface, submit } = createMockAnimationRuntimeSurface();
		const state = createAnimationInternalState(surface);

		const ctx = createAnimationUpdateContext({
			hasGeometry: false,
			causes: ['state.board.setPosition']
		});

		rendererAnimationOnUpdate(state, ctx);

		expect(submit).not.toHaveBeenCalled();
		expect(state.entries.size).toBe(0);
	});
});

describe('animation update – gating: unrelated mutations', () => {
	it('no-op when mutation prefixes are unrelated', () => {
		const { surface, submit } = createMockAnimationRuntimeSurface();
		const state = createAnimationInternalState(surface);

		const ctx = createAnimationUpdateContext({
			causes: ['state.view.setAutoPromote'],
			previousState: {}
		});

		rendererAnimationOnUpdate(state, ctx);

		expect(submit).not.toHaveBeenCalled();
		expect(state.entries.size).toBe(0);
	});

	it('no-op when causes have no state.board. or state.change. prefix', () => {
		const { surface, submit } = createMockAnimationRuntimeSurface();
		const state = createAnimationInternalState(surface);

		const ctx = createAnimationUpdateContext({
			causes: ['layout.refreshGeometry'],
			previousState: {}
		});

		rendererAnimationOnUpdate(state, ctx);

		expect(submit).not.toHaveBeenCalled();
		expect(state.entries.size).toBe(0);
	});
});

describe('animation update – gating: no previousFrame', () => {
	it('no-op when previousFrame is null', () => {
		const { surface, submit } = createMockAnimationRuntimeSurface();
		const state = createAnimationInternalState(surface);

		const ctx = createAnimationUpdateContext({
			causes: ['state.board.setPosition'],
			previousState: null // this makes previousFrame null
		});

		rendererAnimationOnUpdate(state, ctx);

		expect(submit).not.toHaveBeenCalled();
		expect(state.entries.size).toBe(0);
	});
});

describe('animation update – gating: equal snapshots', () => {
	it('no-op when board and change state are unchanged', () => {
		const { surface, submit } = createMockAnimationRuntimeSurface();
		const state = createAnimationInternalState(surface);

		const board = { pieces: new Uint8Array(SQUARE_COUNT), turn: 0, positionEpoch: 0 };
		const change = { lastMove: null, deferredUIMoveRequest: null };

		const ctx = createAnimationUpdateContext({
			causes: ['state.board.setPosition'],
			currentState: { board, change },
			previousState: { board, change }
		});

		rendererAnimationOnUpdate(state, ctx);

		expect(submit).not.toHaveBeenCalled();
		expect(state.entries.size).toBe(0);
	});

	it('no-op when pieces are identical between previous and current', () => {
		const { surface, submit } = createMockAnimationRuntimeSurface();
		const state = createAnimationInternalState(surface);

		// Same pieces array content
		const pieces = new Uint8Array(SQUARE_COUNT);
		pieces[4] = PieceCode.WhiteKing;
		const prevPieces = new Uint8Array(pieces);

		const ctx = createAnimationUpdateContext({
			causes: ['state.board.setPosition'],
			currentState: {
				board: { pieces, turn: 0, positionEpoch: 1 },
				change: { lastMove: null, deferredUIMoveRequest: null }
			},
			previousState: {
				board: { pieces: prevPieces, turn: 0, positionEpoch: 0 },
				change: { lastMove: null, deferredUIMoveRequest: null }
			}
		});

		rendererAnimationOnUpdate(state, ctx);

		expect(submit).not.toHaveBeenCalled();
		expect(state.entries.size).toBe(0);
	});
});
