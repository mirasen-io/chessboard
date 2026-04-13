import { assertNever } from '../../utils/assert-never';
import type { Color, Piece, Role } from './types';

/**
 * Compact piece encoding
 * - 0 = empty
 * - 1..6 = white: pawn=1, knight=2, bishop=3, rook=4, queen=5, king=6
 * - 9..14 = black: same as white + 8
 */

export const enum PieceCodeBase {
	Empty = 0,
	Pawn = 1,
	Knight = 2,
	Bishop = 3,
	Rook = 4,
	Queen = 5,
	King = 6
}

const BLACK_SHIFT = 8;

export const enum PieceCode {
	Empty = PieceCodeBase.Empty,
	WhitePawn = PieceCodeBase.Pawn,
	WhiteKnight = PieceCodeBase.Knight,
	WhiteBishop = PieceCodeBase.Bishop,
	WhiteRook = PieceCodeBase.Rook,
	WhiteQueen = PieceCodeBase.Queen,
	WhiteKing = PieceCodeBase.King,
	BlackPawn = PieceCodeBase.Pawn + BLACK_SHIFT,
	BlackKnight = PieceCodeBase.Knight + BLACK_SHIFT,
	BlackBishop = PieceCodeBase.Bishop + BLACK_SHIFT,
	BlackRook = PieceCodeBase.Rook + BLACK_SHIFT,
	BlackQueen = PieceCodeBase.Queen + BLACK_SHIFT,
	BlackKing = PieceCodeBase.King + BLACK_SHIFT
}

export function encodePiece(piece: Piece): PieceCode {
	const base = roleToBase(piece.role);
	return piece.color === 'white' ? (base as unknown as PieceCode) : base + BLACK_SHIFT;
}

export function decodePiece(code: PieceCode): Piece | null {
	if (code <= PieceCodeBase.Empty) return null;
	const color: Color = code >= BLACK_SHIFT ? 'black' : 'white';
	const base = color === 'black' ? code - BLACK_SHIFT : code;
	return { color, role: baseToRole(base) };
}

export function isEmpty(code: PieceCode): boolean {
	return code === PieceCode.Empty;
}

export function isWhiteCode(code: PieceCode): boolean {
	return code > PieceCode.Empty && code < BLACK_SHIFT;
}

export function isBlackCode(code: PieceCode): boolean {
	return code >= BLACK_SHIFT;
}

function roleToBase(role: Role): PieceCodeBase {
	switch (role) {
		case 'pawn':
			return PieceCodeBase.Pawn;
		case 'knight':
			return PieceCodeBase.Knight;
		case 'bishop':
			return PieceCodeBase.Bishop;
		case 'rook':
			return PieceCodeBase.Rook;
		case 'queen':
			return PieceCodeBase.Queen;
		case 'king':
			return PieceCodeBase.King;
		default:
			assertNever(RangeError, 'Invalid role for encoding', role);
	}
}

function baseToRole(base: PieceCodeBase): Role {
	switch (base) {
		case PieceCodeBase.Pawn:
			return 'pawn';
		case PieceCodeBase.Knight:
			return 'knight';
		case PieceCodeBase.Bishop:
			return 'bishop';
		case PieceCodeBase.Rook:
			return 'rook';
		case PieceCodeBase.Queen:
			return 'queen';
		case PieceCodeBase.King:
			return 'king';
		default:
			assertNever(RangeError, 'Invalid base role code', base);
	}
}
