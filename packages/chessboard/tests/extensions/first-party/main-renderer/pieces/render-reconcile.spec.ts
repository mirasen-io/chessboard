import { describe, expect, it } from 'vitest';
import { createMainRendererPieces } from '../../../../../src/extensions/first-party/main-renderer/pieces/factory.js';
import { PieceCode, SQUARE_COUNT } from '../../../../../src/state/board/types/internal.js';
import {
	createPiecesLayer,
	createPiecesRenderContext,
	createTestPieceSymbolResolver
} from '../../../../test-utils/extensions/first-party/main-renderer/pieces.js';

const resolver = createTestPieceSymbolResolver();

describe('pieces renderer – DOM reconciliation', () => {
	it('repeated render with same state does not duplicate nodes', () => {
		const pieces = createMainRendererPieces(resolver);
		const layer = createPiecesLayer();
		const board = new Uint8Array(SQUARE_COUNT);
		board[0] = PieceCode.WhiteKing;
		board[7] = PieceCode.BlackKing;

		const ctx = createPiecesRenderContext({ pieces: board });
		pieces.render(ctx, layer);
		pieces.render(ctx, layer);
		pieces.render(ctx, layer);

		expect(layer.children.length).toBe(2);
	});

	it('updates existing element attributes when geometry changes', () => {
		const pieces = createMainRendererPieces(resolver);
		const layer = createPiecesLayer();
		const board = new Uint8Array(SQUARE_COUNT);
		board[0] = PieceCode.WhiteRook;

		// First render with 400px scene
		pieces.render(createPiecesRenderContext({ pieces: board, sceneSize: 400 }), layer);
		expect(layer.children[0].getAttribute('width')).toBe('50');

		// Re-render with 800px scene — same piece, new geometry
		pieces.render(createPiecesRenderContext({ pieces: board, sceneSize: 800 }), layer);
		expect(layer.children[0].getAttribute('width')).toBe('100');
		expect(layer.children.length).toBe(1);
	});

	it('removes element when a previously-occupied square becomes empty', () => {
		const pieces = createMainRendererPieces(resolver);
		const layer = createPiecesLayer();
		const board = new Uint8Array(SQUARE_COUNT);
		board[0] = PieceCode.WhiteKing;
		board[7] = PieceCode.BlackKing;

		pieces.render(createPiecesRenderContext({ pieces: board }), layer);
		expect(layer.children.length).toBe(2);

		// Remove piece from square 0
		const board2 = new Uint8Array(board);
		board2[0] = PieceCode.Empty;
		pieces.render(createPiecesRenderContext({ pieces: board2 }), layer);

		expect(layer.children.length).toBe(1);
	});

	it('adds element when a previously-empty square becomes occupied', () => {
		const pieces = createMainRendererPieces(resolver);
		const layer = createPiecesLayer();
		const board = new Uint8Array(SQUARE_COUNT);
		board[0] = PieceCode.WhiteKing;

		pieces.render(createPiecesRenderContext({ pieces: board }), layer);
		expect(layer.children.length).toBe(1);

		// Add piece to square 63
		const board2 = new Uint8Array(board);
		board2[63] = PieceCode.BlackKing;
		pieces.render(createPiecesRenderContext({ pieces: board2 }), layer);

		expect(layer.children.length).toBe(2);
	});

	it('updates href when piece code changes on the same square', () => {
		const pieces = createMainRendererPieces(resolver);
		const layer = createPiecesLayer();
		const board = new Uint8Array(SQUARE_COUNT);
		board[0] = PieceCode.WhitePawn;

		pieces.render(createPiecesRenderContext({ pieces: board }), layer);
		expect(layer.children[0].getAttribute('href')).toBe(resolver.getHref(PieceCode.WhitePawn));

		// Promote pawn to queen on the same square
		const board2 = new Uint8Array(SQUARE_COUNT);
		board2[0] = PieceCode.WhiteQueen;
		pieces.render(createPiecesRenderContext({ pieces: board2 }), layer);

		expect(layer.children[0].getAttribute('href')).toBe(resolver.getHref(PieceCode.WhiteQueen));
		expect(layer.children.length).toBe(1);
	});

	it('total children always equals occupied square count', () => {
		const pieces = createMainRendererPieces(resolver);
		const layer = createPiecesLayer();

		// Start with 3 pieces
		const board = new Uint8Array(SQUARE_COUNT);
		board[0] = PieceCode.WhiteKing;
		board[4] = PieceCode.WhiteRook;
		board[60] = PieceCode.BlackKing;
		pieces.render(createPiecesRenderContext({ pieces: board }), layer);
		expect(layer.children.length).toBe(3);

		// Change to 5 pieces
		const board2 = new Uint8Array(board);
		board2[1] = PieceCode.WhiteKnight;
		board2[62] = PieceCode.BlackQueen;
		pieces.render(createPiecesRenderContext({ pieces: board2 }), layer);
		expect(layer.children.length).toBe(5);

		// Change to 1 piece
		const board3 = new Uint8Array(SQUARE_COUNT);
		board3[32] = PieceCode.BlackBishop;
		pieces.render(createPiecesRenderContext({ pieces: board3 }), layer);
		expect(layer.children.length).toBe(1);
	});
});
