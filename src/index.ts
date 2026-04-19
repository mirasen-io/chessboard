export { createBoard } from './wrapper/factory.js';

export type {
	Chessboard,
	ChessboardExtensionInput,
	ChessboardInitOptions,
	ChessboardRuntimeSurface
} from './wrapper/types.js';

export type { MoveRequestInput, PiecePositionRecordString } from './state/board/types/input.js';
export type { RuntimeStateInitOptions } from './state/types.js';
