import type { MainRendererConfigPublic } from './extensions/first-party/main-renderer/types/public.js';
import {
	DefaultMainRendererDesktopConfig,
	DefaultMainRendererMobileConfig
} from './extensions/index.js';
import {
	DefaultInteractionDesktopConfig,
	DefaultInteractionMobileConfig
} from './state/interaction/config.js';
import type { InteractionConfig } from './state/interaction/types/config.js';

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

export interface ChessboardConfig {
	readonly interaction: InteractionConfig;
	readonly renderer: MainRendererConfigPublic;
}

export { DefaultInteractionDesktopConfig, DefaultInteractionMobileConfig };

export const DefaultChessboardDesktopConfig: ChessboardConfig = {
	interaction: DefaultInteractionDesktopConfig,
	renderer: DefaultMainRendererDesktopConfig
} as const;

export const DefaultChessboardMobileConfig: ChessboardConfig = {
	interaction: DefaultInteractionMobileConfig,
	renderer: DefaultMainRendererMobileConfig
} as const;
