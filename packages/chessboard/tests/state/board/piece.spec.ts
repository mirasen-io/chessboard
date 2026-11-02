import { describe, expect, it } from 'vitest';
import { fromPieceCode, toPieceCode } from '../../../src/state/board/piece.js';
import {
	ALL_NON_EMPTY_PIECE_CODES,
	ColorCode,
	PieceCode,
	RoleCode
} from '../../../src/state/board/types/internal.js';

describe('toPieceCode', () => {
	it('produces correct codes for representative pieces', () => {
		expect(toPieceCode(RoleCode.Pawn, ColorCode.White)).toBe(PieceCode.WhitePawn);
		expect(toPieceCode(RoleCode.King, ColorCode.White)).toBe(PieceCode.WhiteKing);
		expect(toPieceCode(RoleCode.Pawn, ColorCode.Black)).toBe(PieceCode.BlackPawn);
		expect(toPieceCode(RoleCode.Queen, ColorCode.Black)).toBe(PieceCode.BlackQueen);
		expect(toPieceCode(RoleCode.King, ColorCode.Black)).toBe(PieceCode.BlackKing);
	});
});

describe('fromPieceCode', () => {
	it('decomposes representative non-empty codes correctly', () => {
		expect(fromPieceCode(PieceCode.WhitePawn)).toEqual({
			role: RoleCode.Pawn,
			color: ColorCode.White
		});
		expect(fromPieceCode(PieceCode.BlackQueen)).toEqual({
			role: RoleCode.Queen,
			color: ColorCode.Black
		});
		expect(fromPieceCode(PieceCode.WhiteKing)).toEqual({
			role: RoleCode.King,
			color: ColorCode.White
		});
	});

	it('round-trips with toPieceCode for all 12 non-empty codes', () => {
		for (const code of ALL_NON_EMPTY_PIECE_CODES) {
			const decoded = fromPieceCode(code);
			expect(toPieceCode(decoded.role, decoded.color)).toBe(code);
		}
	});

	it('throws RangeError for PieceCode.Empty', () => {
		expect(() => fromPieceCode(PieceCode.Empty as never)).toThrowError(RangeError);
	});
});
