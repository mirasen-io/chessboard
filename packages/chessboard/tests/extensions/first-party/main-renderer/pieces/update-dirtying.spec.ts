import { describe, expect, it } from 'vitest';
import { createMainRendererPieces } from '../../../../../src/extensions/first-party/main-renderer/pieces/factory.js';
import { DirtyLayer } from '../../../../../src/extensions/first-party/main-renderer/types/extension.js';
import {
	PieceCode,
	type Square,
	SQUARE_COUNT
} from '../../../../../src/state/board/types/internal.js';
import {
	createPiecesUpdateContext,
	createTestPieceSymbolResolver
} from '../../../../test-utils/extensions/first-party/main-renderer/pieces.js';

const resolver = createTestPieceSymbolResolver();
const emptySuppress: ReadonlySet<Square> = new Set();

describe('pieces update – non-renderable context', () => {
	it('no-op when context is not mounted', () => {
		const pieces = createMainRendererPieces(resolver);
		const { context, markDirty } = createPiecesUpdateContext({
			isMounted: false,
			causes: ['layout.refreshGeometry']
		});

		pieces.onUpdate(context, emptySuppress);

		expect(markDirty).not.toHaveBeenCalled();
	});

	it('no-op when mounted but geometry is null', () => {
		const pieces = createMainRendererPieces(resolver);
		const { context, markDirty } = createPiecesUpdateContext({
			hasGeometry: false,
			causes: ['layout.refreshGeometry']
		});

		pieces.onUpdate(context, emptySuppress);

		expect(markDirty).not.toHaveBeenCalled();
	});
});

describe('pieces update – unrelated mutations', () => {
	it('no-op when mutation has no relevant causes or prefixes', () => {
		const pieces = createMainRendererPieces(resolver);
		const { context, markDirty } = createPiecesUpdateContext({
			causes: ['state.view.setAutoPromote']
		});

		pieces.onUpdate(context, emptySuppress);

		expect(markDirty).not.toHaveBeenCalled();
	});

	it('no-op when mutation cause is completely unrelated', () => {
		const pieces = createMainRendererPieces(resolver);
		const { context, markDirty } = createPiecesUpdateContext({
			causes: ['runtime.interaction.cancelDeferredUIMoveRequest']
		});

		pieces.onUpdate(context, emptySuppress);

		expect(markDirty).not.toHaveBeenCalled();
	});
});

describe('pieces update – marks DirtyLayer.Pieces', () => {
	it('marks dirty when layout.refreshGeometry cause is present', () => {
		const pieces = createMainRendererPieces(resolver);
		const { context, markDirty } = createPiecesUpdateContext({
			causes: ['layout.refreshGeometry'],
			previousFrame: true
		});

		pieces.onUpdate(context, emptySuppress);

		expect(markDirty).toHaveBeenCalledWith(DirtyLayer.Pieces);
	});

	it('marks dirty when board piece positions change', () => {
		const pieces = createMainRendererPieces(resolver);
		const currentBoard = new Uint8Array(SQUARE_COUNT);
		currentBoard[0] = PieceCode.WhiteKing;

		const previousBoard = new Uint8Array(SQUARE_COUNT);
		previousBoard[4] = PieceCode.WhiteKing;

		const { context, markDirty } = createPiecesUpdateContext({
			causes: ['state.board.setPosition'],
			pieces: currentBoard,
			previousPieces: previousBoard,
			previousFrame: true
		});

		pieces.onUpdate(context, emptySuppress);

		expect(markDirty).toHaveBeenCalledWith(DirtyLayer.Pieces);
	});

	it('marks dirty when previousFrame is null (first mount)', () => {
		const pieces = createMainRendererPieces(resolver);
		const { context, markDirty } = createPiecesUpdateContext({
			causes: ['state.board.setPosition'],
			previousFrame: false,
			previousPieces: null
		});

		pieces.onUpdate(context, emptySuppress);

		expect(markDirty).toHaveBeenCalledWith(DirtyLayer.Pieces);
	});

	it('marks dirty when suppression changes via animationSuppressedSquares', () => {
		const pieces = createMainRendererPieces(resolver);
		const board = new Uint8Array(SQUARE_COUNT);
		board[0] = PieceCode.WhiteKing;

		const { context, markDirty } = createPiecesUpdateContext({
			causes: ['state.board.setPosition'],
			pieces: board,
			previousPieces: board,
			previousFrame: true
		});

		// Pass a non-empty suppression set — changes from the default empty
		const suppressed = new Set([0 as Square]);
		pieces.onUpdate(context, suppressed);

		expect(markDirty).toHaveBeenCalledWith(DirtyLayer.Pieces);
	});
});

describe('pieces update – does not mark dirty when unchanged', () => {
	it('does not mark dirty when positions and suppression are unchanged', () => {
		const pieces = createMainRendererPieces(resolver);
		const board = new Uint8Array(SQUARE_COUNT);
		board[0] = PieceCode.WhiteKing;

		// First call to establish internal suppression state
		const { context: ctx1 } = createPiecesUpdateContext({
			causes: ['state.board.setPosition'],
			pieces: board,
			previousPieces: null,
			previousFrame: false
		});
		pieces.onUpdate(ctx1, emptySuppress);

		// Second call with identical board and suppression
		const { context: ctx2, markDirty: markDirty2 } = createPiecesUpdateContext({
			causes: ['state.board.setPosition'],
			pieces: board,
			previousPieces: board,
			previousFrame: true
		});
		pieces.onUpdate(ctx2, emptySuppress);

		expect(markDirty2).not.toHaveBeenCalled();
	});
});
