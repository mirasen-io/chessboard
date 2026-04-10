/**
 * FEN utilities (notation-only). Converts between FEN strings and internal piece arrays.
 *
 * Conventions:
 * - Internal board indexing: 0..63 where a1=0, b1=1, ..., h8=63
 * - FEN placement lists ranks from 8 down to 1. We map row 0 (fen) -> rank 7, ..., row 7 -> rank 0.
 * - Uppercase letters are white pieces (PNBRQK), lowercase are black (pnbrqk).
 */

import type { Color, Role } from './types';

export type FenActiveColor = 'w' | 'b';

// Standard initial position
export const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

/**
 * Parse full FEN and return the minimal fields needed for UI (pieces + active color).
 * Other fields are parsed but returned as-is for potential future use.
 */
export function parseFenAll(fen: string): {
	pieces: Uint8Array;
	active: Color;
	castling?: string;
	ep?: string;
	halfmove?: number;
	fullmove?: number;
} {
	const parts = fen.trim().split(/\s+/);
	if (parts.length < 2) {
		throw new Error(`Invalid FEN: expected at least 2 fields, got "${fen}"`);
	}
	const [placement, active, castling, ep, halfmove, fullmove] = parts;

	const pieces = parseFenPlacementField(placement);
	const activeColor = parseFenActiveColorField(active);

	return {
		pieces,
		active: activeColor,
		castling,
		ep,
		halfmove: halfmove != null ? parseNonNegativeInt(halfmove, 'halfmove') : undefined,
		fullmove: fullmove != null ? parseNonNegativeInt(fullmove, 'fullmove') : undefined
	};
}

/**
 * Parse field 1 (piece placement) from a FEN string (or full FEN).
 */
export function parseFenPlacement(fenOrPlacement: string): Uint8Array {
	const placement = fenOrPlacement.includes(' ')
		? fenOrPlacement.trim().split(/\s+/)[0]
		: fenOrPlacement.trim();
	return parseFenPlacementField(placement);
}

/**
 * Parse field 2 (active color) from a FEN string (or full FEN).
 */
export function parseFenTurn(fenOrActive: string): Color {
	const active = fenOrActive.includes(' ')
		? fenOrActive.trim().split(/\s+/)[1]
		: fenOrActive.trim();
	return parseFenActiveColorField(active);
}

/**
 * Encode only the placement field (field 1) from a piece array.
 */
export function toFenPlacement(pieces: Uint8Array): string {
	if (pieces.length !== 64) throw new Error(`pieces must be length 64`);
	const rows: string[] = [];
	for (let fenRow = 0; fenRow < 8; fenRow++) {
		// fenRow 0 corresponds to rank 8 (internal rank 7)
		const rank = 7 - fenRow;
		let row = '';
		let emptyRun = 0;
		for (let file = 0; file < 8; file++) {
			const idx = rank * 8 + file;
			const code = pieces[idx];
			if (code === 0) {
				emptyRun++;
			} else {
				if (emptyRun > 0) {
					row += String(emptyRun);
					emptyRun = 0;
				}
				row += codeToFenLetter(code);
			}
		}
		if (emptyRun > 0) row += String(emptyRun);
		rows.push(row);
	}
	return rows.join('/');
}

/**
 * Encode a minimal full FEN from pieces + active color.
 * Other fields default to "- 0 1" to reflect UI-only state (no castling/ep counters).
 */
export function toFen(pieces: Uint8Array, active: Color): string {
	const placement = toFenPlacement(pieces);
	const activeField: FenActiveColor = active === 'white' ? 'w' : 'b';
	return `${placement} ${activeField} - - 0 1`;
}

// Internal helpers

function parseFenPlacementField(placement: string): Uint8Array {
	const rows = placement.split('/');
	if (rows.length !== 8) {
		throw new Error(`Invalid FEN placement: expected 8 ranks, got ${rows.length}`);
	}
	const out = new Uint8Array(64);
	for (let fenRow = 0; fenRow < 8; fenRow++) {
		const row = rows[fenRow];
		const rank = 7 - fenRow; // map top (fenRow=0) to internal rank 7
		let file = 0;
		for (let i = 0; i < row.length; i++) {
			const ch = row[i];
			if (isDigit(ch)) {
				file += parseDigitRun(ch, row, i, () => {
					throw new Error(`Invalid digit in FEN row "${row}"`);
				});
			} else {
				const code = fenLetterToCode(ch);
				if (file >= 8) throw new Error(`Too many files in FEN row "${row}"`);
				out[rank * 8 + file] = code;
				file++;
			}
		}
		if (file !== 8) {
			throw new Error(`Invalid FEN row "${row}": expected 8 files, got ${file}`);
		}
	}
	return out;
}

