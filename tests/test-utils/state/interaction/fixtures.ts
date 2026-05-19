import {
	PieceCode,
	type NonEmptyPieceCode,
	type Square
} from '../../../../src/state/board/types/internal.js';
import { DefaultInteractionDesktopConfig } from '../../../../src/state/interaction/config.js';
import type {
	DragSessionCoreOwnedSnapshot,
	MovabilityModeCode
} from '../../../../src/state/interaction/types/internal.js';
import type {
	InteractionStateInternal,
	InteractionStateSelected
} from '../../../../src/state/interaction/types/main.js';

export function makeSelected(
	square: Square = 12 as Square,
	pieceCode: NonEmptyPieceCode = PieceCode.WhitePawn as NonEmptyPieceCode
): InteractionStateSelected {
	return { square, pieceCode };
}

export function makeDragSessionCoreOwned(
	overrides: Partial<DragSessionCoreOwnedSnapshot> &
		Pick<DragSessionCoreOwnedSnapshot, 'startButton'>
): DragSessionCoreOwnedSnapshot {
	return {
		owner: 'core',
		type: overrides.type ?? 'lifted-piece-drag',
		sourceSquare: overrides.sourceSquare ?? (12 as Square),
		sourcePieceCode: overrides.sourcePieceCode ?? PieceCode.WhitePawn,
		targetSquare: overrides.targetSquare ?? null,
		startButton: overrides.startButton
	};
}

export function makeInteractionStateInternal(
	overrides: Partial<InteractionStateInternal> = {}
): InteractionStateInternal {
	return {
		selected: overrides.selected ?? null,
		movability: overrides.movability ?? { mode: 0 as MovabilityModeCode.Disabled },
		activeDestinations: overrides.activeDestinations ?? new Map(),
		dragSession: overrides.dragSession ?? null,
		config: overrides.config ?? DefaultInteractionDesktopConfig
	};
}
