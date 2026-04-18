import type { FileChar, RankChar, Square, SquareString } from './boardTypes';

/**
 * Square indexing:
 * - 0..63 where a1 = 0, b1 = 1, ..., h1 = 7, a2 = 8, ..., h8 = 63.
 * - file = sq % 8  (0..7 => a..h)
 * - rank = (sq / 8) | 0 = Math.trunc(sq / 8)  (0..7 => 1..8 when displayed)
 */

const FILE_START = 'a'.charCodeAt(0);
const RANK_START = '1'.charCodeAt(0);

/**
 * Convert algebraic square (e.g. 'e4') to numeric index (0..63).
 */
export function fromAlgebraic(s: SquareString): Square {
	const file = Math.trunc(s.charCodeAt(0) - FILE_START);
	const rank = Math.trunc(s.charCodeAt(1) - RANK_START);
	// rank 0 = '1' => row 0, rank 7 = '8' => row 7
	const sq = Math.trunc(rank * 8 + file);
	if (!isValidSquare(sq)) throw new RangeError(`Invalid algebraic square: ${s}`);
	return sq as Square;
}

/**
 * Convert numeric square (0..63) to algebraic (e.g. 'e4').
 */
export function toAlgebraic(sq: Square): SquareString {
	if (!isValidSquare(sq)) throw new RangeError(`Invalid square index: ${sq}`);
	const file = fileOf(sq);
	const rank = rankOf(sq);
	const f = String.fromCharCode(FILE_START + file) as FileChar;
	const r = String.fromCharCode(RANK_START + rank) as RankChar;
	return `${f}${r}` as SquareString;
}

/**
 * unify square input to numeric index. Accepts either a number (0..63) or algebraic string ('a1'..'h8').
 * @param sq square number or string
 * @returns square number
 */
export function toValidSquare(sq: Square | SquareString): Square {
	if (typeof sq === 'number') {
		assertValidSquare(sq);
		return sq;
	} else if (typeof sq === 'string') {
		return fromAlgebraic(sq);
	} else {
		throw new TypeError(`Invalid square input: ${sq}`);
	}
}

/**
 * File of a square (0..7) where 0='a', 7='h'.
 */
export function fileOf(sq: Square): number {
	return Math.trunc(sq % 8);
}

/**
 * Rank of a square (0..7) where 0='1', 7='8'.
 */
export function rankOf(sq: Square): number {
	return Math.trunc(sq / 8);
}

/**
 * Construct a square index from file/rank (0..7 each).
 */
export function squareOf(file: number, rank: number): Square {
	if (
		Math.trunc(file) !== file ||
		Math.trunc(rank) !== rank ||
		file < 0 ||
		file > 7 ||
		rank < 0 ||
		rank > 7
	) {
		throw new RangeError(`Invalid file/rank: file=${file}, rank=${rank}`);
	}
	return Math.trunc(rank * 8 + file) as Square;
}

/**
 * Validate that a number is a square index (0..63).
 */
export function isValidSquare(n: number): n is Square {
	return Number.isInteger(n) && n >= 0 && n < 64;
}

/**
 * Assert a number is a valid square; throws otherwise.
 */
export function assertValidSquare(n: number): asserts n is Square {
	if (!isValidSquare(n)) {
		throw new RangeError(`Expected a valid square index (0..63), got: ${n}`);
	}
}
