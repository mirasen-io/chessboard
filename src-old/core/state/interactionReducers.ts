import type { Square, SquareInput } from './boardTypes';
import { toValidSquare } from './coords';
import type { DragSession, InteractionStateInternal } from './interactionTypes';

/**
 * Set or clear the selected square.
 * Accepts numeric or algebraic square input, or null to clear.
 * Returns true if the value changed, false if no-op.
 * Does not take an InvalidationWriter — no direct invalidation side-effects.
 */
export function setSelectedSquare(
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
 * Null means no active destinations.
 * Returns true if the value changed, false if no-op (reference equality check).
 * Does not take an InvalidationWriter — no direct invalidation side-effects.
 */
export function setDestinations(
	state: InteractionStateInternal,
	dests: readonly Square[] | null
): boolean {
	if (state.destinations === dests) return false;
	state.destinations = dests;
	return true;
}

/**
 * Set or clear the active drag session.
 * Null means no drag in progress.
 * Returns true if the value changed, false if no-op (reference equality check).
 * Does not take an InvalidationWriter — no direct invalidation side-effects.
 */
export function setDragSession(
	state: InteractionStateInternal,
	session: DragSession | null
): boolean {
	if (state.dragSession === session) return false;
	state.dragSession = session;
	return true;
}

/**
 * Set or clear the current target square.
 * Accepts numeric or algebraic square input, or null to clear.
 * Returns true if the value changed, false if no-op.
 * Does not take an InvalidationWriter — no direct invalidation side-effects.
 */
export function setCurrentTarget(state: InteractionStateInternal, sq: SquareInput | null): boolean {
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
export function setReleaseTargetingActive(
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
export function clearInteraction(state: InteractionStateInternal): boolean {
	const anySet =
		state.selectedSquare !== null ||
		state.destinations !== null ||
		state.dragSession !== null ||
		state.currentTarget !== null ||
		state.releaseTargetingActive !== false;

	if (!anySet) return false;

	state.selectedSquare = null;
	state.destinations = null;
	state.dragSession = null;
	state.currentTarget = null;
	state.releaseTargetingActive = false;
	return true;
}

export function clearActiveInteraction(state: InteractionStateInternal): boolean {
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

export type InteractionMutationCause =
	| 'interaction.reducer.setSelectedSquare'
	| 'interaction.reducer.setDestinations'
	| 'interaction.reducer.setDragSession'
	| 'interaction.reducer.setCurrentTarget'
	| 'interaction.reducer.setReleaseTargetingActive'
	| 'interaction.reducer.clearInteraction'
	| 'interaction.reducer.clearActiveInteraction';
