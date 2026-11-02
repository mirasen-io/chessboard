import { describe, expect, it } from 'vitest';
import { rendererPiecesRender } from '../../../../../src/extensions/first-party/main-renderer/pieces/render.js';
import type { MainRendererPiecesInternal } from '../../../../../src/extensions/first-party/main-renderer/pieces/types.js';
import { DirtyLayer } from '../../../../../src/extensions/first-party/main-renderer/types/extension.js';
import {
	PieceCode,
	type Square,
	SQUARE_COUNT
} from '../../../../../src/state/board/types/internal.js';
import {
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

describe('pieces renderer – suppression smoke', () => {
	it('does not render an image for a suppressed occupied square', () => {
		const state = createInternalState(new Set([0 as Square]));
		const layer = createPiecesLayer();
		const board = new Uint8Array(SQUARE_COUNT);
		board[0] = PieceCode.WhiteKing;
		board[7] = PieceCode.BlackKing;

		const ctx = createPiecesRenderContext({ pieces: board, dirtyLayers: DirtyLayer.Pieces });
		rendererPiecesRender(state, ctx, layer);

		// Only square 7 should be rendered (square 0 is suppressed)
		expect(layer.children.length).toBe(1);
		expect(layer.children[0].getAttribute('href')).toBe(resolver.getHref(PieceCode.BlackKing));
	});

	it('removes an already-rendered image when its square becomes suppressed', () => {
		const state = createInternalState(new Set());
		const layer = createPiecesLayer();
		const board = new Uint8Array(SQUARE_COUNT);
		board[0] = PieceCode.WhiteKing;
		board[7] = PieceCode.BlackKing;

		// First render — both visible
		const ctx = createPiecesRenderContext({ pieces: board, dirtyLayers: DirtyLayer.Pieces });
		rendererPiecesRender(state, ctx, layer);
		expect(layer.children.length).toBe(2);

		// Now suppress square 0 and re-render
		state.suppressedSquares = new Set([0 as Square]);
		rendererPiecesRender(state, ctx, layer);
		expect(layer.children.length).toBe(1);
	});

	it('re-adds image when suppression is cleared', () => {
		const state = createInternalState(new Set([0 as Square]));
		const layer = createPiecesLayer();
		const board = new Uint8Array(SQUARE_COUNT);
		board[0] = PieceCode.WhiteKing;
		board[7] = PieceCode.BlackKing;

		const ctx = createPiecesRenderContext({ pieces: board, dirtyLayers: DirtyLayer.Pieces });

		// Render with suppression
		rendererPiecesRender(state, ctx, layer);
		expect(layer.children.length).toBe(1);

		// Clear suppression and re-render
		state.suppressedSquares = new Set();
		rendererPiecesRender(state, ctx, layer);
		expect(layer.children.length).toBe(2);
	});

	it('multiple suppressed squares: only unsuppressed occupied squares produce images', () => {
		const state = createInternalState(new Set([0 as Square, 7 as Square, 63 as Square]));
		const layer = createPiecesLayer();
		const board = new Uint8Array(SQUARE_COUNT);
		board[0] = PieceCode.WhiteRook;
		board[4] = PieceCode.WhiteKing;
		board[7] = PieceCode.WhiteRook;
		board[60] = PieceCode.BlackKing;
		board[63] = PieceCode.BlackRook;

		const ctx = createPiecesRenderContext({ pieces: board, dirtyLayers: DirtyLayer.Pieces });
		rendererPiecesRender(state, ctx, layer);

		// Only squares 4 and 60 are unsuppressed and occupied
		expect(layer.children.length).toBe(2);
	});
});
