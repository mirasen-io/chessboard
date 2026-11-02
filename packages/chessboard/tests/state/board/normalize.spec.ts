import { describe, expect, it } from 'vitest';
import {
	normalizeColor,
	normalizeMoveRequest,
	normalizePiece,
	normalizeRole,
	normalizeRolePromotion,
	normalizeSquare
} from '../../../src/state/board/normalize.js';
import { ColorCode, PieceCode, RoleCode } from '../../../src/state/board/types/internal.js';

describe('normalizeColor', () => {
	it('normalizes valid color inputs', () => {
		expect(normalizeColor('w')).toBe(ColorCode.White);
		expect(normalizeColor('b')).toBe(ColorCode.Black);
		expect(normalizeColor('white')).toBe(ColorCode.White);
		expect(normalizeColor('black')).toBe(ColorCode.Black);
	});

	it('throws on invalid input', () => {
		expect(() => normalizeColor('x' as never)).toThrowError(RangeError);
	});
});

describe('normalizeRole', () => {
	it('normalizes short role inputs', () => {
		expect(normalizeRole('P')).toBe(RoleCode.Pawn);
		expect(normalizeRole('N')).toBe(RoleCode.Knight);
		expect(normalizeRole('B')).toBe(RoleCode.Bishop);
		expect(normalizeRole('R')).toBe(RoleCode.Rook);
		expect(normalizeRole('Q')).toBe(RoleCode.Queen);
		expect(normalizeRole('K')).toBe(RoleCode.King);
	});

	it('normalizes long role inputs', () => {
		expect(normalizeRole('pawn')).toBe(RoleCode.Pawn);
		expect(normalizeRole('knight')).toBe(RoleCode.Knight);
		expect(normalizeRole('bishop')).toBe(RoleCode.Bishop);
		expect(normalizeRole('rook')).toBe(RoleCode.Rook);
		expect(normalizeRole('queen')).toBe(RoleCode.Queen);
		expect(normalizeRole('king')).toBe(RoleCode.King);
	});

	it('throws on invalid input', () => {
		expect(() => normalizeRole('X' as never)).toThrowError(RangeError);
	});
});

describe('normalizePiece', () => {
	it('normalizes string form', () => {
		expect(normalizePiece('wK')).toBe(PieceCode.WhiteKing);
		expect(normalizePiece('bP')).toBe(PieceCode.BlackPawn);
	});

	it('normalizes short object form', () => {
		expect(normalizePiece({ color: 'w', role: 'K' })).toBe(PieceCode.WhiteKing);
		expect(normalizePiece({ color: 'b', role: 'Q' })).toBe(PieceCode.BlackQueen);
	});

	it('normalizes long object form', () => {
		expect(normalizePiece({ color: 'white', role: 'king' })).toBe(PieceCode.WhiteKing);
		expect(normalizePiece({ color: 'black', role: 'pawn' })).toBe(PieceCode.BlackPawn);
	});
});

describe('normalizeRolePromotion', () => {
	it('accepts valid promotion roles', () => {
		expect(normalizeRolePromotion('N')).toBe(RoleCode.Knight);
		expect(normalizeRolePromotion('B')).toBe(RoleCode.Bishop);
		expect(normalizeRolePromotion('R')).toBe(RoleCode.Rook);
		expect(normalizeRolePromotion('Q')).toBe(RoleCode.Queen);
		expect(normalizeRolePromotion('queen')).toBe(RoleCode.Queen);
	});

	it('throws for king and pawn', () => {
		expect(() => normalizeRolePromotion('K' as never)).toThrowError(RangeError);
		expect(() => normalizeRolePromotion('pawn' as never)).toThrowError(RangeError);
	});
});

describe('normalizeSquare', () => {
	it('normalizes algebraic squares to indices', () => {
		expect(normalizeSquare('a1')).toBe(0);
		expect(normalizeSquare('h8')).toBe(63);
		expect(normalizeSquare('e2')).toBe(12);
		expect(normalizeSquare('d4')).toBe(27);
	});
});

describe('normalizeMoveRequest', () => {
	it('normalizes a minimal move', () => {
		const result = normalizeMoveRequest({ from: 'e2', to: 'e4' });
		expect(result.from).toBe(12);
		expect(result.to).toBe(28);
		expect(result.capturedSquare).toBeUndefined();
		expect(result.promotedTo).toBeUndefined();
		expect(result.secondary).toBeUndefined();
	});

	it('normalizes a move with capturedSquare', () => {
		const result = normalizeMoveRequest({ from: 'e5', to: 'd6', capturedSquare: 'd5' });
		expect(result.capturedSquare).toBe(normalizeSquare('d5'));
	});

	it('normalizes a move with promotedTo', () => {
		const result = normalizeMoveRequest({ from: 'e7', to: 'e8', promotedTo: 'Q' });
		expect(result.promotedTo).toBe(RoleCode.Queen);
	});

	it('normalizes a move with secondary', () => {
		const result = normalizeMoveRequest({
			from: 'e1',
			to: 'g1',
			secondary: { from: 'h1', to: 'f1' }
		});
		expect(result.secondary).toBeDefined();
		expect(result.secondary!.from).toBe(normalizeSquare('h1'));
		expect(result.secondary!.to).toBe(normalizeSquare('f1'));
	});
});
