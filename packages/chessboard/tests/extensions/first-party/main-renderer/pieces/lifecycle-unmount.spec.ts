import { describe, expect, it } from 'vitest';
import { createMainRendererPieces } from '../../../../../src/extensions/first-party/main-renderer/pieces/factory.js';
import { DirtyLayer } from '../../../../../src/extensions/first-party/main-renderer/types/extension.js';
import {
	PieceCode,
	type Square,
	SQUARE_COUNT
} from '../../../../../src/state/board/types/internal.js';
import {
	createPiecesLayer,
	createPiecesRenderContext,
	createPiecesUpdateContext,
	createTestPieceSymbolResolver
} from '../../../../test-utils/extensions/first-party/main-renderer/pieces.js';

const resolver = createTestPieceSymbolResolver();

describe('pieces factory – unmount cleanup', () => {
	it('removes rendered piece nodes from the layer', () => {
		const pieces = createMainRendererPieces(resolver);
		const layer = createPiecesLayer();
		const board = new Uint8Array(SQUARE_COUNT);
		board[0] = PieceCode.WhiteKing;
		board[4] = PieceCode.WhiteRook;
		board[60] = PieceCode.BlackKing;

		pieces.render(
			createPiecesRenderContext({ pieces: board, dirtyLayers: DirtyLayer.Pieces }),
			layer
		);
		expect(layer.children.length).toBe(3);

		pieces.unmount();

		expect(layer.children.length).toBe(0);
	});

	it('after unmount, a fresh render creates new nodes', () => {
		const pieces = createMainRendererPieces(resolver);
		const layer = createPiecesLayer();
		const board = new Uint8Array(SQUARE_COUNT);
		board[0] = PieceCode.WhiteKing;

		// Render, then unmount
		pieces.render(
			createPiecesRenderContext({ pieces: board, dirtyLayers: DirtyLayer.Pieces }),
			layer
		);
		expect(layer.children.length).toBe(1);
		pieces.unmount();
		expect(layer.children.length).toBe(0);

		// Re-render after unmount — fresh nodes should appear
		pieces.render(
			createPiecesRenderContext({ pieces: board, dirtyLayers: DirtyLayer.Pieces }),
			layer
		);
		expect(layer.children.length).toBe(1);
		expect(layer.children[0].getAttribute('href')).toBe(resolver.getHref(PieceCode.WhiteKing));
	});

	it('after unmount, a previously suppressed piece is not stuck suppressed', () => {
		const pieces = createMainRendererPieces(resolver);
		const layer = createPiecesLayer();
		const board = new Uint8Array(SQUARE_COUNT);
		board[0] = PieceCode.WhiteKing;
		board[4] = PieceCode.WhiteRook;

		// Establish suppression via onUpdate (drag on square 0)
		const { context: updateCtx } = createPiecesUpdateContext({
			causes: ['state.interaction.startDrag'],
			pieces: board,
			previousPieces: board,
			previousFrame: true,
			dragSession: {
				owner: 'core',
				type: 'lifted-piece-drag',
				phase: 'active',
				sourceSquare: 0 as Square,
				sourcePieceCode: PieceCode.WhiteKing,
				targetSquare: null,
				pointerPosition: { x: 50, y: 50 }
			}
		});

		pieces.onUpdate(updateCtx, new Set());

		// Render — square 0 should be suppressed
		pieces.render(
			createPiecesRenderContext({ pieces: board, dirtyLayers: DirtyLayer.Pieces }),
			layer
		);
		expect(layer.children.length).toBe(1); // only square 4

		// Unmount clears suppression
		pieces.unmount();

		// Re-render without any drag/suppression — both should appear
		pieces.render(
			createPiecesRenderContext({ pieces: board, dirtyLayers: DirtyLayer.Pieces }),
			layer
		);
		expect(layer.children.length).toBe(2);
	});

	it('does not throw when called with no rendered nodes', () => {
		const pieces = createMainRendererPieces(resolver);

		expect(() => pieces.unmount()).not.toThrow();
	});

	it('does not throw when called after already being unmounted', () => {
		const pieces = createMainRendererPieces(resolver);
		const layer = createPiecesLayer();
		const board = new Uint8Array(SQUARE_COUNT);
		board[0] = PieceCode.WhiteKing;

		pieces.render(
			createPiecesRenderContext({ pieces: board, dirtyLayers: DirtyLayer.Pieces }),
			layer
		);
		pieces.unmount();

		expect(() => pieces.unmount()).not.toThrow();
	});
});
