import { isEmptyPieceCode, piecePositionsEqual, positionsEqual } from './check.js';
import { denormalizeSquare } from './denormalize.js';
import { fromPieceCode, toPieceCode } from './piece.js';
import {
	ColorCode,
	Move,
	MoveBase,
	MoveCaptured,
	MoveRequest,
	MoveRequestBase,
	PieceCode,
	PositionSnapshot
} from './types/internal.js';
import { BoardStateInternal } from './types/main.js';

export function boardSetPiecePosition(state: BoardStateInternal, pieces: Uint8Array): boolean {
	if (piecePositionsEqual(state, { pieces })) return false; // no-op
	state.pieces = new Uint8Array(pieces);

	state.positionEpoch++;
	return true;
}

export function boardSetTurn(state: BoardStateInternal, turn: ColorCode): boolean {
	if (state.turn === turn) return false; // no-op
	state.turn = turn;
	state.positionEpoch++;
	return true;
}

export function boardSetPosition(state: BoardStateInternal, position: PositionSnapshot): boolean {
	if (positionsEqual(state, position)) return false; // no-op
	state.pieces = new Uint8Array(position.pieces);
	state.turn = position.turn;
	state.positionEpoch++;
	return true;
}

function buildMoveBase(state: BoardStateInternal, request: MoveRequestBase): MoveBase {
	const from = request.from;
	const to = request.to;
	if (from === to) {
		throw new RangeError(`Source and destination squares are the same: ${from}`);
	}
	const moved = state.pieces[from];
	if (isEmptyPieceCode(moved)) {
		throw new RangeError(`Cannot move from empty square: ${from}`);
	}
	return {
		from,
		to,
		piece: moved
	};
}

function buildMove(state: BoardStateInternal, request: MoveRequest): Move {
	const base = buildMoveBase(state, request);
	let captured: MoveCaptured | undefined;
	const captureSq = request.capturedSquare ?? request.to;
	const codeAtCapture = state.pieces[captureSq];
	if (!isEmptyPieceCode(codeAtCapture)) {
		captured = { piece: codeAtCapture, square: captureSq };
	}

	let secondary: MoveBase | undefined;
	if (request.secondary) {
		secondary = buildMoveBase(state, request.secondary);
		if (
			secondary.from === base.to ||
			secondary.to === base.to ||
			secondary.from === base.from ||
			secondary.to === base.from
		) {
			throw new RangeError(
				`Secondary move squares cannot overlap with primary move squares: ${denormalizeSquare(secondary.from)}, ${denormalizeSquare(secondary.to)} vs ${denormalizeSquare(base.from)}, ${denormalizeSquare(base.to)}`
			);
		}
	}

	return {
		...base,
		...(captured && { captured }),
		...(request.promotedTo && { promotedTo: request.promotedTo }),
		...(secondary && { secondary })
	};
}

export function boardMove(state: BoardStateInternal, request: MoveRequest): Move {
	const move = buildMove(state, request);
	const moved = fromPieceCode(move.piece);
	const newPieceCode: PieceCode = move.promotedTo
		? toPieceCode(move.promotedTo, moved.color)
		: move.piece;
	state.pieces[move.to] = newPieceCode;
	state.pieces[move.from] = PieceCode.Empty;

	if (move.captured && move.captured.square !== move.to) {
		state.pieces[move.captured.square] = PieceCode.Empty;
	}

	if (move.secondary) {
		state.pieces[move.secondary.to] = move.secondary.piece;
		state.pieces[move.secondary.from] = PieceCode.Empty;
	}

	// Toggle turn
	state.turn = state.turn === ColorCode.White ? ColorCode.Black : ColorCode.White;

	// Increment position epoch
	state.positionEpoch++;

	return move;
}
