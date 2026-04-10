import { cloneDeep } from 'es-toolkit/object';
import { fromAlgebraic } from './coords';
import { encodePiece } from './encode';
import { parseFenPlacement, parseFenTurn, START_FEN } from './fen';
import { normalizeColor, normalizeRole } from './normalize';
import { boardMove, boardSetPosition, boardSetTurn } from './reducers';
import type {
	BoardState,
	BoardStateInitOptions,
	BoardStateInternal,
	Color,
	Piece,
	PositionMap,
	PositionMapShort,
	SquareString
} from './types';

/**
 * Create a fresh internal state from options.
 * - If position is 'start' or FEN, pieces and (if not overridden) turn are derived from FEN.
 * - If position is a map, it's encoded directly (short map is normalized).
 * - All piece ids are (re)assigned freshly.
 */
function createBoardStateInternal(opts: BoardStateInitOptions = {}): BoardStateInternal {
	let pieces: Uint8Array;
	let turnFromPosition: Color | undefined;

	if (!opts.position || opts.position === 'start') {
		pieces = parseFenPlacement(START_FEN);
		turnFromPosition = parseFenTurn(START_FEN);
	} else if (typeof opts.position === 'string') {
		// FEN
		pieces = parseFenPlacement(opts.position);
		turnFromPosition = parseFenTurn(opts.position);
	} else {
		// Position map (long or short)
		pieces = buildPiecesFromPositionMap(opts.position);
	}

	// Resolve turn: explicit override > from FEN/start > default 'white'
	const turn = opts.turn ? normalizeColor(opts.turn) : (turnFromPosition ?? 'white');

	return {
		pieces,
		turn,
		positionEpoch: 0
	};
}

function buildPiecesFromPositionMap(map: PositionMap | PositionMapShort): Uint8Array {
	const out = new Uint8Array(64);
	for (const [sqStr, piece] of Object.entries(map)) {
		const sq = fromAlgebraic(sqStr as SquareString);
		const _piece = coercePieceInput(piece);
		out[sq] = encodePiece(_piece);
	}
	return out;
}

function coercePieceInput(p: { color: string; role: string }): Piece {
	// Narrow and normalize if short was provided
	const color = normalizeColor(p.color);
	const role = normalizeRole(p.role);
	return { color, role };
}

export function createBoardState(options: BoardStateInitOptions): BoardState {
	const internalState = createBoardStateInternal(options);

	return {
		setPosition(input, mutationSession) {
			return mutationSession.addMutation(
				'state.board.setPosition',
				boardSetPosition(internalState, input)
			);
		},
		setTurn(turn, mutationSession) {
			return mutationSession.addMutation('state.board.setTurn', boardSetTurn(internalState, turn));
		},
		move(move, mutationSession) {
			const result = boardMove(internalState, move);
			mutationSession.addMutation('state.board.move', true, result);
			return result;
		},
		getPieceCodeAt(square) {
			return internalState.pieces[square];
		},
		getSnapshot() {
			return cloneDeep(internalState);
		}
	};
}
