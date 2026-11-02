import { describe, expect, it } from 'vitest';
import { fileOf, rankOf, squareOf } from '../../../src/state/board/coords.js';
import type { Square, SquareFile, SquareRank } from '../../../src/state/board/types/internal.js';

describe('fileOf', () => {
	it('returns correct file for corner and edge squares', () => {
		expect(fileOf(0 as Square)).toBe(0); // a1
		expect(fileOf(7 as Square)).toBe(7); // h1
		expect(fileOf(56 as Square)).toBe(0); // a8
		expect(fileOf(63 as Square)).toBe(7); // h8
		expect(fileOf(12 as Square)).toBe(4); // e2
	});
});

describe('rankOf', () => {
	it('returns correct rank for corner and edge squares', () => {
		expect(rankOf(0 as Square)).toBe(0); // a1
		expect(rankOf(7 as Square)).toBe(0); // h1
		expect(rankOf(56 as Square)).toBe(7); // a8
		expect(rankOf(63 as Square)).toBe(7); // h8
		expect(rankOf(12 as Square)).toBe(1); // e2
	});
});

describe('squareOf', () => {
	it('returns correct index for known file/rank pairs', () => {
		expect(squareOf(0 as SquareFile, 0 as SquareRank)).toBe(0); // a1
		expect(squareOf(4 as SquareFile, 1 as SquareRank)).toBe(12); // e2
		expect(squareOf(7 as SquareFile, 7 as SquareRank)).toBe(63); // h8
	});

	it('round-trips with fileOf/rankOf for all 64 squares', () => {
		for (let sq = 0; sq < 64; sq++) {
			const file = fileOf(sq as Square);
			const rank = rankOf(sq as Square);
			expect(squareOf(file, rank)).toBe(sq);
		}
	});
});
