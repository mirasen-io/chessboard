export { createBoard } from './wrapper/factory';

export type {
	Chessboard,
	ChessboardExtensionInput,
	ChessboardInitOptions,
	ChessboardRuntimeSurface
} from './wrapper/types';

export type { MoveRequestInput, PiecePositionRecordString } from './state/board/types/input';
export type { RuntimeStateInitOptions } from './state/types';
