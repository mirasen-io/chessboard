import { createActiveTarget } from '../first-party/active-target/factory.js';
import { EXTENSION_ID as EXTENSION_ID_ACTIVE_TARGET } from '../first-party/active-target/types.js';
import { createAnnotations } from '../first-party/annotations/factory.js';
import { EXTENSION_ID as EXTENSION_ID_ANNOTATIONS } from '../first-party/annotations/types/main.js';
import { createAutoPromote } from '../first-party/auto-promote/factory.js';
import { EXTENSION_ID as EXTENSION_ID_AUTO_PROMOTE } from '../first-party/auto-promote/types.js';
import { createBoardEvents } from '../first-party/board-events/factory.js';
import { EXTENSION_ID as EXTENSION_ID_BOARD_EVENTS } from '../first-party/board-events/types.js';
import { createCheck } from '../first-party/check/factory.js';
import { EXTENSION_ID as EXTENSION_ID_CHECK } from '../first-party/check/types.js';
import { createLastMove } from '../first-party/last-move/factory.js';
import { EXTENSION_ID as EXTENSION_ID_LAST_MOVE } from '../first-party/last-move/types.js';
import { createLegalMoves } from '../first-party/legal-moves/factory.js';
import { EXTENSION_ID as EXTENSION_ID_LEGAL_MOVES } from '../first-party/legal-moves/types.js';
import { createMainRenderer } from '../first-party/main-renderer/factory.js';
import { EXTENSION_ID as EXTENSION_ID_RENDERER } from '../first-party/main-renderer/types/extension.js';
import { createPromotion } from '../first-party/promotion/factory.js';
import { EXTENSION_ID as EXTENSION_ID_PROMOTION } from '../first-party/promotion/types/main.js';
import { createSelectedSquare } from '../first-party/selected-square/factory.js';
import { EXTENSION_ID as EXTENSION_ID_SELECTED_SQUARE } from '../first-party/selected-square/types.js';
import { createWatermark } from '../first-party/watermark/factory.js';
import { EXTENSION_ID as EXTENSION_ID_WATERMARK } from '../first-party/watermark/types.js';

export const builtInExtensionFactoryMap = {
	[EXTENSION_ID_RENDERER]: createMainRenderer,
	[EXTENSION_ID_WATERMARK]: createWatermark,
	[EXTENSION_ID_SELECTED_SQUARE]: createSelectedSquare,
	[EXTENSION_ID_LAST_MOVE]: createLastMove,
	[EXTENSION_ID_ACTIVE_TARGET]: createActiveTarget,
	[EXTENSION_ID_LEGAL_MOVES]: createLegalMoves,
	[EXTENSION_ID_BOARD_EVENTS]: createBoardEvents,
	[EXTENSION_ID_AUTO_PROMOTE]: createAutoPromote,
	[EXTENSION_ID_PROMOTION]: createPromotion,
	[EXTENSION_ID_ANNOTATIONS]: createAnnotations,
	[EXTENSION_ID_CHECK]: createCheck
};
export type BuiltInExtensionId = keyof typeof builtInExtensionFactoryMap;
export type BuiltInExtensionDefinitionMap = {
	[Id in BuiltInExtensionId]: ReturnType<(typeof builtInExtensionFactoryMap)[Id]>;
};

export const DefaultBuiltinChessboardExtensions = [
	EXTENSION_ID_RENDERER,
	EXTENSION_ID_WATERMARK,
	EXTENSION_ID_SELECTED_SQUARE,
	EXTENSION_ID_LAST_MOVE,
	EXTENSION_ID_ACTIVE_TARGET,
	EXTENSION_ID_LEGAL_MOVES,
	EXTENSION_ID_BOARD_EVENTS,
	EXTENSION_ID_AUTO_PROMOTE,
	EXTENSION_ID_PROMOTION,
	EXTENSION_ID_ANNOTATIONS,
	EXTENSION_ID_CHECK
] as const;
export type DefaultBuiltinChessboardExtensions = typeof DefaultBuiltinChessboardExtensions;
