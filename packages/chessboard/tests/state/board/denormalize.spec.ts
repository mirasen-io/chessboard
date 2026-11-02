import { describe, expect, it } from 'vitest';
import {
	denormalizeColorShort,
	denormalizeMove,
	denormalizeMoveBase,
	denormalizeMoveCaptured,
	denormalizePieceString,
	denormalizeRolePromotionShort,
	denormalizeRoleShort,
	denormalizeSquare
} from '../../../src/state/board/denormalize.js';
import { normalizeSquare } from '../../../src/state/board/normalize.js';
import {
	ColorCode,
	PieceCode,
	RoleCode,
	type Move,
	type MoveBase,
	type MoveCaptured,
	type Square
} from '../../../src/state/board/types/internal.js';

describe('denormalizeSquare', () => {
	it('converts index to algebraic string', () => {
		expect(denormalizeSquare(0 as Square)).toBe('a1');
		expect(denormalizeSquare(63 as Square)).toBe('h8');
		expect(denormalizeSquare(12 as Square)).toBe('e2');
		expect(denormalizeSquare(27 as Square)).toBe('d4');
	});

	it('throws for invalid square index', () => {
		expect(() => denormalizeSquare(-1 as Square)).toThrowError(RangeError);
		expect(() => denormalizeSquare(64 as Square)).toThrowError(RangeError);
	});

	it('round-trips with normalizeSquare for representative squares', () => {
		const squares = ['a1', 'h8', 'e2', 'd4', 'a8', 'h1'] as const;
		for (const s of squares) {
			expect(denormalizeSquare(normalizeSquare(s))).toBe(s);
		}
	});
});

describe('denormalizeColorShort', () => {
	it('converts color codes to short strings', () => {
		expect(denormalizeColorShort(ColorCode.White)).toBe('w');
		expect(denormalizeColorShort(ColorCode.Black)).toBe('b');
	});

	it('throws for invalid color code', () => {
		expect(() => denormalizeColorShort(99 as never)).toThrowError(RangeError);
	});
});

describe('denormalizeRoleShort', () => {
	it('converts all role codes to short strings', () => {
		expect(denormalizeRoleShort(RoleCode.Pawn)).toBe('P');
		expect(denormalizeRoleShort(RoleCode.Knight)).toBe('N');
		expect(denormalizeRoleShort(RoleCode.Bishop)).toBe('B');
		expect(denormalizeRoleShort(RoleCode.Rook)).toBe('R');
		expect(denormalizeRoleShort(RoleCode.Queen)).toBe('Q');
		expect(denormalizeRoleShort(RoleCode.King)).toBe('K');
	});

	it('throws for invalid role code', () => {
		expect(() => denormalizeRoleShort(99 as never)).toThrowError(RangeError);
	});
});

describe('denormalizeRolePromotionShort', () => {
	it('converts valid promotion role codes', () => {
		expect(denormalizeRolePromotionShort(RoleCode.Knight)).toBe('N');
		expect(denormalizeRolePromotionShort(RoleCode.Bishop)).toBe('B');
		expect(denormalizeRolePromotionShort(RoleCode.Rook)).toBe('R');
		expect(denormalizeRolePromotionShort(RoleCode.Queen)).toBe('Q');
	});

	it('throws for King and Pawn role codes', () => {
		expect(() => denormalizeRolePromotionShort(RoleCode.King as never)).toThrowError(RangeError);
		expect(() => denormalizeRolePromotionShort(RoleCode.Pawn as never)).toThrowError(RangeError);
	});
});

describe('denormalizePieceString', () => {
	it('converts representative piece codes to strings', () => {
		expect(denormalizePieceString(PieceCode.WhitePawn)).toBe('wP');
		expect(denormalizePieceString(PieceCode.WhiteKing)).toBe('wK');
		expect(denormalizePieceString(PieceCode.BlackQueen)).toBe('bQ');
		expect(denormalizePieceString(PieceCode.BlackKing)).toBe('bK');
	});
});

describe('denormalizeMoveBase', () => {
	it('converts a move base to output format', () => {
		const move: MoveBase = {
			from: normalizeSquare('e2'),
			to: normalizeSquare('e4'),
			piece: PieceCode.WhitePawn
		};
		const result = denormalizeMoveBase(move);
		expect(result.from).toBe('e2');
		expect(result.to).toBe('e4');
		expect(result.piece).toBe('wP');
	});
});

describe('denormalizeMoveCaptured', () => {
	it('converts captured info to output format', () => {
		const captured: MoveCaptured = {
			square: normalizeSquare('d5'),
			piece: PieceCode.BlackPawn
		};
		const result = denormalizeMoveCaptured(captured);
		expect(result.square).toBe('d5');
		expect(result.piece).toBe('bP');
	});
});

describe('denormalizeMove', () => {
	it('converts a minimal move', () => {
		const move: Move = {
			from: normalizeSquare('e2'),
			to: normalizeSquare('e4'),
			piece: PieceCode.WhitePawn
		};
		const result = denormalizeMove(move);
		expect(result.from).toBe('e2');
		expect(result.to).toBe('e4');
		expect(result.piece).toBe('wP');
		expect(result.captured).toBeUndefined();
		expect(result.promotedTo).toBeUndefined();
		expect(result.secondary).toBeUndefined();
	});

	it('converts a move with all optional fields', () => {
		const move: Move = {
			from: normalizeSquare('e7'),
			to: normalizeSquare('d8'),
			piece: PieceCode.WhitePawn,
			promotedTo: RoleCode.Queen,
			captured: {
				square: normalizeSquare('d8'),
				piece: PieceCode.BlackRook
			},
			secondary: {
				from: normalizeSquare('h1'),
				to: normalizeSquare('f1'),
				piece: PieceCode.WhiteRook
			}
		};
		const result = denormalizeMove(move);
		expect(result.from).toBe('e7');
		expect(result.to).toBe('d8');
		expect(result.piece).toBe('wP');
		expect(result.promotedTo).toBe('Q');
		expect(result.captured).toEqual({ square: 'd8', piece: 'bR' });
		expect(result.secondary).toEqual({ from: 'h1', to: 'f1', piece: 'wR' });
	});
});
