import { START_FEN, parseFenPlacement, parseFenTurn } from '../notation/fen';
import type { InternalState } from './boardState';
import { assertValidSquare, fromAlgebraic, toValidSquare } from './coords';
import { decodePiece, encodePiece, isEmpty } from './encode';
import { normalizeColor, normalizeRole } from './normalize';
import type {
	CastleSquare,
	Color,
	ColorInput,
	Move,
	MoveInput,
	PieceShort,
	PositionInput,
	PositionMap,
	PositionMapShort,
	RolePromotion,
	RolePromotionInput,
	Square,
	SquareString
} from './types';
import { DirtyLayer, Piece } from './types';

/**
 * Replace the entire board position from one of the accepted inputs.
 *
 * Semantics
 * - Clears the board first, then applies the provided position.
 * - Regenerates piece IDs for all occupied squares (ids[i] >= 1); empties get -1.
 * - Resets selection and last move:
 *   - selected = null
 *   - lastMove = null
 * - Marks dirty layers for a full redraw:
 *   - DirtyLayer.Board | DirtyLayer.Coords | DirtyLayer.Pieces
 * - Turn handling:
 *   - If input is 'start' or a FEN string, state.turn is set from the FEN active color.
 *   - If input is a PositionMap/PositionMapShort (sparse map), state.turn is NOT changed.
 *
 * Inputs
 * - 'start'                Standard initial position (START_FEN).
 * - FEN                    Full FEN string; field 1 (placement) and field 2 (active color) are used.
 * - PositionMap            Sparse map of occupied squares using canonical Piece (: 'white'|'black', role: 'pawn'|'knight'|'bishop'|'rook'|'queen'|'king').
 * - PositionMapShort       Sparse map using short aliases (color: 'w'|'b', role: 'p'|'N'|'B'|'R'|'Q'|'K').
 *
 * Errors
 * - Invalid FEN strings throw with descriptive messages.
 * - Invalid algebraic square keys throw a RangeError.
 * - Invalid role/color short aliases throw a RangeError.
 *
 * @param state Internal mutable state
 * @param input 'start' | FEN | PositionMap | PositionMapShort
 * @returns void
 * @example
 * setPosition(state, 'start');                      // standard start, white to move
 * setPosition(state, '8/8/8/8/8/8/8/8 w - - 0 1');  // empty board, white to move
 * setPosition(state, { e2: { color: 'w', role: 'p' }, e7: { color: 'b', role: 'p' } });
 */
export function setPosition(state: InternalState, input: PositionInput): void {
	let pieces: Uint8Array;
	let turnFromPosition: Color | undefined;

	if (input === 'start') {
		pieces = parseFenPlacement(START_FEN);
		turnFromPosition = parseFenTurn(START_FEN);
	} else if (typeof input === 'string') {
		// FEN
		pieces = parseFenPlacement(input);
		turnFromPosition = parseFenTurn(input);
	} else {
		// Position map (long or short)
		pieces = buildPiecesFromPositionMap(input);
	}

	state.pieces = pieces;

	// Assign fresh ids for each occupied square
	state.ids = new Int16Array(64);
	state.nextId = 1;
	for (let i = 0; i < 64; i++) {
		if (state.pieces[i] !== 0) {
			state.ids[i] = state.nextId++;
		} else {
			state.ids[i] = -1;
		}
	}

	state.selected = null;

	// Update turn from position if provided (do not override explicitly-set turn elsewhere)
	if (turnFromPosition) {
		state.turn = turnFromPosition;
	}

	clearDirty(state);
	markDirtyLayer(state, DirtyLayer.Board | DirtyLayer.Pieces);
}

/**
 * Set active color turn.
 */
export function setTurn(state: InternalState, c: ColorInput): void {
	state.turn = normalizeColor(c);
}

/**
 * Set board orientation (view).
 */
export function setOrientation(state: InternalState, c: ColorInput): void {
	state.orientation = normalizeColor(c);
	markDirtyLayer(state, DirtyLayer.Board);
}

/**
 * Select a square or clear selection with null.
 * Accepts numeric or algebraic square.
 */
export function select(state: InternalState, sq: Square | SquareString | null): void {
	const newSel: Square | null = sq === null ? null : toValidSquare(sq as Square | SquareString); // toValidSquare will validate the square input
	if (state.selected === newSel) return;
	state.selected = newSel;
}

type CastleString = {
	rookFrom: SquareString;
	rookTo: SquareString;
};
export type CastleOptions = CastleSquare | CastleString;

export interface MoveOptions {
	promotion?: RolePromotionInput;
	capturedSquare?: Square | SquareString; // Optional: the square of the captured piece, useful for en passant
	castle?: CastleOptions; // Optional: if this move is a castling move, provide details
}
/**
 * Apply a UI-level move from one square to another. No legality is enforced here.
 *
 * Semantics
 * - Accepts MoveInput: numeric squares (0..63) or algebraic strings (e.g., 'e4').
 * - Preserves the moving piece ID (ID from source transferred to destination).
 * - Capture is handled by overwriting the destination square.
 * - Promotion:
 *   - If opts.promotion is provided, the moving piece role is replaced by the promoted role.
 *   - RolePromotionInput accepts both long and short forms (e.g., 'queen' or 'Q').
 * - Updates turn and last move:
 *   - lastMove = { from, to }
 *   - turn toggles between 'white' and 'black'
 * - Dirty tracking:
 *   - Dirty squares: from, to
 *   - Dirty layers: DirtyLayer.Pieces | DirtyLayer.LastMove | DirtyLayer.Highlights
 *
 * Limitations (by design)
 * - No rules/legality checks (e.g., legal moves, check, en passant, castling) — handled by higher-level policy/integration.
 * - En passant/castling/halfmove/fullmove counters are not maintained here.
 *
 * Errors
 * - Moving from an empty square throws RangeError.
 * - Invalid squares (out of [0..63] or bad algebraic) throw a RangeError.
 *
 * @param state Internal mutable state
 * @param move MoveInput
 * @param opts Optional MoveOptions { promotion?: RolePromotionInput }
 * @returns Move
 * @example
 * move(state, { from: 'e2', to: 'e4' });
 * move(state, { from: 12, to: 28 }); // numeric squares
 * move(state, { from: 'a7', to: 'a8' }, { promotion: 'Q' });       // short
 * move(state, { from: 'a7', to: 'a8' }, { promotion: 'queen' });   // long
 * move(state, { from: 'e1', to: 'g1' }, { castle: { rookFrom: 'h1', rookTo: 'f1' } }); // castling with algebraic squares
 * move(state, { from: 6, to: 4 }, { castle: { rookFrom: 7, rookTo: 5 } }); // castling with numeric squares
 * move(state, { from: 'e5', to: 'd6' }, { capturedSquare: 'd5' }); // en passant-like move where the captured piece is on a different square
 * move(state, { from: 20, to: 27 }, { capturedSquare: 19 }); // en passant-like move with numeric captured square
 */
