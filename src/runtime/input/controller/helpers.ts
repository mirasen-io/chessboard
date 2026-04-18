import type { Square } from '../../../state/board/types/internal';
import { MovabilityModeCode } from '../../../state/interaction/types/internal';
import { InteractionStateSnapshot } from '../../../state/interaction/types/main';

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
