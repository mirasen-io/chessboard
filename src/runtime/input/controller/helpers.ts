import type { ScenePoint } from '../../../extensions/types/basic/transient-visuals.js';
import type { Square } from '../../../state/board/types/internal.js';
import { MovabilityModeCode } from '../../../state/interaction/types/internal.js';
import type { InteractionStateSnapshot } from '../../../state/interaction/types/main.js';
import type {
	StartActiveLiftedDragSessionInput,
	StartLiftedDragSessionInput,
	StartPendingLiftedDragSessionInput
} from './types.js';

export function buttonToButtonsMask(button: number): number | null {
	switch (button) {
		case 0:
			return 1;
		case 1:
			return 4;
		case 2:
			return 2;
		case 3:
			return 8;
		case 4:
			return 16;
		default:
			return null;
	}
}

export function canMoveTo(snapshot: InteractionStateSnapshot, target: Square): boolean {
	const { movability } = snapshot;

	if (movability.mode === MovabilityModeCode.Disabled) {
		return false;
	}

	if (movability.mode === MovabilityModeCode.Free) {
		// Any square except the currently selected/source square is a valid drop target
		return target !== snapshot.selected?.square;
	}

	// strict: target must be in the computed active destinations
	return snapshot.activeDestinations.has(target);
}

export function isStartPendingLiftedDragSessionInput(
	input: StartLiftedDragSessionInput
): input is StartPendingLiftedDragSessionInput {
	return input.phase === 'pending';
}

export function isStartActiveLiftedDragSessionInput(
	input: StartLiftedDragSessionInput
): input is StartActiveLiftedDragSessionInput {
	return input.phase === 'active';
}

export function isMovementBeyondThreshold(
	start: ScenePoint,
	current: ScenePoint,
	thresholdPx: number
): boolean {
	const dx = current.x - start.x;
	const dy = current.y - start.y;
	return dx * dx + dy * dy >= thresholdPx * thresholdPx;
}
