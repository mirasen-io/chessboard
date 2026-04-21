import { ReadonlyDeep } from 'type-fest';
import type { PieceCode, Square } from '../../../state/board/types/internal.js';

export interface ExtensionDragSessionBase {
	sourceSquare: Square | null;
	sourcePieceCode: PieceCode | null;
	targetSquare: Square | null;
}

export interface ExtensionDragSessionLiftedPiece extends ExtensionDragSessionBase {
	type: 'lifted-piece-drag';
	sourcePieceCode: PieceCode;
}

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
