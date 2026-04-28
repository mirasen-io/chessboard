import type {
	AnimationPlanningInput,
	AnimationPlanningSnapshot
} from '../../../src/animation/types.js';
import {
	ColorCode,
	PieceCode,
	type Square,
	SQUARE_COUNT
} from '../../../src/state/board/types/internal.js';
import type { BoardStateSnapshot } from '../../../src/state/board/types/main.js';
import type { ChangeStateSnapshot } from '../../../src/state/change/types/main.js';
import { MovabilityModeCode } from '../../../src/state/interaction/types/internal.js';
import type { InteractionStateSnapshot } from '../../../src/state/interaction/types/main.js';

/**
 * Creates a BoardStateSnapshot with an empty board by default.
 * Accepts sparse piece placements.
 */
export function makeBoardSnapshot(
	placements: Array<[Square, PieceCode]> = [],
	overrides: { turn?: ColorCode; positionEpoch?: number } = {}
): BoardStateSnapshot {
	const pieces = new Uint8Array(SQUARE_COUNT);
	for (const [sq, code] of placements) {
		pieces[sq] = code;
	}
	return {
		pieces,
		turn: overrides.turn ?? ColorCode.White,
		positionEpoch: overrides.positionEpoch ?? 0
	};
}

/**
 * Creates a minimal ChangeStateSnapshot.
 */
export function makeChangeSnapshot(
	overrides: Partial<ChangeStateSnapshot> = {}
): ChangeStateSnapshot {
	return {
		lastMove: overrides.lastMove ?? null,
		deferredUIMoveRequest: overrides.deferredUIMoveRequest ?? null
	};
}

/**
 * Creates a minimal InteractionStateSnapshot.
 */
export function makeInteractionSnapshot(
	overrides: Partial<InteractionStateSnapshot> = {}
): InteractionStateSnapshot {
	return {
		selected: overrides.selected ?? null,
		movability: overrides.movability ?? { mode: MovabilityModeCode.Disabled },
		activeDestinations: overrides.activeDestinations ?? new Map(),
		dragSession: overrides.dragSession ?? null
	};
}

/**
 * Creates an AnimationPlanningSnapshot with sensible empty defaults.
 */
export function makeSnapshot(
	overrides: {
		board?: BoardStateSnapshot;
		change?: ChangeStateSnapshot;
		interaction?: InteractionStateSnapshot;
	} = {}
): AnimationPlanningSnapshot {
	return {
		board: overrides.board ?? makeBoardSnapshot(),
		change: overrides.change ?? makeChangeSnapshot(),
		interaction: overrides.interaction ?? makeInteractionSnapshot()
	};
}

/**
 * Creates an AnimationPlanningInput from previous/current overrides.
 */
export function makeInput(
	overrides: {
		previous?: Partial<Parameters<typeof makeSnapshot>[0]>;
		current?: Partial<Parameters<typeof makeSnapshot>[0]>;
	} = {}
): AnimationPlanningInput {
	return {
		previous: makeSnapshot(overrides.previous ?? {}),
		current: makeSnapshot(overrides.current ?? {})
	};
}
