import { Chess } from 'chess.js';
import { describe, expect, it } from 'vitest';
import {
	toBoardMove,
	toBoardMoveDestinations,
	toGameMove
} from '../../../src/adapters/chessjs/index.js';
import type { MoveOutput } from '../../../src/state/board/types/output.js';

describe('toGameMove', () => {
	it('normal board move becomes { from, to }', () => {
		const move: MoveOutput = {
			from: 'e2',
			to: 'e4',
			piece: 'wP'
		};
		expect(toGameMove(move)).toEqual({ from: 'e2', to: 'e4' });
	});

	it('promotion Q maps to q', () => {
		const move: MoveOutput = {
			from: 'a7',
			to: 'a8',
			piece: 'wP',
			promotedTo: 'Q'
		};
		expect(toGameMove(move)).toEqual({ from: 'a7', to: 'a8', promotion: 'q' });
	});

	it('promotion R maps to r', () => {
		const move: MoveOutput = {
			from: 'a7',
			to: 'a8',
			piece: 'wP',
			promotedTo: 'R'
		};
		expect(toGameMove(move)).toEqual({ from: 'a7', to: 'a8', promotion: 'r' });
	});

	it('promotion B maps to b', () => {
		const move: MoveOutput = {
			from: 'a7',
			to: 'a8',
			piece: 'wP',
			promotedTo: 'B'
		};
		expect(toGameMove(move)).toEqual({ from: 'a7', to: 'a8', promotion: 'b' });
	});

	it('promotion N maps to n', () => {
		const move: MoveOutput = {
			from: 'a7',
			to: 'a8',
			piece: 'wP',
			promotedTo: 'N'
		};
		expect(toGameMove(move)).toEqual({ from: 'a7', to: 'a8', promotion: 'n' });
	});

	it('secondary/captured output details are not included in game move output', () => {
		const move: MoveOutput = {
			from: 'e1',
			to: 'g1',
			piece: 'wK',
			secondary: { from: 'h1', to: 'f1', piece: 'wR' },
			captured: { square: 'd5', piece: 'bP' }
		};
		const result = toGameMove(move);
		expect(result).toEqual({ from: 'e1', to: 'g1' });
		expect(result).not.toHaveProperty('secondary');
		expect(result).not.toHaveProperty('captured');
		expect(result).not.toHaveProperty('capturedSquare');
	});
});

describe('toBoardMove', () => {
	it('normal chess.js move becomes MoveRequestInput', () => {
		const chess = new Chess();
		const move = chess.move('e4');
		const result = toBoardMove(move);
		expect(result).toEqual({ from: 'e2', to: 'e4' });
	});

	it('promotion q maps to Q', () => {
		// Position where white can promote on a8
		const chess = new Chess('4k3/P7/8/8/8/8/8/4K3 w - - 0 1');
		const move = chess.move({ from: 'a7', to: 'a8', promotion: 'q' });
		const result = toBoardMove(move);
		expect(result.promotedTo).toBe('Q');
		expect(result.from).toBe('a7');
		expect(result.to).toBe('a8');
	});

	it('promotion r maps to R', () => {
		const chess = new Chess('4k3/P7/8/8/8/8/8/4K3 w - - 0 1');
		const move = chess.move({ from: 'a7', to: 'a8', promotion: 'r' });
		const result = toBoardMove(move);
		expect(result.promotedTo).toBe('R');
	});

	it('promotion b maps to B', () => {
		const chess = new Chess('4k3/P7/8/8/8/8/8/4K3 w - - 0 1');
		const move = chess.move({ from: 'a7', to: 'a8', promotion: 'b' });
		const result = toBoardMove(move);
		expect(result.promotedTo).toBe('B');
	});

	it('promotion n maps to N', () => {
		const chess = new Chess('4k3/P7/8/8/8/8/8/4K3 w - - 0 1');
		const move = chess.move({ from: 'a7', to: 'a8', promotion: 'n' });
		const result = toBoardMove(move);
		expect(result.promotedTo).toBe('N');
	});

	it('white kingside castling includes secondary h1 -> f1', () => {
		const chess = new Chess('r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1');
		const move = chess.move('O-O');
		const result = toBoardMove(move);
		expect(result.from).toBe('e1');
		expect(result.to).toBe('g1');
		expect(result.secondary).toEqual({ from: 'h1', to: 'f1' });
	});

	it('white queenside castling includes secondary a1 -> d1', () => {
		const chess = new Chess('r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1');
		const move = chess.move('O-O-O');
		const result = toBoardMove(move);
		expect(result.from).toBe('e1');
		expect(result.to).toBe('c1');
		expect(result.secondary).toEqual({ from: 'a1', to: 'd1' });
	});

	it('black kingside castling includes secondary h8 -> f8', () => {
		const chess = new Chess('r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R b KQkq - 0 1');
		const move = chess.move('O-O');
		const result = toBoardMove(move);
		expect(result.from).toBe('e8');
		expect(result.to).toBe('g8');
		expect(result.secondary).toEqual({ from: 'h8', to: 'f8' });
	});

	it('black queenside castling includes secondary a8 -> d8', () => {
		const chess = new Chess('r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R b KQkq - 0 1');
		const move = chess.move('O-O-O');
		const result = toBoardMove(move);
		expect(result.from).toBe('e8');
		expect(result.to).toBe('c8');
		expect(result.secondary).toEqual({ from: 'a8', to: 'd8' });
	});

	it('white en passant includes capturedSquare on rank 5', () => {
		// White pawn on e5, black pawn just moved d7-d5
		const chess = new Chess('4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1');
		const move = chess.move('exd6');
		const result = toBoardMove(move);
		expect(result.from).toBe('e5');
		expect(result.to).toBe('d6');
		expect(result.capturedSquare).toBe('d5');
	});

	it('black en passant includes capturedSquare on rank 4', () => {
		// Black pawn on d4, white pawn just moved e2-e4
		const chess = new Chess('4k3/8/8/8/3pP3/8/8/4K3 b - e3 0 1');
		const move = chess.move('dxe3');
		const result = toBoardMove(move);
		expect(result.from).toBe('d4');
		expect(result.to).toBe('e3');
		expect(result.capturedSquare).toBe('e4');
	});
});