function parseFenActiveColorField(active: string): Color {
	if (active !== 'w' && active !== 'b') {
		throw new Error(`Invalid FEN active color: "${active}" (expected "w" or "b")`);
	}
	return active === 'w' ? 'white' : 'black';
}

function isDigit(ch: string): boolean {
	return ch >= '0' && ch <= '9';
}

/**
 * Parse a run-length digit (1..8). FEN allows numbers summing to 8 for empties.
 * We allow multi-digit sequences (though in strict FEN they won't exceed single digit),
 * but still validate the cumulative file count at the row end.
 */
function parseDigitRun(
	firstDigit: string,
	row: string,
	startIndex: number,
	onError: () => never
): number {
	if (!isDigit(firstDigit)) onError();
	let i = startIndex;
	let value = 0;
	while (i < row.length && isDigit(row[i])) {
		value = value * 10 + (row.charCodeAt(i) - 48);
		i++;
	}
	if (value <= 0) onError();
	return value;
}

function fenLetterToCode(ch: string): number {
	switch (ch) {
		// white
		case 'P':
			return roleToCode('white', 'pawn');
		case 'N':
			return roleToCode('white', 'knight');
		case 'B':
			return roleToCode('white', 'bishop');
		case 'R':
			return roleToCode('white', 'rook');
		case 'Q':
			return roleToCode('white', 'queen');
		case 'K':
			return roleToCode('white', 'king');
		// black
		case 'p':
			return roleToCode('black', 'pawn');
		case 'n':
			return roleToCode('black', 'knight');
		case 'b':
			return roleToCode('black', 'bishop');
		case 'r':
			return roleToCode('black', 'rook');
		case 'q':
			return roleToCode('black', 'queen');
		case 'k':
			return roleToCode('black', 'king');
		default:
			throw new Error(`Invalid FEN piece letter: "${ch}"`);
	}
}

function codeToFenLetter(code: number): string {
	const color: Color = code >= 8 ? 'black' : 'white';
	const base = color === 'black' ? code - 8 : code;
	const role = baseToRole(base);
	const letter = roleToFenLetter(color, role);
	return letter;
}

function roleToCode(color: Color, role: Role): number {
	// 0: empty; 1..6 white; 9..14 black
	const base = roleToBase(role);
	return color === 'white' ? base : base + 8;
}

function roleToFenLetter(color: Color, role: Role): string {
	switch (role) {
		case 'pawn':
			return color === 'white' ? 'P' : 'p';
		case 'knight':
			return color === 'white' ? 'N' : 'n';
		case 'bishop':
			return color === 'white' ? 'B' : 'b';
		case 'rook':
			return color === 'white' ? 'R' : 'r';
		case 'queen':
			return color === 'white' ? 'Q' : 'q';
		case 'king':
			return color === 'white' ? 'K' : 'k';
		default:
			// exhaustive by Role type
			throw new Error(`Unknown role: ${String(role)}`);
	}
}

function roleToBase(role: Role): number {
	switch (role) {
		case 'pawn':
			return 1;
		case 'knight':
			return 2;
		case 'bishop':
			return 3;
		case 'rook':
			return 4;
		case 'queen':
			return 5;
		case 'king':
			return 6;
		default:
			throw new Error(`Unknown role: ${String(role)}`);
	}
}

function baseToRole(base: number): Role {
	switch (base) {
		case 1:
			return 'pawn';
		case 2:
			return 'knight';
		case 3:
			return 'bishop';
		case 4:
			return 'rook';
		case 5:
			return 'queen';
		case 6:
			return 'king';
		default:
			throw new Error(`Invalid base role code: ${base}`);
	}
}

function parseNonNegativeInt(str: string, field: string): number {
	const n = Number(str);
	if (!Number.isInteger(n) || n < 0) {
		throw new Error(`Invalid FEN ${field} number: "${str}"`);
	}
	return n;
}
