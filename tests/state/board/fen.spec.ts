import { describe, expect, it } from 'vitest';
import { parseFen } from '../../../src/state/board/fen/main.js';
import { normalizeSquare } from '../../../src/state/board/normalize.js';
import { ColorCode, PieceCode, SQUARE_COUNT } from '../../../src/state/board/types/internal.js';

function countOccupied(pieces: Uint8Array): number {
	let count = 0;
	for (let i = 0; i < pieces.length; i++) {
		if (pieces[i] !== PieceCode.Empty) count++;
	}
	return count;
}

describe('parseFen', () => {
	describe('valid FEN', () => {
		it('parses the standard starting position', () => {
			const result = parseFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');

			expect(result.turn).toBe(ColorCode.White);
			expect(result.pieces).toBeInstanceOf(Uint8Array);
			expect(result.pieces.length).toBe(SQUARE_COUNT);

			expect(result.pieces[normalizeSquare('a1')]).toBe(PieceCode.WhiteRook);
			expect(result.pieces[normalizeSquare('b1')]).toBe(PieceCode.WhiteKnight);
			expect(result.pieces[normalizeSquare('c1')]).toBe(PieceCode.WhiteBishop);
			expect(result.pieces[normalizeSquare('d1')]).toBe(PieceCode.WhiteQueen);
			expect(result.pieces[normalizeSquare('e1')]).toBe(PieceCode.WhiteKing);
			expect(result.pieces[normalizeSquare('f1')]).toBe(PieceCode.WhiteBishop);
			expect(result.pieces[normalizeSquare('g1')]).toBe(PieceCode.WhiteKnight);
			expect(result.pieces[normalizeSquare('h1')]).toBe(PieceCode.WhiteRook);
			expect(result.pieces[normalizeSquare('e2')]).toBe(PieceCode.WhitePawn);
			expect(result.pieces[normalizeSquare('a7')]).toBe(PieceCode.BlackPawn);
			expect(result.pieces[normalizeSquare('e8')]).toBe(PieceCode.BlackKing);
			expect(result.pieces[normalizeSquare('d8')]).toBe(PieceCode.BlackQueen);
			expect(result.pieces[normalizeSquare('e4')]).toBe(PieceCode.Empty);
			expect(result.pieces[normalizeSquare('d5')]).toBe(PieceCode.Empty);
			expect(countOccupied(result.pieces)).toBe(32);
		});

		it('parses side to move', () => {
			const result = parseFen('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1');

			expect(result.turn).toBe(ColorCode.Black);
			expect(result.pieces[normalizeSquare('e4')]).toBe(PieceCode.WhitePawn);
			expect(result.pieces[normalizeSquare('e2')]).toBe(PieceCode.Empty);
		});

		it('parses a mid-game position', () => {
			const fen = 'r1bqkb1r/1p2pppp/p1np1n2/8/3NP3/2N5/PPP2PPP/R1BQKB1R w KQkq - 0 6';
			const result = parseFen(fen);

			expect(result.turn).toBe(ColorCode.White);
			expect(result.pieces[normalizeSquare('d4')]).toBe(PieceCode.WhiteKnight);
			expect(result.pieces[normalizeSquare('c3')]).toBe(PieceCode.WhiteKnight);
			expect(result.pieces[normalizeSquare('e4')]).toBe(PieceCode.WhitePawn);
			expect(result.pieces[normalizeSquare('f6')]).toBe(PieceCode.BlackKnight);
			expect(result.pieces[normalizeSquare('c6')]).toBe(PieceCode.BlackKnight);
			expect(result.pieces[normalizeSquare('d6')]).toBe(PieceCode.BlackPawn);
			expect(result.pieces[normalizeSquare('a6')]).toBe(PieceCode.BlackPawn);
			expect(result.pieces[normalizeSquare('a8')]).toBe(PieceCode.BlackRook);
			expect(result.pieces[normalizeSquare('d8')]).toBe(PieceCode.BlackQueen);
			expect(result.pieces[normalizeSquare('b8')]).toBe(PieceCode.Empty);
		});

		it('parses an empty board', () => {
			const result = parseFen('8/8/8/8/8/8/8/8 w - - 0 1');

			expect(result.turn).toBe(ColorCode.White);
			expect(countOccupied(result.pieces)).toBe(0);
		});

		it('trims BOM and surrounding whitespace', () => {
			const fen = '\uFEFF   rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR   w   KQkq - 0 1  ';
			const result = parseFen(fen);

			expect(result.turn).toBe(ColorCode.White);
			expect(result.pieces[normalizeSquare('e1')]).toBe(PieceCode.WhiteKing);
			expect(result.pieces[normalizeSquare('e8')]).toBe(PieceCode.BlackKing);
			expect(countOccupied(result.pieces)).toBe(32);
		});

		it('ignores extra FEN fields beyond placement and turn', () => {
			const resultMin = parseFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w');
			const resultFull = parseFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');

			expect(resultMin.turn).toBe(resultFull.turn);
			expect(Array.from(resultMin.pieces)).toEqual(Array.from(resultFull.pieces));
		});

		it('parses a sparse position with only kings', () => {
			const result = parseFen('4k3/8/8/8/8/8/8/4K3 w - - 0 1');

			expect(result.turn).toBe(ColorCode.White);
			expect(result.pieces[normalizeSquare('e1')]).toBe(PieceCode.WhiteKing);
			expect(result.pieces[normalizeSquare('e8')]).toBe(PieceCode.BlackKing);
			expect(countOccupied(result.pieces)).toBe(2);
		});
	});

	describe('invalid FEN', () => {
		it('rejects missing fields', () => {
			expect(() => parseFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR')).toThrow();
		});

		it('rejects invalid side to move', () => {
			expect(() => parseFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR x KQkq - 0 1')).toThrow();
		});

		it('rejects too few ranks', () => {
			expect(() => parseFen('rnbqkbnr/pppppppp/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')).toThrow();
		});

		it('rejects too many ranks', () => {
			expect(() =>
				parseFen('rnbqkbnr/pppppppp/8/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')
			).toThrow();
		});

		it('rejects invalid piece characters', () => {
			expect(() => parseFen('rnbqkxnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')).toThrow();
		});

		it('rejects rank overflow from too many pieces', () => {
			expect(() => parseFen('rnbqkbnrr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')).toThrow();
		});

		it('rejects rank underflow', () => {
			expect(() => parseFen('rnbqkbn/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')).toThrow();
		});

		it('rejects rank overflow from digit exceeding 8 files', () => {
			// rnbqk3r = 5 pieces + 3 empty + 1 piece = 9 files
			expect(() => parseFen('rnbqk3r/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')).toThrow();
		});
	});
});
