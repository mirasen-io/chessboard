import { cloneDeep } from 'lodash-es';
import { setsEqual } from '../../../helper/util';
import { toValidSquare } from '../board/coords';
import type { Square, SquareInput } from '../board/types';
import type { DragSessionSnapshot, InteractionStateInternal } from './types';

/**
 * Set or clear the selected square.
 * Accepts numeric or algebraic square input, or null to clear.
 * Returns true if the value changed, false if no-op.
 * Does not take an InvalidationWriter — no direct invalidation side-effects.
 */
export function interactionSetSelectedSquare(
	state: InteractionStateInternal,
	sq: SquareInput | null
): boolean {
	const newSel: Square | null = sq === null ? null : toValidSquare(sq);
	if (state.selectedSquare === newSel) return false;
	state.selectedSquare = newSel;
	return true;
}

/**
 * Set or clear the active destinations for the current selected/drag source square.
 * [] means no active destinations. Null is accepted and normalized to [].
 * Returns true if the value changed, false if no-op (reference equality check).
 * Does not take an InvalidationWriter — no direct invalidation side-effects.
 */
export function interactionSetDestinations(
	state: InteractionStateInternal,
	dests: readonly Square[] | null
): boolean {
	if (setsEqual(new Set(state.destinations), new Set(dests))) return false;
	state.destinations = dests ? [...dests] : [];
	return true;
}

/**
 * Set or clear the active drag session.
 * Null means no drag in progress.
 * Returns true if the value changed, false if no-op (reference equality check).
 * Does not take an InvalidationWriter — no direct invalidation side-effects.
 */
export function interactionSetDragSession(
	state: InteractionStateInternal,
	session: DragSessionSnapshot | null
): boolean {
	if (!state.dragSession && !session) return false;
	if (state.dragSession?.fromSquare === session?.fromSquare) return false;
	state.dragSession = session ? cloneDeep(session) : null;
	return true;
}

/**
 * Set or clear the current target square.
 * Accepts numeric or algebraic square input, or null to clear.
 * Returns true if the value changed, false if no-op.
 * Does not take an InvalidationWriter — no direct invalidation side-effects.
 */
export function interactionSetCurrentTarget(
	state: InteractionStateInternal,
	sq: SquareInput | null
): boolean {
	const newTarget: Square | null = sq === null ? null : toValidSquare(sq);
	if (state.currentTarget === newTarget) return false;
	state.currentTarget = newTarget;
	return true;
}

/**
 * Set or clear the release targeting active flag.
 * Returns true if the value changed, false if no-op.
 * Does not take an InvalidationWriter — no direct invalidation side-effects.
 */
export function interactionSetReleaseTargetingActive(
	state: InteractionStateInternal,
	active: boolean
): boolean {
	if (state.releaseTargetingActive === active) return false;
	state.releaseTargetingActive = active;
	return true;
}

/**
 * Clear all interaction state fields.
 * Returns true if any field changed, false if all were already null/false (no-op).
 * Use this when the board position changes or interaction is fully cancelled.
 */
export function interactionClear(state: InteractionStateInternal): boolean {
	const anySet =
		state.selectedSquare !== null ||
		state.destinations.length > 0 ||
		state.dragSession !== null ||
		state.currentTarget !== null ||
		state.releaseTargetingActive !== false;

	if (!anySet) return false;

	state.selectedSquare = null;
	state.destinations = [];
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
