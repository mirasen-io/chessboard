import { getActiveDestinations } from './movability';
import { InteractionStateMutationSession } from './mutation';
import { interactionSetActiveDestinations } from './reducers';
import { InteractionStateInternal, InteractionStateSelected } from './types/main';

export function selectedEqual(
	a: InteractionStateSelected | null,
	b: InteractionStateSelected | null
): boolean {
	if (a === b) return true;
	if (a === null || b === null) return false;
	return a.square === b.square && a.pieceCode === b.pieceCode;
}

export function updateActiveDestinations(
	state: InteractionStateInternal,
	mutationSession: InteractionStateMutationSession
): boolean {
	if (!state.selected) {
		return mutationSession.addMutation(
			'state.interaction.updateActiveDestinations',
			interactionSetActiveDestinations(state, new Map())
		);
	}
	const activeDests = getActiveDestinations(state, state.selected.square);
	return mutationSession.addMutation(
		'state.interaction.updateActiveDestinations',
		interactionSetActiveDestinations(state, activeDests)
	);
}
