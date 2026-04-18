import type { InteractionStateInternal, InteractionStateSnapshot } from './interactionTypes';

/**
 * Create a fresh interaction state with all fields set to null or false.
 */
export function createInteractionState(): InteractionStateInternal {
	return {
		selectedSquare: null,
		destinations: null,
		dragSession: null,
		currentTarget: null,
		releaseTargetingActive: false
	};
}

/**
 * Build a read-only snapshot of the current interaction state.
 */
export function getInteractionStateSnapshot(
	state: InteractionStateInternal
): InteractionStateSnapshot {
	return {
		selectedSquare: state.selectedSquare,
		destinations: state.destinations,
		dragSession: state.dragSession,
		currentTarget: state.currentTarget,
		releaseTargetingActive: state.releaseTargetingActive
	};
}
