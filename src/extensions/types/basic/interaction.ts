import type { ReadonlyDeep } from 'type-fest';
import type { PieceCode, Square } from '../../../state/board/types/internal.js';
import type { ScenePoint } from './transient-visuals.js';

export interface ExtensionDragSessionBase {
	sourceSquare: Square | null;
	sourcePieceCode: PieceCode | null;
	targetSquare: Square | null;
	startButton: number;
}

export interface ExtensionDragSessionLiftedPieceBase extends ExtensionDragSessionBase {
	type: 'lifted-piece-drag';
	sourcePieceCode: PieceCode;
}

export interface ExtensionDragSessionPendingLiftedPiece extends ExtensionDragSessionLiftedPieceBase {
	phase: 'pending';
	startPoint: ScenePoint;
	thresholdPx: number;
}

export interface ExtensionDragSessionActiveLiftedPiece extends ExtensionDragSessionLiftedPieceBase {
	phase: 'active';
}

export type ExtensionDragSessionLiftedPiece =
	| ExtensionDragSessionPendingLiftedPiece
	| ExtensionDragSessionActiveLiftedPiece;

export interface ExtensionDragSessionReleaseTargeting extends ExtensionDragSessionBase {
	type: 'release-targeting';
}

type ExtensionCustomDragSessionType = `ext:${string}`;
export interface ExtensionDragSessionCustom extends ExtensionDragSessionBase {
	type: ExtensionCustomDragSessionType;
}

export type ExtensionDragSession =
	| ExtensionDragSessionLiftedPiece
	| ExtensionDragSessionReleaseTargeting
	| ExtensionDragSessionCustom;

export type ExtensionDragSessionSnapshot = ReadonlyDeep<ExtensionDragSession>;
