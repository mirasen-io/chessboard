import { describe, expect, it } from 'vitest';
import {
	assertValidRoleCode,
	assertValidSquare,
	isBlackPieceCode,
	isColor,
	isColorShort,
	isEmptyPieceCode,
	isFile,
	isNonEmptyPieceCode,
	isNormalizedMoveRequest,
	isOccupied,
	isPiece,
	isPieceShort,
	isPieceString,
	isPositionMap,
	isPositionMapShort,
	isPositionMapString,
	isRank,
	isRole,
	isRolePromotionCode,
	isRoleShort,
	isSquareString,
	isValidSquare,
	isWhitePieceCode,
	piecePositionsEqual
} from '../../../src/state/board/check.js';
import { normalizeSquare } from '../../../src/state/board/normalize.js';
import {
	ColorCode,
	PieceCode,
	RoleCode,
	SQUARE_COUNT
} from '../../../src/state/board/types/internal.js';
import type { BoardStateSnapshot } from '../../../src/state/board/types/main.js';

function makeSnapshot(overrides: Partial<BoardStateSnapshot> = {}): BoardStateSnapshot {
	return {
		pieces: overrides.pieces ?? new Uint8Array(SQUARE_COUNT),
		turn: overrides.turn ?? ColorCode.White,
		positionEpoch: overrides.positionEpoch ?? 0
	};
}

describe('square/rank/file validation', () => {
	it('isValidSquare accepts 0..63 integers', () => {
		expect(isValidSquare(0)).toBe(true);
		expect(isValidSquare(63)).toBe(true);
		expect(isValidSquare(32)).toBe(true);
	});

	it('isValidSquare rejects out-of-range and non-integers', () => {
		expect(isValidSquare(-1)).toBe(false);
		expect(isValidSquare(64)).toBe(false);
		expect(isValidSquare(0.5)).toBe(false);
		expect(isValidSquare(NaN)).toBe(false);
	});

	it('isRank accepts 0..7 integers', () => {
		expect(isRank(0)).toBe(true);
		expect(isRank(7)).toBe(true);
		expect(isRank(-1)).toBe(false);
		expect(isRank(8)).toBe(false);
	});

	it('isFile accepts 0..7 integers', () => {
		expect(isFile(0)).toBe(true);
		expect(isFile(7)).toBe(true);
		expect(isFile(-1)).toBe(false);
		expect(isFile(8)).toBe(false);
	});

	it('assertValidSquare passes for valid and throws for invalid', () => {
		expect(() => assertValidSquare(0)).not.toThrow();
		expect(() => assertValidSquare(63)).not.toThrow();
		expect(() => assertValidSquare(-1)).toThrowError(RangeError);
		expect(() => assertValidSquare(64)).toThrowError(RangeError);
	});
});

describe('piece code checks', () => {
	it('isEmptyPieceCode', () => {
		expect(isEmptyPieceCode(PieceCode.Empty)).toBe(true);
		expect(isEmptyPieceCode(PieceCode.WhitePawn)).toBe(false);
		expect(isEmptyPieceCode(PieceCode.BlackKing)).toBe(false);
	});

	it('isNonEmptyPieceCode', () => {
		expect(isNonEmptyPieceCode(PieceCode.Empty)).toBe(false);
		expect(isNonEmptyPieceCode(PieceCode.WhitePawn)).toBe(true);
		expect(isNonEmptyPieceCode(PieceCode.BlackKing)).toBe(true);
	});
});

describe('white/black piece code checks', () => {
	it('isWhitePieceCode returns true for white pieces', () => {
		expect(isWhitePieceCode(PieceCode.WhitePawn)).toBe(true);
		expect(isWhitePieceCode(PieceCode.WhiteKing)).toBe(true);
	});

	it('isWhitePieceCode returns false for black pieces', () => {
		expect(isWhitePieceCode(PieceCode.BlackPawn)).toBe(false);
		expect(isWhitePieceCode(PieceCode.BlackKing)).toBe(false);
	});

	it('isBlackPieceCode returns true for black pieces', () => {
		expect(isBlackPieceCode(PieceCode.BlackPawn)).toBe(true);
		expect(isBlackPieceCode(PieceCode.BlackKing)).toBe(true);
	});

	it('isBlackPieceCode returns false for white pieces', () => {
		expect(isBlackPieceCode(PieceCode.WhitePawn)).toBe(false);
		expect(isBlackPieceCode(PieceCode.WhiteKing)).toBe(false);
	});
});

describe('string/input validators', () => {
	it('isPieceString', () => {
		expect(isPieceString('wK')).toBe(true);
		expect(isPieceString('bP')).toBe(true);
		expect(isPieceString('wX')).toBe(false);
		expect(isPieceString('')).toBe(false);
		expect(isPieceString('wKx')).toBe(false);
		expect(isPieceString(42)).toBe(false);
	});

	it('isSquareString', () => {
		expect(isSquareString('a1')).toBe(true);
		expect(isSquareString('h8')).toBe(true);
		expect(isSquareString('a9')).toBe(false);
		expect(isSquareString('i1')).toBe(false);
		expect(isSquareString('')).toBe(false);
		expect(isSquareString(42)).toBe(false);
	});

	it('isColorShort', () => {
		expect(isColorShort('w')).toBe(true);
		expect(isColorShort('b')).toBe(true);
		expect(isColorShort('x')).toBe(false);
		expect(isColorShort('white')).toBe(false);
	});

	it('isRoleShort', () => {
		expect(isRoleShort('K')).toBe(true);
		expect(isRoleShort('P')).toBe(true);
		expect(isRoleShort('X')).toBe(false);
		expect(isRoleShort('king')).toBe(false);
	});

	it('isColor', () => {
		expect(isColor('white')).toBe(true);
		expect(isColor('black')).toBe(true);
		expect(isColor('w')).toBe(false);
	});

	it('isRole', () => {
		expect(isRole('king')).toBe(true);
		expect(isRole('pawn')).toBe(true);
		expect(isRole('K')).toBe(false);
	});

	it('isPieceShort', () => {
		expect(isPieceShort({ color: 'w', role: 'K' })).toBe(true);
		expect(isPieceShort({ color: 'b', role: 'P' })).toBe(true);
		expect(isPieceShort({ color: 'white', role: 'king' })).toBe(false);
		expect(isPieceShort('wK')).toBe(false);
		expect(isPieceShort(null)).toBe(false);
	});

	it('isPiece', () => {
		expect(isPiece({ color: 'white', role: 'king' })).toBe(true);
		expect(isPiece({ color: 'black', role: 'pawn' })).toBe(true);
		expect(isPiece({ color: 'w', role: 'K' })).toBe(false);
		expect(isPiece('wK')).toBe(false);
		expect(isPiece(null)).toBe(false);
	});
});

