import { cloneDeep } from 'es-toolkit';
import { updateActiveDestinations } from './helpers';
import {
	interactionClear,
	interactionClearActive,
	interactionSetCurrentTarget,
	interactionSetDragSession,
	interactionSetMovability,
	interactionSetReleaseTargetingActive,
	interactionSetSelected
} from './reducers';
import type {
	InteractionState,
	InteractionStateInitOptions,
	InteractionStateInternal
} from './types';

/**
 * Create a fresh interaction state with all fields set to null or false.
 */
function createInteractionStateInternal(
	options: InteractionStateInitOptions
): InteractionStateInternal {
	const movability = options.movability ?? { mode: 'disabled' };

	return {
		movability: cloneDeep(movability),
		selected: null,
		activeDestinations: new Set(),
		dragSession: null,
		currentTarget: null,
		releaseTargetingActive: false
	};
}

export function createInteractionState(options: InteractionStateInitOptions): InteractionState {
	const internalState = createInteractionStateInternal(options);
	return {
		get selected() {
			return cloneDeep(internalState.selected);
		},
		setSelected(selected, mutationSession) {
			const changed = mutationSession.addMutation(
				'state.interaction.setSelectedSquare',
				interactionSetSelected(internalState, selected)
			);

			if (!changed) return false; // no-op

			updateActiveDestinations(internalState, mutationSession);

			return changed;
		},
		get movability() {
			return cloneDeep(internalState.movability);
		},
		setMovability(movability, mutationSession) {
			const changed = mutationSession.addMutation(
				'state.interaction.setMovability',
				interactionSetMovability(internalState, movability)
			);

			if (!changed) return false; // no-op

			updateActiveDestinations(internalState, mutationSession);

			return changed;
		},
		get activeDestinations() {
			return new Set(internalState.activeDestinations);
		},
		updateActiveDestinations(mutationSession) {
			return updateActiveDestinations(internalState, mutationSession);
		},
		get dragSession() {
			return internalState.dragSession ? { ...internalState.dragSession } : null;
		},
		setDragSession(session, mutationSession) {
			return mutationSession.addMutation(
				'state.interaction.setDragSession',
				interactionSetDragSession(internalState, session)
			);
		},

		get currentTarget() {
			return internalState.currentTarget;
		},
		setCurrentTarget(sq, mutationSession) {
			return mutationSession.addMutation(
				'state.interaction.setCurrentTarget',
				interactionSetCurrentTarget(internalState, sq)
			);
		},
		get releaseTargetingActive() {
			return internalState.releaseTargetingActive;
		},
		setReleaseTargetingActive(active, mutationSession) {
			return mutationSession.addMutation(
				'state.interaction.setReleaseTargetingActive',
				interactionSetReleaseTargetingActive(internalState, active)
			);
		},
		clear(mutationSession) {
			const changed = mutationSession.addMutation(
				'state.interaction.clear',
				interactionClear(internalState)
			);
			if (!changed) return false; // no-op
			updateActiveDestinations(internalState, mutationSession);
			return true;
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
