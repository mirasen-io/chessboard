import { fromAlgebraic, toValidSquare } from './coords';
import { decodePiece, encodePiece, isEmpty } from './encode';
import { START_FEN, parseFenPlacement, parseFenTurn } from './fen';
import { normalizeColor, normalizeRole } from './normalize';
import type {
	BoardStateInternal,
	Color,
	ColorInput,
	Move,
	MoveBase,
	MoveInput,
	Piece,
	PieceShort,
	PositionInput,
	PositionMap,
	PositionMapShort,
	RolePromotion,
	Square,
	SquareString
} from './types';

/**
 * Replace the entire board position from one of the accepted inputs.
 *
 * Semantics
 * - Clears the board first, then applies the provided position.
 * - Regenerates piece IDs for all occupied squares (ids[i] >= 1); empties get -1.
 * - Marks dirty layers for a full redraw:
 *   - DirtyLayer.Board | DirtyLayer.Pieces
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
 * @example
 * setBoardPosition(state, 'start');                      // standard start, white to move
 * setBoardPosition(state, '8/8/8/8/8/8/8/8 w - - 0 1');  // empty board, white to move
 * setBoardPosition(state, { e2: { color: 'w', role: 'p' }, e7: { color: 'b', role: 'p' } });
 */
export function boardSetPosition(state: BoardStateInternal, input: PositionInput): boolean {
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

	// Update turn from position if provided (do not override explicitly-set turn elsewhere)
	if (turnFromPosition) {
		state.turn = turnFromPosition;
	}

	// Increment position epoch to prevent false animation across position resets
	state.positionEpoch++;

	return true;
}

/**
 * Set active color turn.
 */
export function boardSetTurn(state: BoardStateInternal, c: ColorInput): boolean {
	const turn = normalizeColor(c);
	if (state.turn === turn) return false; // no-op
	state.turn = turn;
	return true;
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
 * - Toggles turn between 'white' and 'black'.
 * - Dirty tracking:
 *   - Dirty squares: from, to (and capturedSquare if en passant-like)
 *   - Dirty layers: DirtyLayer.Pieces
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
export function boardMove(state: BoardStateInternal, move: MoveInput): Move {
	// First prepare data and validate then atomic update to state
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

	// Determine capture square (normal capture at 'to', or EP-like via move.capturedSquare)
	const captureSq: Square | undefined =
		move?.capturedSquare !== undefined ? toValidSquare(move.capturedSquare) : to;
	let capturedPiece: Piece | undefined;
	if (captureSq !== undefined) {
		const codeAtCapture = state.pieces[captureSq];
		capturedPiece = isEmpty(codeAtCapture) ? undefined : decodePiece(codeAtCapture)!;
	}

	// Write destination: with promotion or same role
	let newPieceCode = movingCode;
	if (move?.promotion) {
		const newRole = normalizeRole(move.promotion);
		newPieceCode = encodePiece({ color: movingPiece.color, role: newRole });
	}

	// process secondary move if provided (e.g., rook move in castling)
	let secondaryMove: MoveBase | undefined;
	let secFrom: Square | undefined;
	let secTo: Square | undefined;
	let secCode: number | undefined;
	if (move?.secondary) {
		secFrom = toValidSquare(move.secondary.from);
		secTo = toValidSquare(move.secondary.to);
		if (secFrom === secTo) {
			throw new RangeError(
				`Secondary move source and destination squares are the same: ${secFrom}`
			);
		}
		if (to === secTo || from === secFrom || from === secTo || to === secFrom) {
			throw new RangeError(
				`Secondary move squares must differ from primary move squares: secondary from ${secFrom}, secondary to ${secTo}, primary from ${from}, primary to ${to}`
			);
		}
		secCode = state.pieces[secFrom];
		if (isEmpty(secCode)) {
			throw new RangeError(`Cannot move from empty square in secondary move: ${secFrom}`);
		}
		const secPiece = decodePiece(secCode);
		if (!secPiece) {
			throw new RangeError(`Invalid piece code at secondary from=${secFrom}`);
		}
		secondaryMove = { from: secFrom, to: secTo, moved: secPiece };
	}

	// Update now the state
	// Pieces
	state.pieces[to] = newPieceCode;
	state.pieces[from] = 0;
	// En passant-like capture: if capture square differs from 'to', clear it now
	if (captureSq !== undefined && captureSq !== to) {
		state.pieces[captureSq] = 0;
	}
	// Secondary move
	if (secFrom !== undefined && secTo !== undefined) {
		state.pieces[secTo] = state.pieces[secFrom];
		state.pieces[secFrom] = 0;
	}

	// Toggle turn
	state.turn = state.turn === 'white' ? 'black' : 'white';

	// Position epoch
	state.positionEpoch++;

	const promotion = move?.promotion ? (normalizeRole(move.promotion) as RolePromotion) : undefined;
	const result: Move = {
		from,
		to,
		moved: movingPiece,
		...(capturedPiece && { captured: capturedPiece }),
		...(capturedPiece && { capturedSquare: captureSq }),
		...(promotion && { promotion }),
		...(secondaryMove && { secondary: secondaryMove })
	};
	return result;
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
