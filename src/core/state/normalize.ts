import type { Color, Role } from './boardTypes';

/**
 * Normalize color inputs to canonical long names.
 * Accepts: 'white' | 'black' | 'w' | 'b'
 * Returns: 'white' | 'black'
 */
export function normalizeColor(input: string): Color {
	switch (input) {
		case 'white':
		case 'black':
			return input;
		case 'w':
			return 'white';
		case 'b':
			return 'black';
		default:
			throw new RangeError(`Invalid color input: ${String(input)}`);
	}
}

/**
 * Normalize role inputs to canonical long names.
 * Accepts:
 *  - Long: 'pawn' | 'knight' | 'bishop' | 'rook' | 'queen' | 'king'
 *  - Short (single-case policy aligned with PGN letters): 'p' | 'N' | 'B' | 'R' | 'Q' | 'K'
 * Returns: long canonical role
 */
export function normalizeRole(input: string): Role {
	if (isRole(input)) return input;

	switch (input) {
		case 'p':
			return 'pawn';
		case 'N':
			return 'knight';
		case 'B':
			return 'bishop';
		case 'R':
			return 'rook';
		case 'Q':
			return 'queen';
		case 'K':
			return 'king';
		default:
			throw new RangeError(`Invalid role input: ${String(input)}`);
	}
}

function isRole(r: unknown): r is Role {
	return (
		r === 'pawn' ||
		r === 'knight' ||
		r === 'bishop' ||
		r === 'rook' ||
		r === 'queen' ||
		r === 'king'
	);
}
