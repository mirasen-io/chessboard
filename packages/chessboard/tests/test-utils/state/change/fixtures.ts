import type { MoveSnapshot, Square } from '../../../../src/state/board/types/internal.js';
import { PieceCode } from '../../../../src/state/board/types/internal.js';
import type { ChangeStateInternal } from '../../../../src/state/change/types/main.js';
import type { MoveDestinationSnapshot } from '../../../../src/state/interaction/types/internal.js';

/**
 * Creates a minimal MoveSnapshot with overridable fields.
 * Default: e2→e4 WhitePawn, no capture/promotion/secondary.
 */
export function makeMoveSnapshot(overrides: Partial<MoveSnapshot> = {}): MoveSnapshot {
	return {
		from: (overrides.from ?? 12) as Square, // e2
		to: (overrides.to ?? 28) as Square, // e4
		piece: overrides.piece ?? PieceCode.WhitePawn,
		...(overrides.promotedTo !== undefined ? { promotedTo: overrides.promotedTo } : {}),
		...(overrides.captured !== undefined ? { captured: overrides.captured } : {}),
		...(overrides.secondary !== undefined ? { secondary: overrides.secondary } : {})
	};
}

/**
 * Creates a minimal MoveDestinationSnapshot with overridable fields.
 * Default: to=28 (e4), no capturedSquare/promotedTo/secondary.
 */
export function makeMoveDestination(
	overrides: Partial<MoveDestinationSnapshot> = {}
): MoveDestinationSnapshot {
	return {
		to: (overrides.to ?? 28) as Square, // e4
		...(overrides.capturedSquare !== undefined ? { capturedSquare: overrides.capturedSquare } : {}),
		...(overrides.promotedTo !== undefined ? { promotedTo: overrides.promotedTo } : {}),
		...(overrides.secondary !== undefined ? { secondary: overrides.secondary } : {})
	};
}

/**
 * Creates a minimal ChangeStateInternal with overridable fields.
 */
export function makeChangeStateInternal(
	overrides: Partial<ChangeStateInternal> = {}
): ChangeStateInternal {
	return {
		lastMove: overrides.lastMove ?? null,
		deferredUIMoveRequest: overrides.deferredUIMoveRequest ?? null
	};
}
