import assert from '@ktarmyshov/assert';
import { cloneDeep } from 'es-toolkit';
import { updateActiveDestinations } from './helpers.js';
import { normalizeMovability } from './normalize.js';
import {
	interactionClear,
	interactionClearActive,
	interactionSetDragSession,
	interactionSetMovability,
	interactionSetSelected,
	interactionUpdateDragSessionCurrentTarget
} from './reducers.js';
import { MovabilityDisabled, MovabilityModeCode } from './types/internal.js';
import {
	InteractionState,
	InteractionStateInitOptions,
	InteractionStateInternal
} from './types/main.js';

const DefaultMovabilityDisabled: MovabilityDisabled = { mode: MovabilityModeCode.Disabled };

/**
 * Create a fresh interaction state with all fields set to null or false.
 */
function createInteractionStateInternal(
	options: InteractionStateInitOptions
): InteractionStateInternal {
	const movability = options.movability
		? normalizeMovability(options.movability)
		: DefaultMovabilityDisabled;

	return {
		movability,
		selected: null,
		activeDestinations: new Map(),
		dragSession: null
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
				interactionSetMovability(internalState, normalizeMovability(movability))
			);

			if (!changed) return false; // no-op

			updateActiveDestinations(internalState, mutationSession);

			return changed;
		},
		get activeDestinations() {
			return cloneDeep(internalState.activeDestinations);
		},
		updateActiveDestinations(mutationSession) {
			return updateActiveDestinations(internalState, mutationSession);
		},
		get dragSession() {
			return internalState.dragSession ? { ...internalState.dragSession } : null;
		},

		setDragSession(session, mutationSession) {
			// assert that there is no active session when setting a new session.
			assert(
				session === null || internalState.dragSession === null,
				'Cannot set a new drag session while another session is active'
			);
			if (session && session.owner === 'core') {
				// Assert that the selected is the same as the source of the drag session when setting a lifted-piece-drag session
				assert(internalState.selected, 'There must be a selected piece to start a drag session');
				if (session.type === 'lifted-piece-drag') {
					assert(
						internalState.selected,
						'There must be a selected piece to start a lifted-piece-drag session'
					);
					assert(
						session.sourceSquare === internalState.selected.square,
						'The source square of the lifted-piece-drag session must match the selected square'
					);
					assert(
						session.sourcePieceCode === internalState.selected.pieceCode,
						'The source piece code of the lifted-piece-drag session must match the selected piece code'
					);
				}
			}
			return mutationSession.addMutation(
				'state.interaction.setDragSession',
				interactionSetDragSession(internalState, session)
			);
		},

		updateDragSessionCurrentTarget(sq, mutationSession) {
			assert(
				internalState.dragSession,
				'There must be an active drag session to update its current target'
			);
			return mutationSession.addMutation(
				'state.interaction.updateDragSessionCurrentTarget',
				interactionUpdateDragSessionCurrentTarget(internalState, sq)
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
