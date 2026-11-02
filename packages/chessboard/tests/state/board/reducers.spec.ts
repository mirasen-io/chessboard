import { describe, expect, it } from 'vitest';
import { normalizeSquare } from '../../../src/state/board/normalize.js';
import { boardParsePosition } from '../../../src/state/board/position.js';
import {
	boardMove,
	boardSetPiecePosition,
	boardSetPosition,
	boardSetTurn
} from '../../../src/state/board/reducers.js';
import { ColorCode, PieceCode, RoleCode } from '../../../src/state/board/types/internal.js';
import { createTestBoardInternalState } from '../../test-utils/state/board/internal-state.js';

describe('boardSetPiecePosition', () => {
	it('replaces pieces array, increments epoch, and returns true', () => {
		const state = createTestBoardInternalState();
		const startPosition = boardParsePosition('start');
		const originalEpoch = state.positionEpoch;

		const result = boardSetPiecePosition(state, startPosition.pieces);

		expect(result).toBe(true);
		expect(state.positionEpoch).toBe(originalEpoch + 1);
		// Pieces should be set but as a new Uint8Array (not same reference)
		expect(state.pieces).not.toBe(startPosition.pieces);
		expect(state.pieces[normalizeSquare('e1')]).toBe(PieceCode.WhiteKing);
	});

	it('returns false and does not increment epoch for equivalent piece placement', () => {
		const state = createTestBoardInternalState({
			pieces: [
				[normalizeSquare('e1'), PieceCode.WhiteKing],
				[normalizeSquare('e8'), PieceCode.BlackKing]
			],
			positionEpoch: 2
		});
		// Build same pieces array
		const samePieces = new Uint8Array(state.pieces);

		const result = boardSetPiecePosition(state, samePieces);

		expect(result).toBe(false);
		expect(state.positionEpoch).toBe(2);
	});
});

describe('boardSetPosition', () => {
	it('returns true and increments epoch for a different position', () => {
		const state = createTestBoardInternalState({
			pieces: [[normalizeSquare('e1'), PieceCode.WhiteKing]],
			turn: ColorCode.White
		});
		const originalEpoch = state.positionEpoch;
		const newPosition = boardParsePosition({ pieces: { a1: 'wR' }, turn: 'black' });

		const result = boardSetPosition(state, newPosition);

		expect(result).toBe(true);
		expect(state.positionEpoch).toBe(originalEpoch + 1);
		expect(state.pieces[normalizeSquare('a1')]).toBe(PieceCode.WhiteRook);
		expect(state.turn).toBe(ColorCode.Black);
	});

	it('returns false and does not increment epoch for equivalent position (no-op)', () => {
		const state = createTestBoardInternalState({
			pieces: [[normalizeSquare('e1'), PieceCode.WhiteKing]],
			turn: ColorCode.White,
			positionEpoch: 5
		});
		// Build the same position
		const samePosition = {
			pieces: new Uint8Array(state.pieces),
			turn: ColorCode.White as const
		};

		const result = boardSetPosition(state, samePosition);

		expect(result).toBe(false);
		expect(state.positionEpoch).toBe(5);
	});

	it('returns true when pieces are same but turn differs', () => {
		const state = createTestBoardInternalState({
			pieces: [[normalizeSquare('e1'), PieceCode.WhiteKing]],
			turn: ColorCode.White,
			positionEpoch: 3
		});
		const positionWithDifferentTurn = {
			pieces: new Uint8Array(state.pieces),
			turn: ColorCode.Black as const
		};

		const result = boardSetPosition(state, positionWithDifferentTurn);

		expect(result).toBe(true);
		expect(state.positionEpoch).toBe(4);
		expect(state.turn).toBe(ColorCode.Black);
	});
});

describe('boardSetTurn', () => {
	it('returns true, updates turn, and increments positionEpoch when turn changes', () => {
		const state = createTestBoardInternalState({ turn: ColorCode.White, positionEpoch: 2 });

		const result = boardSetTurn(state, ColorCode.Black);

		expect(result).toBe(true);
		expect(state.turn).toBe(ColorCode.Black);
		expect(state.positionEpoch).toBe(3);
	});

	it('returns false and does not increment positionEpoch when turn is already the requested value', () => {
		const state = createTestBoardInternalState({ turn: ColorCode.White, positionEpoch: 4 });

		const result = boardSetTurn(state, ColorCode.White);

		expect(result).toBe(false);
		expect(state.turn).toBe(ColorCode.White);
		expect(state.positionEpoch).toBe(4);
	});
});

