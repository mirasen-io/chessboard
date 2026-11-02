import { describe, expect, it } from 'vitest';
import { createMainRendererPieces } from '../../../../../src/extensions/first-party/main-renderer/pieces/factory.js';
import { DirtyLayer } from '../../../../../src/extensions/first-party/main-renderer/types/extension.js';
import { PieceCode, SQUARE_COUNT } from '../../../../../src/state/board/types/internal.js';
import {
	queryAllByDataChessboardIdPrefix,
	queryByDataChessboardId
} from '../../../../test-utils/dom/svg.js';
import {
	createPiecesLayer,
	createPiecesRenderContext,
	createTestPieceSymbolResolver
} from '../../../../test-utils/extensions/first-party/main-renderer/pieces.js';

const resolver = createTestPieceSymbolResolver();

describe('pieces renderer – dirty layer gating', () => {
	it('no-ops when DirtyLayer.Pieces is not set', () => {
		const pieces = createMainRendererPieces(resolver);
		const layer = createPiecesLayer();
		const board = new Uint8Array(SQUARE_COUNT);
		board[0] = PieceCode.WhiteKing;

		// First render to populate
		pieces.render(
			createPiecesRenderContext({ pieces: board, dirtyLayers: DirtyLayer.Pieces }),
			layer
		);
		const countBefore = layer.children.length;

		// Second render with different dirty layer — no change
		pieces.render(
			createPiecesRenderContext({ pieces: board, dirtyLayers: DirtyLayer.Board }),
			layer
		);
		expect(layer.children.length).toBe(countBefore);
	});

	it('renders when DirtyLayer.Pieces is set', () => {
		const pieces = createMainRendererPieces(resolver);
		const layer = createPiecesLayer();
		const board = new Uint8Array(SQUARE_COUNT);
		board[0] = PieceCode.WhiteKing;
		board[7] = PieceCode.BlackQueen;

		pieces.render(
			createPiecesRenderContext({ pieces: board, dirtyLayers: DirtyLayer.Pieces }),
			layer
		);

		expect(layer.children.length).toBe(2);
	});
});

describe('pieces renderer – basic use element creation', () => {
	it('creates use nodes only for occupied squares', () => {
		const pieces = createMainRendererPieces(resolver);
		const layer = createPiecesLayer();
		const board = new Uint8Array(SQUARE_COUNT);
		board[0] = PieceCode.WhiteRook;
		board[4] = PieceCode.WhiteKing;
		board[63] = PieceCode.BlackKing;

		pieces.render(createPiecesRenderContext({ pieces: board }), layer);

		expect(layer.children.length).toBe(3);
		for (const child of Array.from(layer.children)) {
			expect(child.tagName).toBe('use');
		}
	});

	it('does not create use nodes for empty squares', () => {
		const pieces = createMainRendererPieces(resolver);
		const layer = createPiecesLayer();
		const board = new Uint8Array(SQUARE_COUNT); // all empty

		pieces.render(createPiecesRenderContext({ pieces: board }), layer);

		expect(layer.children.length).toBe(0);
	});

	it('uses the resolver symbol href as href', () => {
		const pieces = createMainRendererPieces(resolver);
		const layer = createPiecesLayer();
		const board = new Uint8Array(SQUARE_COUNT);
		board[0] = PieceCode.WhiteKing;

		pieces.render(createPiecesRenderContext({ pieces: board }), layer);

		const el = layer.children[0];
		expect(el.getAttribute('href')).toBe(resolver.getHref(PieceCode.WhiteKing));
	});

	it('sets data-chessboard-id as piece-{pieceCode}-{sq}', () => {
		const pieces = createMainRendererPieces(resolver);
		const layer = createPiecesLayer();
		const board = new Uint8Array(SQUARE_COUNT);
		board[4] = PieceCode.WhiteKing;
		board[60] = PieceCode.BlackKing;

		pieces.render(createPiecesRenderContext({ pieces: board }), layer);

		expect(queryByDataChessboardId(layer, `piece-${PieceCode.WhiteKing}-4`)).not.toBeNull();
		expect(queryByDataChessboardId(layer, `piece-${PieceCode.BlackKing}-60`)).not.toBeNull();
	});

	it('positions each use element from geometry.getSquareRect', () => {
		const pieces = createMainRendererPieces(resolver);
		const layer = createPiecesLayer();
		const board = new Uint8Array(SQUARE_COUNT);
		board[0] = PieceCode.WhiteRook;

		// 400px scene → squareSize = 50, sq 0 = a1 → white orientation: x=0, y=350
		pieces.render(createPiecesRenderContext({ pieces: board, sceneSize: 400 }), layer);

		const el = layer.children[0];
		expect(el.getAttribute('x')).toBe('0');
		expect(el.getAttribute('y')).toBe('350');
		expect(el.getAttribute('width')).toBe('50');
		expect(el.getAttribute('height')).toBe('50');
	});

	it('all rendered use elements are prefixed with piece- in data-chessboard-id', () => {
		const pieces = createMainRendererPieces(resolver);
		const layer = createPiecesLayer();
		const board = new Uint8Array(SQUARE_COUNT);
		board[0] = PieceCode.WhitePawn;
		board[8] = PieceCode.BlackBishop;
		board[63] = PieceCode.BlackKing;

		pieces.render(createPiecesRenderContext({ pieces: board }), layer);

		const all = queryAllByDataChessboardIdPrefix(layer, 'piece-');
		expect(all).toHaveLength(3);
	});
});
