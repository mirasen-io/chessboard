import { describe, expect, it } from 'vitest';
import { rendererPiecesRender } from '../../../../../src/extensions/first-party/main-renderer/pieces/render.js';
import type { MainRendererPiecesInternal } from '../../../../../src/extensions/first-party/main-renderer/pieces/types.js';
import { rendererPiecesRefreshSuppressedSquares } from '../../../../../src/extensions/first-party/main-renderer/pieces/update.js';
import { DirtyLayer } from '../../../../../src/extensions/first-party/main-renderer/types/extension.js';
import {
	PieceCode,
	type Square,
	SQUARE_COUNT
} from '../../../../../src/state/board/types/internal.js';
import {
	createPiecesCleanAnimationContext,
	createPiecesLayer,
	createPiecesRenderContext,
	createTestPieceSymbolResolver
} from '../../../../test-utils/extensions/first-party/main-renderer/pieces.js';

const resolver = createTestPieceSymbolResolver();

function createInternalState(
	suppressedSquares: ReadonlySet<Square> = new Set()
): MainRendererPiecesInternal {
	return {
		pieceNodes: new Map(),
		suppressedSquares,
		resolver
	};
}

describe('rendererPiecesRefreshSuppressedSquares – dirty marking', () => {
	it('marks DirtyLayer.Pieces when computed suppression changes', () => {
		const state = createInternalState(new Set()); // currently empty suppression
		const dragSession = {
			owner: 'core',
			type: 'lifted-piece-drag',
			phase: 'active',
			sourceSquare: 4 as Square,
			sourcePieceCode: PieceCode.WhiteKing,
			targetSquare: null,
			pointerPosition: { x: 100, y: 100 }
		};
		const { context, markDirty } = createPiecesCleanAnimationContext({ dragSession });

		rendererPiecesRefreshSuppressedSquares(state, context, new Set());

		expect(markDirty).toHaveBeenCalledWith(DirtyLayer.Pieces);
	});

	it('does not mark dirty when computed suppression is unchanged', () => {
		// Pre-set suppression to match what calculateSuppressedSquares would return
		const state = createInternalState(new Set([4 as Square]));
		const dragSession = {
			owner: 'core',
			type: 'lifted-piece-drag',
			phase: 'active',
			sourceSquare: 4 as Square,
			sourcePieceCode: PieceCode.WhiteKing,
			targetSquare: null,
			pointerPosition: { x: 100, y: 100 }
		};
		const { context, markDirty } = createPiecesCleanAnimationContext({ dragSession });

		rendererPiecesRefreshSuppressedSquares(state, context, new Set());

		expect(markDirty).not.toHaveBeenCalled();
	});

	it('marks dirty when animation suppression changes', () => {
		const state = createInternalState(new Set());
		const { context, markDirty } = createPiecesCleanAnimationContext();

		// New animation suppressed squares that were not in state
		const animSuppressed = new Set([10 as Square, 20 as Square]);
		rendererPiecesRefreshSuppressedSquares(state, context, animSuppressed);

		expect(markDirty).toHaveBeenCalledWith(DirtyLayer.Pieces);
	});
});

describe('rendererPiecesRefreshSuppressedSquares – suppression state update', () => {
	it('updates suppression observably via subsequent render', () => {
		const state = createInternalState(new Set());
		const layer = createPiecesLayer();
		const board = new Uint8Array(SQUARE_COUNT);
		board[0] = PieceCode.WhiteKing;
		board[4] = PieceCode.WhiteRook;

		// Initial render — both pieces visible
		const renderCtx = createPiecesRenderContext({ pieces: board, dirtyLayers: DirtyLayer.Pieces });
		rendererPiecesRender(state, renderCtx, layer);
		expect(layer.children.length).toBe(2);

		// Refresh suppression to suppress square 0
		const dragSession = {
			owner: 'core',
			type: 'lifted-piece-drag',
			phase: 'active',
			sourceSquare: 0 as Square,
			sourcePieceCode: PieceCode.WhiteKing,
			targetSquare: null,
			pointerPosition: { x: 50, y: 50 }
		};
		const { context: refreshCtx } = createPiecesCleanAnimationContext({ dragSession });
		rendererPiecesRefreshSuppressedSquares(state, refreshCtx, new Set());

		// Re-render with updated suppression — square 0 should now be suppressed
		rendererPiecesRender(state, renderCtx, layer);
		expect(layer.children.length).toBe(1);
	});

	it('clears previously suppressed squares when suppression sources disappear', () => {
		// Start with square 4 suppressed
		const state = createInternalState(new Set([4 as Square]));
		const layer = createPiecesLayer();
		const board = new Uint8Array(SQUARE_COUNT);
		board[0] = PieceCode.WhiteKing;
		board[4] = PieceCode.WhiteRook;

		// Render with suppression — only square 0 visible
		const renderCtx = createPiecesRenderContext({ pieces: board, dirtyLayers: DirtyLayer.Pieces });
		rendererPiecesRender(state, renderCtx, layer);
		expect(layer.children.length).toBe(1);

		// Refresh with no suppression sources
		const { context: refreshCtx } = createPiecesCleanAnimationContext();
		rendererPiecesRefreshSuppressedSquares(state, refreshCtx, new Set());

		// Re-render — both should be visible now
		rendererPiecesRender(state, renderCtx, layer);
		expect(layer.children.length).toBe(2);
	});
});