export function move(state: InternalState, move: MoveInput, opts?: MoveOptions): Move {
	const from = toValidSquare(move.from); // toValidSquare will validate the square input
	const to = toValidSquare(move.to); // toValidSquare will validate the square input

	if (from === to) {
		throw new RangeError(`Source and destination squares are the same: ${from}`);
	}

	const movingCode = state.pieces[from];
	if (isEmpty(movingCode)) {
		throw new RangeError(`Cannot move from empty square: ${from}`);
	}

	// Decode moving piece to determine color and current role
	const movingPiece = decodePiece(movingCode);
	if (!movingPiece) throw new RangeError(`Invalid piece code at from=${from}`);

	// Preserve id of moving piece
	const movingId = state.ids[from];

	// Determine capture square (normal capture at 'to', or EP-like via opts.capturedSquare)
	const capSq = opts?.capturedSquare;
	const captureSq: Square | undefined = capSq !== undefined ? toValidSquare(capSq) : to;
	let capturedPiece: Piece | undefined;
	if (captureSq !== undefined) {
		const codeAtCapture = state.pieces[captureSq];
		capturedPiece = isEmpty(codeAtCapture) ? undefined : decodePiece(codeAtCapture)!;
		// En passant-like capture: if capture square differs from 'to', clear it now
		if (captureSq !== to) {
			state.pieces[captureSq] = 0;
			state.ids[captureSq] = -1;
			markDirtySquare(state, captureSq);
		}
	}

	// Write destination: with promotion or same role
	const newRole = opts?.promotion ? normalizeRole(opts.promotion) : movingPiece.role;
	const newPieceCode = encodePiece({ color: movingPiece.color, role: newRole });

	state.pieces[to] = newPieceCode;
	state.ids[to] = movingId;
	markDirtySquare(state, to);

	// Clear source square
	state.pieces[from] = 0;
	state.ids[from] = -1;
	markDirtySquare(state, from);

	// Castling rook move if provided
	let castle: CastleSquare | undefined;
	if (opts?.castle) {
		const rookFrom = toValidSquare(opts.castle.rookFrom);
		const rookTo = toValidSquare(opts.castle.rookTo);
		const rookCode = state.pieces[rookFrom];
		const rookId = state.ids[rookFrom];
		if (!isEmpty(rookCode) && rookId !== -1) {
			state.pieces[rookTo] = rookCode;
			state.ids[rookTo] = rookId;
			state.pieces[rookFrom] = 0;
			state.ids[rookFrom] = -1;
			castle = { rookFrom, rookTo };

			markDirtySquare(state, rookFrom);
			markDirtySquare(state, rookTo);
			markDirtyLayer(state, DirtyLayer.Pieces);
		}
	}

	// Toggle turn
	state.turn = state.turn === 'white' ? 'black' : 'white';

	// Dirty tracking
	markDirtySquare(state, from);
	markDirtySquare(state, to);
	markDirtyLayer(state, DirtyLayer.Pieces);

	const promotion = opts?.promotion ? (normalizeRole(opts.promotion) as RolePromotion) : undefined;
	const result: Move = {
		from,
		to,
		moved: movingPiece,
		...(capturedPiece && { captured: capturedPiece }),
		...(capturedPiece && { capturedSquare: captureSq }), // Include capturedSquare if there was a capture
		...(promotion && { promotion }),
		...(move.castleSide && { castleSide: move.castleSide }),
		...(castle && { castle })
	};
	return result;
}

/**
 * Mark a specific square as dirty (for region-specific invalidation).
 */
export function markDirtySquare(state: InternalState, sq: Square): void {
	assertValidSquare(sq);
	state.dirtySquares.add(sq);
}

/**
 * Mark one or more layers dirty (bitmask).
 */
export function markDirtyLayer(state: InternalState, layerMask: number): void {
	state.dirtyLayers |= layerMask;
}

/**
 * Clear all dirty flags.
 */
export function clearDirty(state: InternalState): void {
	state.dirtySquares.clear();
	state.dirtyLayers = 0;
}

/**
 * Helpers local to reducers
 */

function buildPiecesFromPositionMap(map: PositionMap | PositionMapShort): Uint8Array {
	const out = new Uint8Array(64);
	for (const [sqStr, piece] of Object.entries<Piece | PieceShort>(map)) {
		const sq = fromAlgebraic(sqStr as SquareString);
		const color = normalizeColor(piece.color);
		const role = normalizeRole(piece.role);
		out[sq] = encodePiece({ color, role });
	}
	return out;
}
