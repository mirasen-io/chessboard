import { cloneDeep } from 'es-toolkit';
import {
	interactionClear,
	interactionClearActive,
	interactionSetCurrentTarget,
	interactionSetDestinations,
	interactionSetDragSession,
	interactionSetReleaseTargetingActive,
	interactionSetSelectedSquare
} from './reducers';
import type { InteractionState, InteractionStateInternal } from './types';

/**
 * Create a fresh interaction state with all fields set to null or false.
 */
function createInteractionStateInternal(): InteractionStateInternal {
	return {
		selectedSquare: null,
		destinations: [],
		dragSession: null,
		currentTarget: null,
		releaseTargetingActive: false
	};
}

export function createInteractionState(): InteractionState {
	const internalState = createInteractionStateInternal();
	return {
		getSelectedSquare() {
			return internalState.selectedSquare;
		},
		setSelectedSquare(sq, mutationSession) {
			return mutationSession.addMutation(
				'state.interaction.setSelectedSquare',
				interactionSetSelectedSquare(internalState, sq)
			);
		},
		getDestinations() {
			return [...(internalState.destinations ?? [])];
		},
		setDestinations(dests, mutationSession) {
			return mutationSession.addMutation(
				'state.interaction.setDestinations',
				interactionSetDestinations(internalState, dests)
			);
		},
		getDragSession() {
			return internalState.dragSession ? { ...internalState.dragSession } : null;
		},
		setDragSession(session, mutationSession) {
			return mutationSession.addMutation(
				'state.interaction.setDragSession',
				interactionSetDragSession(internalState, session)
			);
		},

		getCurrentTarget() {
			return internalState.currentTarget;
		},
		setCurrentTarget(sq, mutationSession) {
			return mutationSession.addMutation(
				'state.interaction.setCurrentTarget',
				interactionSetCurrentTarget(internalState, sq)
			);
		},
		getReleaseTargetingActive() {
			return internalState.releaseTargetingActive;
		},
		setReleaseTargetingActive(active, mutationSession) {
			return mutationSession.addMutation(
				'state.interaction.setReleaseTargetingActive',
				interactionSetReleaseTargetingActive(internalState, active)
			);
		},
		clear(mutationSession) {
			return mutationSession.addMutation(
				'state.interaction.clear',
				interactionClear(internalState)
			);
		},
		clearActive(mutationSession) {
			return mutationSession.addMutation(
				'state.interaction.clearActive',
				interactionClearActive(internalState)
			);
		},
		getSnapshot() {
			return cloneDeep(internalState);
		}
	};
}
