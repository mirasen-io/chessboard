import { describe, expect, it } from 'vitest';
import type { Square } from '../../../src/core/state/boardTypes';
import {
	assertValidSquare,
	fileOf,
	fromAlgebraic,
	isValidSquare,
	rankOf,
	squareOf,
	toAlgebraic
} from '../../../src/core/state/coords';

describe('coords', () => {
	it('fromAlgebraic maps algebraic to numeric index correctly', () => {
		expect(fromAlgebraic('a1')).toBe(0);
		expect(fromAlgebraic('h1')).toBe(7);
		expect(fromAlgebraic('a8')).toBe(56);
		expect(fromAlgebraic('h8')).toBe(63);
		expect(fromAlgebraic('e4')).toBe(3 * 8 + 4);
	});

	it('toAlgebraic maps numeric index to algebraic correctly', () => {
		expect(toAlgebraic(0)).toBe('a1');
		expect(toAlgebraic(7)).toBe('h1');
		expect(toAlgebraic(56)).toBe('a8');
		expect(toAlgebraic(63)).toBe('h8');
		expect(toAlgebraic((3 * 8 + 4) as Square)).toBe('e4');
	});

	it('fileOf and rankOf compute components correctly', () => {
		const e4 = fromAlgebraic('e4');
		expect(fileOf(e4)).toBe(4);
		expect(rankOf(e4)).toBe(3);
	});

	it('squareOf builds a square from file/rank', () => {
		expect(squareOf(0, 0)).toBe(0); // a1
		expect(squareOf(7, 0)).toBe(7); // h1
		expect(squareOf(0, 7)).toBe(56); // a8
		expect(squareOf(7, 7)).toBe(63); // h8
	});

	it('isValidSquare validates bounds', () => {
		expect(isValidSquare(0)).toBe(true);
		expect(isValidSquare(63)).toBe(true);
		expect(isValidSquare(-1)).toBe(false);
		expect(isValidSquare(64)).toBe(false);
		expect(isValidSquare(1.5)).toBe(false);
	});

	it('assertValidSquare throws for invalid values', () => {
		expect(() => assertValidSquare(0)).not.toThrow();
		expect(() => assertValidSquare(63)).not.toThrow();
		expect(() => assertValidSquare(-1)).toThrow();
		expect(() => assertValidSquare(64)).toThrow();
	});
});
