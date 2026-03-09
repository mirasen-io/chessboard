import { START_FEN, parseFenPlacement, parseFenTurn } from '../notation/fen';
import { fromAlgebraic } from './coords';
import { encodePiece } from './encode';
import { normalizeColor, normalizeRole } from './normalize';
import {
	Color,
	ColorInput,
	Move,
	Piece,
	PositionInput,
	PositionMap,
	PositionMapShort,
	Square,
	SquareString,
	StateSnapshot,
	Theme
} from './types';

/**
 * Internal state shape (not exported publicly). Reducers will operate on this.
 */
export interface InternalState {
	pieces: Uint8Array;
	ids: Int16Array;
	nextId: number;

	orientation: Color;
	turn: Color;
	selected: Square | null;
	lastMove: Move | null;

	theme: Theme;

	dirtySquares: Set<Square>;
	dirtyLayers: number;
}

/**
 * Default board theme. Renderer may use richer themes; this is state-level awareness only.
 */
export const DEFAULT_THEME: Theme = {
	light: '#f0d9b5',
	dark: '#b58863',
	selection: 'rgba(255, 215, 0, 0.6)',
	lastMove: 'rgba(246, 246, 105, 0.6)',
	highlight: 'rgba(0, 128, 255, 0.35)',
	coords: '#333'
};

export interface InitialStateOptions {
	position?: PositionInput; // 'start' | FEN | PositionMap | PositionMapShort
	orientation?: ColorInput; // 'white' | 'black' | 'w' | 'b'
	turn?: ColorInput; // optional override of active color
	theme?: Partial<Theme>;
}

/**
 * Create a fresh internal state from options.
 * - If position is 'start' or FEN, pieces and (if not overridden) turn are derived from FEN.
 * - If position is a map, it's encoded directly (short map is normalized).
 * - Orientation defaults to 'white' unless provided.
 * - All piece ids are (re)assigned freshly.
 */
export function createInitialState(opts: InitialStateOptions = {}): InternalState {
	const orientation: Color = opts.orientation ? normalizeColor(opts.orientation) : 'white';

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

	const theme: Theme = { ...DEFAULT_THEME, ...(opts.theme ?? {}) };

	return {
		pieces,
		ids,
		nextId,
		orientation,
		turn,
		selected: null,
		lastMove: null,
		theme,
		dirtySquares: new Set<Square>(),
		dirtyLayers: 0
	};
}

/**
 * Build a public read-only snapshot of the current state.
 * - Clones the pieces array to prevent external mutation.
 * - Other fields are primitives or treated as read-only by convention.
 */
export function getSnapshot(state: InternalState): StateSnapshot {
	const snap: StateSnapshot = {
		pieces: new Uint8Array(state.pieces),
		ids: new Int16Array(state.ids),
		orientation: state.orientation,
		turn: state.turn,
		selected: state.selected,
		lastMove: state.lastMove,
		theme: state.theme
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
