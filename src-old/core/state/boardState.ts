import { START_FEN, parseFenPlacement, parseFenTurn } from '../notation/fen';
import {
	BoardStateInternal,
	BoardStateSnapshot,
	Color,
	ColorInput,
	Piece,
	PositionInput,
	PositionMap,
	PositionMapShort,
	SquareString
} from './boardTypes';
import { fromAlgebraic } from './coords';
import { encodePiece } from './encode';
import { normalizeColor, normalizeRole } from './normalize';

export interface BoardStateInitOptions {
	position?: PositionInput; // 'start' | FEN | PositionMap | PositionMapShort
	turn?: ColorInput; // optional override of active color
}

/**
 * Create a fresh internal state from options.
 * - If position is 'start' or FEN, pieces and (if not overridden) turn are derived from FEN.
 * - If position is a map, it's encoded directly (short map is normalized).
 * - All piece ids are (re)assigned freshly.
 */
export function createBoardState(opts: BoardStateInitOptions = {}): BoardStateInternal {
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

	// Assign fresh ids for each occupied square
	const ids = new Int16Array(64);
	let nextId = 1;
	for (let i = 0; i < 64; i++) {
		if (pieces[i] !== 0) {
			ids[i] = nextId++;
		} else {
			ids[i] = -1;
		}
	}

	return {
		pieces,
		ids,
		turn,
		nextId,
		positionEpoch: 0
	};
}

/**
 * Build a public read-only snapshot of the current state.
 * - Clones the pieces array to prevent external mutation.
 * - Other fields are primitives or treated as read-only by convention.
 */
export function getBoardStateSnapshot(state: BoardStateInternal): BoardStateSnapshot {
	const snap: BoardStateSnapshot = {
		pieces: new Uint8Array(state.pieces),
		ids: new Int16Array(state.ids),
		turn: state.turn,
		positionEpoch: state.positionEpoch
	};
	// Cast to the readonly deep snapshot type. Data is either cloned or immutable primitives.
	return snap;
}

/**
 * Helpers
 */

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
