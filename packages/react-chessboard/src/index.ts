export { Chessboard } from './Chessboard.js';
export type {
	BoardOrientation,
	ChessboardHandle,
	ChessboardProps,
	ExternalMoveRequest,
	PositionRequest
} from './types.js';

// Re-export core types for consumer convenience
export type {
	ColorInput,
	MovabilityInput,
	MoveOutput,
	MoveRequestInput,
	PositionInput,
	SquareString
} from '@mirasen/chessboard';