describe('boardMove', () => {
	it('executes a simple move: piece relocates, source cleared, turn toggles, epoch increments', () => {
		const e2 = normalizeSquare('e2');
		const e4 = normalizeSquare('e4');
		const state = createTestBoardInternalState({
			pieces: [[e2, PieceCode.WhitePawn]],
			turn: ColorCode.White
		});
		const epochBefore = state.positionEpoch;

		const move = boardMove(state, { from: e2, to: e4 });

		expect(move.piece).toBe(PieceCode.WhitePawn);
		expect(move.from).toBe(e2);
		expect(move.to).toBe(e4);
		expect(state.pieces[e2]).toBe(PieceCode.Empty);
		expect(state.pieces[e4]).toBe(PieceCode.WhitePawn);
		expect(state.turn).toBe(ColorCode.Black);
		expect(state.positionEpoch).toBe(epochBefore + 1);
	});

	it('records captured piece when destination is occupied', () => {
		const e4 = normalizeSquare('e4');
		const d5 = normalizeSquare('d5');
		const state = createTestBoardInternalState({
			pieces: [
				[e4, PieceCode.WhitePawn],
				[d5, PieceCode.BlackPawn]
			],
			turn: ColorCode.White
		});

		const move = boardMove(state, { from: e4, to: d5 });

		expect(move.captured).toBeDefined();
		expect(move.captured!.piece).toBe(PieceCode.BlackPawn);
		expect(move.captured!.square).toBe(d5);
		expect(state.pieces[d5]).toBe(PieceCode.WhitePawn);
		expect(state.pieces[e4]).toBe(PieceCode.Empty);
	});

	it('handles en passant via capturedSquare (different from destination)', () => {
		const e5 = normalizeSquare('e5');
		const d6 = normalizeSquare('d6');
		const d5 = normalizeSquare('d5');
		const state = createTestBoardInternalState({
			pieces: [
				[e5, PieceCode.WhitePawn],
				[d5, PieceCode.BlackPawn]
			],
			turn: ColorCode.White
		});

		const move = boardMove(state, { from: e5, to: d6, capturedSquare: d5 });

		expect(move.captured).toBeDefined();
		expect(move.captured!.piece).toBe(PieceCode.BlackPawn);
		expect(move.captured!.square).toBe(d5);
		expect(state.pieces[d5]).toBe(PieceCode.Empty);
		expect(state.pieces[d6]).toBe(PieceCode.WhitePawn);
		expect(state.pieces[e5]).toBe(PieceCode.Empty);
	});

	it('applies promotion by changing the piece role', () => {
		const e7 = normalizeSquare('e7');
		const e8 = normalizeSquare('e8');
		const state = createTestBoardInternalState({
			pieces: [[e7, PieceCode.WhitePawn]],
			turn: ColorCode.White
		});

		const move = boardMove(state, { from: e7, to: e8, promotedTo: RoleCode.Queen });

		expect(move.promotedTo).toBe(RoleCode.Queen);
		expect(move.piece).toBe(PieceCode.WhitePawn);
		expect(state.pieces[e8]).toBe(PieceCode.WhiteQueen);
		expect(state.pieces[e7]).toBe(PieceCode.Empty);
	});

	it('executes a secondary move (castling pattern)', () => {
		const e1 = normalizeSquare('e1');
		const g1 = normalizeSquare('g1');
		const h1 = normalizeSquare('h1');
		const f1 = normalizeSquare('f1');
		const state = createTestBoardInternalState({
			pieces: [
				[e1, PieceCode.WhiteKing],
				[h1, PieceCode.WhiteRook]
			],
			turn: ColorCode.White
		});

		const move = boardMove(state, {
			from: e1,
			to: g1,
			secondary: { from: h1, to: f1 }
		});

		expect(move.secondary).toBeDefined();
		expect(move.secondary!.piece).toBe(PieceCode.WhiteRook);
		expect(state.pieces[g1]).toBe(PieceCode.WhiteKing);
		expect(state.pieces[f1]).toBe(PieceCode.WhiteRook);
		expect(state.pieces[e1]).toBe(PieceCode.Empty);
		expect(state.pieces[h1]).toBe(PieceCode.Empty);
	});

	it('throws RangeError when source square is empty', () => {
		const e2 = normalizeSquare('e2');
		const e4 = normalizeSquare('e4');
		const state = createTestBoardInternalState({ turn: ColorCode.White });

		expect(() => boardMove(state, { from: e2, to: e4 })).toThrowError(RangeError);
	});

	it('throws RangeError when source equals destination', () => {
		const e2 = normalizeSquare('e2');
		const state = createTestBoardInternalState({
			pieces: [[e2, PieceCode.WhitePawn]],
			turn: ColorCode.White
		});

		expect(() => boardMove(state, { from: e2, to: e2 })).toThrowError(RangeError);
	});

	it('throws RangeError when secondary move overlaps primary move squares', () => {
		const e1 = normalizeSquare('e1');
		const g1 = normalizeSquare('g1');
		const h1 = normalizeSquare('h1');
		const state = createTestBoardInternalState({
			pieces: [
				[e1, PieceCode.WhiteKing],
				[h1, PieceCode.WhiteRook]
			],
			turn: ColorCode.White
		});

		// secondary.to overlaps with primary.from (e1)
		expect(() =>
			boardMove(state, {
				from: e1,
				to: g1,
				secondary: { from: h1, to: e1 }
			})
		).toThrowError(RangeError);
	});
});
