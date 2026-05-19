import { vi } from 'vitest';
import type { ScenePointerEvent } from '../../../src/extensions/types/basic/events.js';
import type {
	InteractionControllerOnEventContext,
	RuntimeInteractionSurface
} from '../../../src/runtime/input/controller/types.js';
import { type PieceCode, type Square } from '../../../src/state/board/types/internal.js';
import { DefaultInteractionDesktopConfig } from '../../../src/state/interaction/config.js';
import { MovabilityModeCode } from '../../../src/state/interaction/types/internal.js';
import type { InteractionStateSnapshot } from '../../../src/state/interaction/types/main.js';

/**
 * Creates a mock RuntimeInteractionSurface with all methods as vi.fn().
 * The getInteractionStateSnapshot returns a controllable snapshot.
 */
export function createMockSurface(
	overrides?: Partial<{
		snapshot: Partial<InteractionStateSnapshot>;
		getPieceCodeAt: (square: Square) => PieceCode;
	}>
): RuntimeInteractionSurface {
	const snapshot: InteractionStateSnapshot = {
		selected: null,
		movability: { mode: MovabilityModeCode.Disabled },
		activeDestinations: new Map(),
		dragSession: null,
		config: DefaultInteractionDesktopConfig,
		...overrides?.snapshot
	};
	return {
		getInteractionStateSnapshot: vi.fn(() => snapshot),
		getPieceCodeAt:
			overrides?.getPieceCodeAt ?? (vi.fn(() => 0) as unknown as (square: Square) => PieceCode),
		startLiftedDrag: vi.fn(),
		startReleaseTargetingDrag: vi.fn(),
		completeCoreDragTo: vi.fn(),
		completeExtensionDrag: vi.fn(),
		updateDragSessionCurrentTarget: vi.fn(),
		cancelActiveInteraction: vi.fn(),
		cancelInteraction: vi.fn(),
		transientInput: vi.fn(),
		onEvent: vi.fn()
	};
}

/**
 * Creates an InteractionControllerOnEventContext with controllable properties.
 * This is the context shape used by the controller's onEvent and pointer decision functions.
 */
export function createEventContext(
	overrides?: Partial<{
		rawEvent: Event;
		sceneEvent: ScenePointerEvent | null;
	}>
): InteractionControllerOnEventContext {
	return {
		rawEvent: overrides?.rawEvent ?? new Event('unknown'),
		sceneEvent: overrides?.sceneEvent ?? null
	};
}
