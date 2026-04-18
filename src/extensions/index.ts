export { createActiveTarget } from './first-party/active-target/factory';
export { createBoardEvents } from './first-party/board-events/factory';
export { createLastMove } from './first-party/last-move/factory';
export { createLegalMoves } from './first-party/legal-moves/factory';
export { createMainRenderer } from './first-party/main-renderer/factory';
export { createSelectedSquare } from './first-party/selected-square/factory';

export type {
	AnyExtensionDefinition,
	ExtensionDefinitionId,
	ExtensionDefinitionPublicApi
} from './types/extension';

export type { BuiltInExtensionId, DefaultBuiltinChessboardExtensions } from './types/wrapper';
