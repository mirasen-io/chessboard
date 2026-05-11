export type {
	ColorInput,
	MoveRequestInput,
	PiecePositionRecordString,
	PositionInput
} from './state/board/types/input.js';
export type { MoveOutput } from './state/board/types/output.js';
export type { MovabilityInput, MoveDestinationInput } from './state/interaction/types/input.js';
export { createBoard } from './wrapper/factory.js';
export type {
	Chessboard,
	ChessboardExtensionInput,
	ChessboardInitOptions
} from './wrapper/types.js';
