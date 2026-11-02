import type { Move, PieceSymbol } from 'chess.js';
import type {
	MoveRequestInput,
	RolePromotionShort,
	SquareString
} from '../../state/board/types/input.js';
import type { MoveOutput } from '../../state/board/types/output.js';
import type { MoveDestinationInput } from '../../state/interaction/types/input.js';

type ChessJsPromotion = Exclude<PieceSymbol, 'p' | 'k'>;

export type ChessJsMoveInput = {
	from: string;
	to: string;
	promotion?: string;
};

const BOARD_TO_CHESSJS: Record<RolePromotionShort, ChessJsPromotion> = {
	Q: 'q',
	R: 'r',
	B: 'b',
	N: 'n'
};

const CHESSJS_TO_BOARD: Record<ChessJsPromotion, RolePromotionShort> = {
	q: 'Q',
	r: 'R',
	b: 'B',
	n: 'N'
};

function toBoardPromotion(p: PieceSymbol): RolePromotionShort {
	const result = CHESSJS_TO_BOARD[p as ChessJsPromotion];
	if (!result) {
		throw new Error(`Unsupported chess.js promotion symbol: "${p}"`);
	}
	return result;
}

function toChessJsPromotion(p: RolePromotionShort): ChessJsPromotion {
	const result = BOARD_TO_CHESSJS[p];
	if (!result) {
		throw new Error(`Unsupported board promotion symbol: "${p}"`);
	}
	return result;
}

/**
 * Convert a board MoveOutput into the object notation accepted by chess.move().
 */
export function toGameMove(move: MoveOutput): ChessJsMoveInput {
	const result: ChessJsMoveInput = {
		from: move.from,
		to: move.to
	};
	if (move.promotedTo) {
		result.promotion = toChessJsPromotion(move.promotedTo);
	}
	return result;
}

/**
 * Convert a chess.js Move object into MoveRequestInput.
 */
export function toBoardMove(move: Move): MoveRequestInput {
	const result: MoveRequestInput = {
		from: move.from as SquareString,
		to: move.to as SquareString
	};

	if (move.isPromotion()) {
		if (!move.promotion) {
			throw new Error('Promotion move missing promotion piece');
		}
		result.promotedTo = toBoardPromotion(move.promotion);
	}

	if (move.isEnPassant()) {
		const file = move.to[0]!;
		const toRank = parseInt(move.to[1]!, 10);
		const capturedRank = move.color === 'w' ? toRank - 1 : toRank + 1;
		result.capturedSquare = `${file}${capturedRank}` as SquareString;
	}

	if (move.isKingsideCastle()) {
		if (move.from === 'e1' && move.to === 'g1') {
			result.secondary = { from: 'h1', to: 'f1' };
		} else if (move.from === 'e8' && move.to === 'g8') {
			result.secondary = { from: 'h8', to: 'f8' };
		} else {
			throw new Error(`Unsupported chess.js kingside castling move: ${move.from}-${move.to}`);
		}
	} else if (move.isQueensideCastle()) {
		if (move.from === 'e1' && move.to === 'c1') {
			result.secondary = { from: 'a1', to: 'd1' };
		} else if (move.from === 'e8' && move.to === 'c8') {
			result.secondary = { from: 'a8', to: 'd8' };
		} else {
			throw new Error(`Unsupported chess.js queenside castling move: ${move.from}-${move.to}`);
		}
	}

	return result;
}

/**
 * Convert readonly chess.js verbose moves into readonly MoveDestinationInput[].
 * Merges promotion variants for the same from/to/special-move identity into one destination.
 */
export function toBoardMoveDestinations(moves: readonly Move[]): MoveDestinationInput[] {
	if (moves.length === 0) return [];

	const destinations: MoveDestinationInput[] = [];
	const keyToIndex = new Map<string, number>();

	for (const move of moves) {
		const boardMove = toBoardMove(move);

		// Build identity key: from + to + capturedSquare + secondary
		const key = [
			boardMove.from,
			boardMove.to,
			boardMove.capturedSquare ?? '',
			boardMove.secondary ? `${boardMove.secondary.from}-${boardMove.secondary.to}` : ''
		].join('|');

		const existingIdx = keyToIndex.get(key);

		if (existingIdx !== undefined) {
			// Merge promotion into existing destination
			const existing = destinations[existingIdx]!;
			if (boardMove.promotedTo) {
				if (!existing.promotedTo) {
					existing.promotedTo = [];
				}
				if (!existing.promotedTo.includes(boardMove.promotedTo)) {
					existing.promotedTo.push(boardMove.promotedTo);
				}
			}
		} else {
			// Create new destination
			const dest: MoveDestinationInput = {
				to: boardMove.to
			};
			if (boardMove.capturedSquare) {
				dest.capturedSquare = boardMove.capturedSquare;
			}
			if (boardMove.secondary) {
				dest.secondary = boardMove.secondary;
			}
			if (boardMove.promotedTo) {
				dest.promotedTo = [boardMove.promotedTo];
			}
			keyToIndex.set(key, destinations.length);
			destinations.push(dest);
		}
	}

	return destinations;
}
