import { FenString } from '../types/input.js';
import { ColorCode, ParsedPosition, PieceCode, SQUARE_COUNT } from '../types/internal.js';

/**
 * Direct FEN character → PieceCode lookup.
 * Uppercase = White, lowercase = Black.
 */
const FEN_PIECE_MAP: Readonly<Record<string, PieceCode>> = {
	P: PieceCode.WhitePawn,
	N: PieceCode.WhiteKnight,
	B: PieceCode.WhiteBishop,
	R: PieceCode.WhiteRook,
	Q: PieceCode.WhiteQueen,
	K: PieceCode.WhiteKing,
	p: PieceCode.BlackPawn,
	n: PieceCode.BlackKnight,
	b: PieceCode.BlackBishop,
	r: PieceCode.BlackRook,
	q: PieceCode.BlackQueen,
	k: PieceCode.BlackKing
};

/**
 * Parse the piece-placement section of a FEN string into a Uint8Array[64].
 *
 * FEN ranks are ordered 8→1 (top to bottom), but our board indexing is
 * a1=0, b1=1, ..., h1=7, a2=8, ..., h8=63.
 * So rank 8 maps to indices 56–63 and rank 1 to indices 0–7.
 */
function parsePiecePlacement(placement: string): Uint8Array {
	const pieces = new Uint8Array(SQUARE_COUNT); // initialized to 0 (PieceCode.Empty)
	const ranks = placement.split('/');

	if (ranks.length !== 8) {
		throw new Error(
			`Invalid FEN piece placement: expected 8 ranks separated by '/', got ${ranks.length}`
		);
	}

	for (let rankIdx = 0; rankIdx < 8; rankIdx++) {
		// FEN rank index 0 = rank 8 (board row 7), index 7 = rank 1 (board row 0)
		const boardRow = 7 - rankIdx;
		const baseSquare = boardRow * 8;
		const rankStr = ranks[rankIdx];
		let file = 0;

		for (let i = 0; i < rankStr.length; i++) {
			const ch = rankStr[i];

			if (ch >= '1' && ch <= '8') {
				// Skip empty squares
				file += ch.charCodeAt(0) - '0'.charCodeAt(0);
			} else {
				const piece = FEN_PIECE_MAP[ch];
				if (piece === undefined) {
					throw new Error(`Invalid FEN piece character: '${ch}'`);
				}
				if (file >= 8) {
					throw new Error(`Invalid FEN piece placement: too many squares in rank ${8 - rankIdx}`);
				}
				pieces[baseSquare + file] = piece;
				file++;
			}
		}

		if (file !== 8) {
			throw new Error(
				`Invalid FEN piece placement: rank ${8 - rankIdx} has ${file} squares instead of 8`
			);
		}
	}

	return pieces;
}

/**
 * Parse the active-color field of a FEN string.
 */
function parseTurn(turn: string): ColorCode {
	switch (turn) {
		case 'w':
			return ColorCode.White;
		case 'b':
			return ColorCode.Black;
		default:
			throw new Error(`Invalid FEN turn field: expected 'w' or 'b', got '${turn}'`);
	}
}

/**
 * Parse a FEN string into a {@link ParsedPosition}.
 *
 * Only the first two FEN fields (piece placement + active color) are required
 * for a board-only representation. The remaining fields (castling, en-passant,
 * half-move clock, full-move number) are accepted but ignored.
 */
export function parseFen(fen: FenString): ParsedPosition {
	const parts = fen
		.replace(/^\uFEFF/, '')
		.trim()
		.split(/\s+/);

	if (parts.length < 2) {
		throw new Error(
			`Invalid FEN string: expected at least 2 space-separated fields, got ${parts.length}`
		);
	}

	const pieces = parsePiecePlacement(parts[0]);
	const turn = parseTurn(parts[1]);

	return { pieces, turn };
}
