import assert from '@ktarmyshov/assert';
import { MoveSnapshot, PieceCode } from '../../../state/board/types/internal.js';
import { BoardStateSnapshot } from '../../../state/board/types/main.js';
import { ChangeStateSnapshot } from '../../../state/change/types/main.js';
import { RuntimeStateSnapshot } from '../../../state/types.js';

export function deriveRuntimeState(state: RuntimeStateSnapshot): RuntimeStateSnapshot {
	const request = state.change.deferredUIMoveRequest;
	if (request === null) return state; // nothing to do
	const newPieces = new Uint8Array(state.board.pieces);
	const from = request.sourceSquare;
	const to = request.destination.to;
	const pieceCode = state.board.pieces[from];
	assert(
		pieceCode === PieceCode.WhitePawn || pieceCode === PieceCode.BlackPawn,
		'Only pawn moves should be deferred UI move requests at this time'
	);
	newPieces[to] = pieceCode;
	newPieces[from] = PieceCode.Empty;
	const newBoard: BoardStateSnapshot = {
		...state.board,
		pieces: newPieces
	};
	const newLastMove: MoveSnapshot = {
		from,
		to,
		piece: pieceCode
	};
	const newChange: ChangeStateSnapshot = {
		...state.change,
		lastMove: newLastMove
	};
	return {
		...state,
		board: newBoard,
		change: newChange
	};
}
