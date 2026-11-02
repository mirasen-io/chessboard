import { describe, expect, it } from 'vitest';
import { ColorCode, PieceCode } from '../../src/state/board/types/internal.js';
import { MovabilityModeCode } from '../../src/state/interaction/types/internal.js';
import { createTestBoard } from '../test-utils/wrapper/factory.js';

// Named square constants for clarity
const A1 = 0;
const E2 = 12;
const E4 = 28;
const H8 = 63;

describe('wrapper commands – setPosition', () => {
	it('setPosition updates board state observable via getSnapshot', () => {
		const board = createTestBoard();

		board.setPosition({ pieces: { e2: 'wP', e4: 'wP' } });

		const snapshot = board.getSnapshot();
		expect(snapshot.state.board.pieces[E2]).not.toBe(PieceCode.Empty);
	});

	it('setPosition clears pieces not in the new position', () => {
		const board = createTestBoard();

		board.setPosition({ pieces: { e2: 'wK' } });
		expect(board.getSnapshot().state.board.pieces[E2]).not.toBe(PieceCode.Empty);

		// Set new position without e2
		board.setPosition({ pieces: { d4: 'wK' } });
		expect(board.getSnapshot().state.board.pieces[E2]).toBe(PieceCode.Empty);
	});

	it('setPosition with start string sets starting position', () => {
		const board = createTestBoard();

		board.setPosition('start');

		const snapshot = board.getSnapshot();
		// Starting position has a white rook on a1
		expect(snapshot.state.board.pieces[A1]).toBe(PieceCode.WhiteRook);
	});
});

describe('wrapper commands – setPiecePosition', () => {
	it('setPiecePosition updates specific squares', () => {
		const board = createTestBoard();

		board.setPiecePosition({ a1: 'wR', h8: 'bR' });

		const snapshot = board.getSnapshot();
		expect(snapshot.state.board.pieces[A1]).toBe(PieceCode.WhiteRook);
		expect(snapshot.state.board.pieces[H8]).toBe(PieceCode.BlackRook);
	});
});

describe('wrapper commands – setTurn', () => {
	it('setTurn changes turn observable via getSnapshot', () => {
		const board = createTestBoard();

		board.setTurn('black');

		const snapshot = board.getSnapshot();
		expect(snapshot.state.board.turn).toBe(ColorCode.Black);
	});

	it('setTurn to white', () => {
		const board = createTestBoard();

		board.setTurn('black');
		board.setTurn('white');

		const snapshot = board.getSnapshot();
		expect(snapshot.state.board.turn).toBe(ColorCode.White);
	});
});

describe('wrapper commands – move', () => {
	it('move changes piece positions observable via getSnapshot', () => {
		const board = createTestBoard();

		board.setPosition({ pieces: { e2: 'wP' } });
		board.move({ from: 'e2', to: 'e4' });

		const snapshot = board.getSnapshot();
		expect(snapshot.state.board.pieces[E2]).toBe(PieceCode.Empty);
		expect(snapshot.state.board.pieces[E4]).toBe(PieceCode.WhitePawn);
	});
});

describe('wrapper commands – setOrientation', () => {
	it('setOrientation changes orientation observable via getSnapshot', () => {
		const board = createTestBoard();

		board.setOrientation('black');

		const snapshot = board.getSnapshot();
		expect(snapshot.state.view.orientation).toBe(ColorCode.Black);
	});
});

describe('wrapper commands – setMovability', () => {
	it('setMovability to free mode', () => {
		const board = createTestBoard();

		board.setMovability({ mode: 'free' });

		const snapshot = board.getSnapshot();
		expect(snapshot.state.interaction.movability.mode).toBe(MovabilityModeCode.Free);
	});

	it('setMovability to disabled mode', () => {
		const board = createTestBoard();

		board.setMovability({ mode: 'free' });
		board.setMovability({ mode: 'disabled' });

		const snapshot = board.getSnapshot();
		expect(snapshot.state.interaction.movability.mode).toBe(MovabilityModeCode.Disabled);
	});
});

describe('wrapper commands – select', () => {
	it('select updates selection observable via getSnapshot', () => {
		const board = createTestBoard();

		board.setMovability({ mode: 'free' });
		board.setPosition({ pieces: { e2: 'wP' } });
		board.select('e2');

		const snapshot = board.getSnapshot();
		// selected is an object with { square, pieceCode }
		expect(snapshot.state.interaction.selected).not.toBeNull();
		expect((snapshot.state.interaction.selected as { square: number }).square).toBe(E2);
	});

	it('select null clears selection', () => {
		const board = createTestBoard();

		board.setMovability({ mode: 'free' });
		board.setPosition({ pieces: { e2: 'wP' } });
		board.select('e2');
		board.select(null);

		const snapshot = board.getSnapshot();
		expect(snapshot.state.interaction.selected).toBeNull();
	});
});
