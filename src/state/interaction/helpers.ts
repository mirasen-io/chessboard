import { getActiveDestinations } from './movability.js';
import { InteractionStateMutationSession } from './mutation.js';
import { interactionSetActiveDestinations } from './reducers.js';
import { DragSessionSnapshot } from './types/internal.js';
import { InteractionStateInternal, InteractionStateSelected } from './types/main.js';

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

export function isDragSessionCoreOwned<T extends DragSessionSnapshot>(
	session: T
): session is Extract<T, { owner: 'core' }> {
	return session.owner === 'core';
}

export function isDragSessionExtensionOwned<T extends DragSessionSnapshot>(
	session: T
): session is Exclude<T, { owner: 'core' }> {
	return session.owner !== 'core';
}

export function isDragSessionReleaseTargeting<T extends DragSessionSnapshot>(
	session: T
): session is Extract<T, { type: 'release-targeting' }> {
	return session.type === 'release-targeting';
}

export function isDragSessionLiftedPiece<T extends DragSessionSnapshot>(
	session: T
): session is Extract<T, { type: 'lifted-piece-drag' }> {
	return session.type === 'lifted-piece-drag';
}

export function isDragSessionPendingLiftedPiece<T extends DragSessionSnapshot>(
	session: T
): session is Extract<T, { type: 'lifted-piece-drag'; phase: 'pending' }> {
	return isDragSessionLiftedPiece(session) && session.phase === 'pending';
}

export function isDragSessionActiveLiftedPiece<T extends DragSessionSnapshot>(
	session: T
): session is Extract<T, { type: 'lifted-piece-drag'; phase: 'active' }> {
	return isDragSessionLiftedPiece(session) && session.phase === 'active';
}
