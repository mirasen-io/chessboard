import { describe, expect, it } from 'vitest';
import { normalizeSquare } from '../../../src/state/board/normalize.js';
import {
	boardParsePiecePositionInput,
	boardParsePosition
} from '../../../src/state/board/position.js';
import { ColorCode, PieceCode, SQUARE_COUNT } from '../../../src/state/board/types/internal.js';

describe('boardParsePosition', () => {
	it('parses "start" to standard initial position with White turn', () => {
		const result = boardParsePosition('start');

		expect(result.turn).toBe(ColorCode.White);
		expect(result.pieces).toBeInstanceOf(Uint8Array);
		expect(result.pieces.length).toBe(SQUARE_COUNT);

		// Verify a few known squares in the starting position
		// a1 = index 0 = White Rook (PieceCode 4)
		expect(result.pieces[normalizeSquare('a1')]).toBe(PieceCode.WhiteRook);
		// e1 = White King
		expect(result.pieces[normalizeSquare('e1')]).toBe(PieceCode.WhiteKing);
		// e2 = White Pawn
		expect(result.pieces[normalizeSquare('e2')]).toBe(PieceCode.WhitePawn);
		// e8 = Black King
		expect(result.pieces[normalizeSquare('e8')]).toBe(PieceCode.BlackKing);
		// d8 = Black Queen
		expect(result.pieces[normalizeSquare('d8')]).toBe(PieceCode.BlackQueen);
		// a7 = Black Pawn
		expect(result.pieces[normalizeSquare('a7')]).toBe(PieceCode.BlackPawn);

		// Verify an empty middle square
		expect(result.pieces[normalizeSquare('e4')]).toBe(PieceCode.Empty);

		// Count non-empty squares: should be 32
		let occupied = 0;
		for (let i = 0; i < SQUARE_COUNT; i++) {
			if (result.pieces[i] !== PieceCode.Empty) occupied++;
		}
		expect(occupied).toBe(32);
	});

	it('parses { pieces: "start", turn: "black" } to start position with Black turn', () => {
		const result = boardParsePosition({ pieces: 'start', turn: 'black' });

		expect(result.turn).toBe(ColorCode.Black);
		// Pieces should match start position
		expect(result.pieces[normalizeSquare('e1')]).toBe(PieceCode.WhiteKing);
		expect(result.pieces[normalizeSquare('e8')]).toBe(PieceCode.BlackKing);
	});

	it('parses {} to default start pieces with White turn', () => {
		const result = boardParsePosition({});

		expect(result.turn).toBe(ColorCode.White);
		// Default pieces = 'start'
		expect(result.pieces[normalizeSquare('e1')]).toBe(PieceCode.WhiteKing);
		expect(result.pieces[normalizeSquare('e8')]).toBe(PieceCode.BlackKing);

		let occupied = 0;
		for (let i = 0; i < SQUARE_COUNT; i++) {
			if (result.pieces[i] !== PieceCode.Empty) occupied++;
		}
		expect(occupied).toBe(32);
	});

	it('parses { pieces: { e2: "wP", d7: "bP" } } to sparse placement', () => {
		const result = boardParsePosition({ pieces: { e2: 'wP', d7: 'bP' } });

		expect(result.turn).toBe(ColorCode.White);
		expect(result.pieces[normalizeSquare('e2')]).toBe(PieceCode.WhitePawn);
		expect(result.pieces[normalizeSquare('d7')]).toBe(PieceCode.BlackPawn);

		// All other squares should be empty
		let occupied = 0;
		for (let i = 0; i < SQUARE_COUNT; i++) {
			if (result.pieces[i] !== PieceCode.Empty) occupied++;
		}
		expect(occupied).toBe(2);
	});

	it('parses standard starting FEN to match "start" output', () => {
		const startFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
		const fenResult = boardParsePosition(startFen);
		const startResult = boardParsePosition('start');

		expect(fenResult.turn).toBe(startResult.turn);
		expect(Array.from(fenResult.pieces)).toEqual(Array.from(startResult.pieces));
	});
});

describe('boardParsePiecePositionInput', () => {
	it('parses "start" to the standard starting piece array', () => {
		const result = boardParsePiecePositionInput('start');

		expect(result).toBeInstanceOf(Uint8Array);
		expect(result.length).toBe(SQUARE_COUNT);
		expect(result[normalizeSquare('e1')]).toBe(PieceCode.WhiteKing);
		expect(result[normalizeSquare('e8')]).toBe(PieceCode.BlackKing);

		let occupied = 0;
		for (let i = 0; i < SQUARE_COUNT; i++) {
			if (result[i] !== PieceCode.Empty) occupied++;
		}
		expect(occupied).toBe(32);
	});

	it('parses a sparse record to correct placement', () => {
		const result = boardParsePiecePositionInput({ a1: 'wR', h8: 'bK' });

		expect(result[normalizeSquare('a1')]).toBe(PieceCode.WhiteRook);
		expect(result[normalizeSquare('h8')]).toBe(PieceCode.BlackKing);

		let occupied = 0;
		for (let i = 0; i < SQUARE_COUNT; i++) {
			if (result[i] !== PieceCode.Empty) occupied++;
		}
		expect(occupied).toBe(2);
	});
});
