import assert from '@ktarmyshov/assert';
import { cloneDeep } from 'es-toolkit/object';
import { setsEqual } from '../../helpers/util';
import type { Square } from '../board/types';
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
	const changed =
		state.dragSession?.type !== session?.type ||
		state.dragSession?.sourceSquare !== session?.sourceSquare ||
		state.dragSession?.sourcePieceCode !== session?.sourcePieceCode ||
		state.dragSession?.targetSquare !== session?.targetSquare;
	if (!changed) return false; // no-op
	state.dragSession = session ? cloneDeep(session) : null;
	return true;
}

export function interactionUpdateDragSessionCurrentTarget(
	state: InteractionStateInternal,
	sq: Square | null
): boolean {
	const changed = state.dragSession?.targetSquare !== sq;
	if (!changed) return false;
	assert(state.dragSession !== null, 'No active drag session to update target of');
	state.dragSession.targetSquare = sq;
	return true;
}

export function interactionClear(state: InteractionStateInternal): boolean {
	const anySet =
		state.selected !== null || state.activeDestinations.size > 0 || state.dragSession !== null;

	if (!anySet) return false;

	state.selected = null;
	state.activeDestinations = new Set();
	state.dragSession = null;
	return true;
}

export function interactionClearActive(state: InteractionStateInternal): boolean {
	const anyActive = state.dragSession !== null;

	if (!anyActive) return false;

	state.dragSession = null;
	return true;
}
