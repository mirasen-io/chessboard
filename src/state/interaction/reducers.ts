import assert from '@ktarmyshov/assert';
import { cloneDeep } from 'es-toolkit/object';
import type { ReadonlyDeep } from 'type-fest';
import { setsEqual } from '../../helpers/util';
import type { RolePromotionCode, Square } from '../board/types/internal';
import { selectedEqual } from './helpers';
import { movabilitiesEqual } from './movability';
import { Movability, type DragSessionSnapshot, type MoveDestination } from './types/internal';
import { InteractionStateInternal, InteractionStateSelected } from './types/main';

export function interactionSetSelected(
	state: InteractionStateInternal,
	selected: InteractionStateSelected | null
): boolean {
	const notChanged = selectedEqual(state.selected, selected);
	if (notChanged) return false;
	state.selected = selected ? { ...selected } : null;
	return true;
}

export function interactionSetMovability(state: InteractionStateInternal, m: Movability): boolean {
	if (movabilitiesEqual(state.movability, m)) return false; // no-op
	state.movability = cloneDeep(m); // Defensive copy to prevent external mutations
	return true;
}

function promotedTosEqual(
	a: readonly RolePromotionCode[] | undefined,
	b: readonly RolePromotionCode[] | undefined
): boolean {
	if (a === b) return true;
	if (a == null || b == null) return false;
	return setsEqual(new Set(a), new Set(b));
}

function activeDestinationsEqual(
	a: ReadonlyMap<Square, ReadonlyDeep<MoveDestination>>,
	b: ReadonlyMap<Square, ReadonlyDeep<MoveDestination>>
): boolean {
	if (a.size !== b.size) return false;
	for (const [sq, aDest] of a) {
		const bDest = b.get(sq);
		if (!bDest) return false;
		if (
			aDest.to !== bDest.to ||
			aDest.capturedSquare !== bDest.capturedSquare ||
			aDest.secondary?.from !== bDest.secondary?.from ||
			aDest.secondary?.to !== bDest.secondary?.to ||
			!promotedTosEqual(aDest.promotedTo, bDest.promotedTo)
		)
			return false;
	}
	return true;
}

export function interactionSetActiveDestinations(
	state: InteractionStateInternal,
	dests: ReadonlyMap<Square, ReadonlyDeep<MoveDestination>>
): boolean {
	if (activeDestinationsEqual(state.activeDestinations, dests)) return false;
	state.activeDestinations = new Map(dests);
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
	state.activeDestinations = new Map();
	state.dragSession = null;
	return true;
}

export function interactionClearActive(state: InteractionStateInternal): boolean {
	const anyActive = state.dragSession !== null;

	if (!anyActive) return false;

	state.dragSession = null;
	return true;
}
