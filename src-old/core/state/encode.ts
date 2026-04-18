import { ColorCode } from '../../../src/state/board/types/internal';
import type { Color, Piece, Role } from './boardTypes';

/**
 * Compact piece encoding
 * - 0 = empty
 * - 1..6 = white: pawn=1, knight=2, bishop=3, rook=4, queen=5, king=6
 * - 9..14 = black: same as white + 8
 */

const enum Base {
	Empty = 0,
	Pawn = 1,
	Knight = 2,
	Bishop = 3,
	Rook = 4,
	Queen = 5,
	King = 6
}

export function encodePiece(piece: Piece): number {
	const base = roleToBase(piece.role);
	return piece.color === 'white' ? base : base + ColorCode.Black;
}

export function decodePiece(code: number): Piece | null {
	if (code <= 0) return null;
	const color: Color = code >= ColorCode.Black ? 'black' : 'white';
	const base = color === 'black' ? code - ColorCode.Black : code;
	return { color, role: baseToRole(base) };
}

function roleToBase(role: Role): Base {
	switch (role) {
		case 'pawn':
			return Base.Pawn;
		case 'knight':
			return Base.Knight;
		case 'bishop':
			return Base.Bishop;
		case 'rook':
			return Base.Rook;
		case 'queen':
			return Base.Queen;
		case 'king':
			return Base.King;
		default:
			// Exhaustiveness guard
			return Base.Empty;
	}
}

function baseToRole(base: number): Role {
	switch (base) {
		case Base.Pawn:
			return 'pawn';
		case Base.Knight:
			return 'knight';
		case Base.Bishop:
			return 'bishop';
		case Base.Rook:
			return 'rook';
		case Base.Queen:
			return 'queen';
		case Base.King:
			return 'king';
		default:
			throw new RangeError(`Invalid base role code: ${base}`);
	}
}