describe('toBoardMoveDestinations', () => {
	it('empty input returns []', () => {
		expect(toBoardMoveDestinations([])).toEqual([]);
	});

	it('starting position e2 moves become destinations to e3/e4', () => {
		const chess = new Chess();
		const moves = chess.moves({ square: 'e2', verbose: true });
		const destinations = toBoardMoveDestinations(moves);

		expect(destinations).toHaveLength(2);
		const tos = destinations.map((d) => d.to);
		expect(tos).toContain('e3');
		expect(tos).toContain('e4');
		// No special fields for simple pawn moves
		for (const dest of destinations) {
			expect(dest.capturedSquare).toBeUndefined();
			expect(dest.secondary).toBeUndefined();
			expect(dest.promotedTo).toBeUndefined();
		}
	});

	it('promotion variants merge into one destination with promotedTo choices', () => {
		// White pawn on a7 can promote to a8
		const chess = new Chess('4k3/P7/8/8/8/8/8/4K3 w - - 0 1');
		const moves = chess.moves({ square: 'a7', verbose: true });
		const destinations = toBoardMoveDestinations(moves);

		// All promotion variants to a8 should be merged into one destination
		const a8Dest = destinations.find((d) => d.to === 'a8');
		expect(a8Dest).toBeDefined();
		expect(a8Dest!.promotedTo).toBeDefined();
		expect(a8Dest!.promotedTo).toHaveLength(4);
		// All four promotion types should be present
		expect(a8Dest!.promotedTo).toContain('Q');
		expect(a8Dest!.promotedTo).toContain('R');
		expect(a8Dest!.promotedTo).toContain('B');
		expect(a8Dest!.promotedTo).toContain('N');
	});

	it('promotion choices preserve first-seen order from chess.js', () => {
		const chess = new Chess('4k3/P7/8/8/8/8/8/4K3 w - - 0 1');
		const moves = chess.moves({ square: 'a7', verbose: true });
		const destinations = toBoardMoveDestinations(moves);

		const a8Dest = destinations.find((d) => d.to === 'a8');
		expect(a8Dest).toBeDefined();
		// The order should match chess.js generation order
		const chessJsPromotionOrder = moves
			.filter((m) => m.to === 'a8')
			.map((m) => m.promotion!.toUpperCase());
		expect(a8Dest!.promotedTo).toEqual(chessJsPromotionOrder);
	});

	it('castling destination includes secondary', () => {
		const chess = new Chess('r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1');
		const moves = chess.moves({ square: 'e1', verbose: true });
		const destinations = toBoardMoveDestinations(moves);

		const kingsideDest = destinations.find((d) => d.to === 'g1');
		expect(kingsideDest).toBeDefined();
		expect(kingsideDest!.secondary).toEqual({ from: 'h1', to: 'f1' });

		const queensideDest = destinations.find((d) => d.to === 'c1');
		expect(queensideDest).toBeDefined();
		expect(queensideDest!.secondary).toEqual({ from: 'a1', to: 'd1' });
	});

	it('en passant destination includes capturedSquare', () => {
		const chess = new Chess('4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1');
		const moves = chess.moves({ square: 'e5', verbose: true });
		const destinations = toBoardMoveDestinations(moves);

		const epDest = destinations.find((d) => d.to === 'd6');
		expect(epDest).toBeDefined();
		expect(epDest!.capturedSquare).toBe('d5');
	});
});
