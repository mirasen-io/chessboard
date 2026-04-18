import { ReadonlyDeep } from 'type-fest';
import { BoardStateMutationSession } from '../mutation';
import { ColorInput, MoveRequestInput, PiecePositionInput, PositionInput } from './input';
import { ColorCode, Move, MoveRequest, PieceCode, Square } from './internal';

export interface BoardStateInternal {
	// Encoded pieces on the board
	pieces: Uint8Array;
	// current turn
	turn: ColorCode;
	// Incremented on position changes
	positionEpoch: number;
}

export type BoardStateSnapshot = ReadonlyDeep<BoardStateInternal>;

export interface BoardState {
	setPosition(input: PositionInput, mutationSession: BoardStateMutationSession): boolean;
	setPiecePosition(input: PiecePositionInput, mutationSession: BoardStateMutationSession): boolean;
	setTurn(turn: ColorInput, mutationSession: BoardStateMutationSession): boolean;
	move(request: MoveRequestInput | MoveRequest, mutationSession: BoardStateMutationSession): Move;
	getPieceCodeAt(square: Square): PieceCode;
	getSnapshot(): BoardStateSnapshot;
}
