export { createActiveTarget } from './first-party/active-target/factory.js';
export { createBoardEvents } from './first-party/board-events/factory.js';
export { createLastMove } from './first-party/last-move/factory.js';
export { createLegalMoves } from './first-party/legal-moves/factory.js';
export { createMainRenderer } from './first-party/main-renderer/factory.js';
export { createSelectedSquare } from './first-party/selected-square/factory.js';

export type {
	AnyExtensionDefinition,
	ExtensionDefinitionId,
	ExtensionDefinitionPublicApi
} from './types/extension.js';

export type { BuiltInExtensionId, DefaultBuiltinChessboardExtensions } from './types/wrapper.js';
