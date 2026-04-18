import type { Square, SquareFile, SquareRank } from './types/internal';

export function fileOf(sq: Square): SquareFile {
	return Math.trunc(sq % 8) as SquareFile;
}

export function rankOf(sq: Square): SquareRank {
	return Math.trunc(sq / 8) as SquareRank;
}

export function squareOf(file: SquareFile, rank: SquareRank): Square {
	return Math.trunc(rank * 8 + file) as Square;
}
