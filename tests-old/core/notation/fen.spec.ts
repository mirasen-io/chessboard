import { describe, expect, it } from 'vitest';
import {
	START_FEN,
	parseFenPlacement,
	parseFenTurn,
	toFen,
	toFenPlacement
} from '../../../src/core/notation/fen';

describe('notation/fen', () => {
	it('round-trips placement field for START_FEN', () => {
		const placement = START_FEN.split(' ')[0]!;
		const pieces = parseFenPlacement(START_FEN);
		const encoded = toFenPlacement(pieces);
		expect(encoded).toBe(placement);
	});

	it('parses active color from full FEN', () => {
		const active = parseFenTurn(START_FEN);
		expect(active).toBe('white');
	});

	it('encodes minimal full FEN from pieces + active', () => {
		const placement = START_FEN.split(' ')[0]!;
		const pieces = parseFenPlacement(START_FEN);
		const fen = toFen(pieces, 'black');
		expect(fen).toBe(`${placement} b - - 0 1`);
	});

	it('throws on invalid active color field', () => {
		expect(() => parseFenTurn('8/8/8/8/8/8/8/8 x')).toThrow();
	});

	it('throws on invalid placement rank count', () => {
		// Only 7 ranks provided
		expect(() => parseFenPlacement('8/8/8/8/8/8/8 w')).toThrow();
	});
});