describe('position map validators', () => {
	it('isPositionMapString', () => {
		expect(isPositionMapString({ e2: 'wP', d7: 'bP' })).toBe(true);
		expect(isPositionMapString({ e2: 'wX' as never })).toBe(false);
	});

	it('isPositionMapShort', () => {
		expect(isPositionMapShort({ e2: { color: 'w', role: 'P' } })).toBe(true);
		expect(isPositionMapShort({ e2: 'wP' })).toBe(false);
	});

	it('isPositionMap', () => {
		expect(isPositionMap({ e2: { color: 'white', role: 'pawn' } })).toBe(true);
		expect(isPositionMap({ e2: { color: 'w', role: 'P' } })).toBe(false);
	});
});

describe('isRolePromotionCode', () => {
	it('accepts Knight, Bishop, Rook, Queen', () => {
		expect(isRolePromotionCode(RoleCode.Knight)).toBe(true);
		expect(isRolePromotionCode(RoleCode.Bishop)).toBe(true);
		expect(isRolePromotionCode(RoleCode.Rook)).toBe(true);
		expect(isRolePromotionCode(RoleCode.Queen)).toBe(true);
	});

	it('rejects King and Pawn', () => {
		expect(isRolePromotionCode(RoleCode.King)).toBe(false);
		expect(isRolePromotionCode(RoleCode.Pawn)).toBe(false);
	});
});

describe('assertValidRoleCode', () => {
	it('passes for valid promotion codes', () => {
		expect(() => assertValidRoleCode(RoleCode.Queen)).not.toThrow();
	});

	it('throws for non-promotion codes', () => {
		expect(() => assertValidRoleCode(RoleCode.King)).toThrowError(RangeError);
		expect(() => assertValidRoleCode(RoleCode.Pawn)).toThrowError(RangeError);
	});
});

describe('isNormalizedMoveRequest', () => {
	it('returns true for a numeric MoveRequest', () => {
		expect(
			isNormalizedMoveRequest({
				from: normalizeSquare('e2'),
				to: normalizeSquare('e4')
			})
		).toBe(true);
	});

	it('returns true for a MoveRequest with all optional numeric fields', () => {
		expect(
			isNormalizedMoveRequest({
				from: normalizeSquare('e1'),
				to: normalizeSquare('g1'),
				capturedSquare: undefined,
				promotedTo: undefined,
				secondary: {
					from: normalizeSquare('h1'),
					to: normalizeSquare('f1')
				}
			})
		).toBe(true);
	});

	it('returns false for a string-based MoveRequestInput', () => {
		expect(isNormalizedMoveRequest({ from: 'e2', to: 'e4' } as never)).toBe(false);
	});
});

describe('isOccupied', () => {
	it('returns true for occupied square', () => {
		const pieces = new Uint8Array(SQUARE_COUNT);
		pieces[normalizeSquare('e1')] = PieceCode.WhiteKing;
		const snapshot = makeSnapshot({ pieces });
		expect(isOccupied(snapshot, normalizeSquare('e1'))).toBe(true);
	});

	it('returns false for empty square', () => {
		const snapshot = makeSnapshot();
		expect(isOccupied(snapshot, normalizeSquare('e4'))).toBe(false);
	});
});

describe('piecePositionsEqual', () => {
	it('returns true for same epoch and identical pieces', () => {
		const pieces = new Uint8Array(SQUARE_COUNT);
		pieces[0] = PieceCode.WhiteRook;
		const a = makeSnapshot({ pieces, positionEpoch: 5 });
		const b = makeSnapshot({ pieces: new Uint8Array(pieces), positionEpoch: 5 });
		expect(piecePositionsEqual(a, b)).toBe(true);
	});

	it('returns false for different epoch even with same pieces', () => {
		const pieces = new Uint8Array(SQUARE_COUNT);
		const a = makeSnapshot({ pieces, positionEpoch: 1 });
		const b = makeSnapshot({ pieces: new Uint8Array(pieces), positionEpoch: 2 });
		expect(piecePositionsEqual(a, b)).toBe(false);
	});

	it('returns false for same epoch but different pieces', () => {
		const piecesA = new Uint8Array(SQUARE_COUNT);
		const piecesB = new Uint8Array(SQUARE_COUNT);
		piecesB[0] = PieceCode.WhiteRook;
		const a = makeSnapshot({ pieces: piecesA, positionEpoch: 0 });
		const b = makeSnapshot({ pieces: piecesB, positionEpoch: 0 });
		expect(piecePositionsEqual(a, b)).toBe(false);
	});
});
