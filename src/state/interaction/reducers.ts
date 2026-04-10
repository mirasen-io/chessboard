import { cloneDeep } from 'es-toolkit/object';
import { setsEqual } from '../../helpers/util';
import { toValidSquare } from '../board/coords';
import type { Square, SquareInput } from '../board/types';
import { selectedEqual } from './helpers';
import { movabilitiesEqual } from './movability';
import type {
	DragSessionSnapshot,
	InteractionStateInternal,
	InteractionStateSelected,
	MovabilitySnapshot
} from './types';

export function interactionSetSelected(
	state: InteractionStateInternal,
	selected: InteractionStateSelected | null
): boolean {
	const notChanged = selectedEqual(state.selected, selected);
	if (notChanged) return false;
	state.selected = selected ? { ...selected } : null;
	return true;
}

export function interactionSetMovability(
	state: InteractionStateInternal,
	m: MovabilitySnapshot
): boolean {
	if (movabilitiesEqual(state.movability, m)) return false; // no-op
	state.movability = cloneDeep(m);
	return true;
}

export function interactionSetActiveDestinations(
	state: InteractionStateInternal,
	dests: ReadonlySet<Square>
): boolean {
	if (setsEqual(state.activeDestinations, dests)) return false;
	state.activeDestinations = new Set(dests);
	return true;
}

export function interactionSetDragSession(
	state: InteractionStateInternal,
	session: DragSessionSnapshot | null
): boolean {
	if (!state.dragSession && !session) return false;
	if (state.dragSession?.fromSquare === session?.fromSquare) return false;
	state.dragSession = session ? cloneDeep(session) : null;
	return true;
}

export function interactionSetCurrentTarget(
	state: InteractionStateInternal,
	sq: SquareInput | null
): boolean {
	const newTarget: Square | null = sq === null ? null : toValidSquare(sq);
	if (state.currentTarget === newTarget) return false;
	state.currentTarget = newTarget;
	return true;
}

export function interactionSetReleaseTargetingActive(
	state: InteractionStateInternal,
	active: boolean
): boolean {
	if (state.releaseTargetingActive === active) return false;
	state.releaseTargetingActive = active;
	return true;
}

export function interactionClear(state: InteractionStateInternal): boolean {
	const anySet =
		state.selected !== null ||
		state.activeDestinations.size > 0 ||
		state.dragSession !== null ||
		state.currentTarget !== null ||
		state.releaseTargetingActive !== false;

	if (!anySet) return false;

	state.selected = null;
	state.activeDestinations = new Set();
	state.dragSession = null;
	state.currentTarget = null;
	state.releaseTargetingActive = false;
	return true;
}

export function interactionClearActive(state: InteractionStateInternal): boolean {
	const anyActive = [
		state.dragSession !== null,
		state.releaseTargetingActive,
		state.currentTarget !== null
	].some((active) => active);

	if (!anyActive) return false;

	state.dragSession = null;
	state.releaseTargetingActive = false;
	state.currentTarget = null;
	return true;
}
