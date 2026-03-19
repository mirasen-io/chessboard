import { InteractionStateSnapshot } from '../state/interactionTypes';

export function isInteractionTargetingActive(
	snapshot: Pick<InteractionStateSnapshot, 'dragSession' | 'releaseTargetingActive'>
): boolean {
	return snapshot.dragSession !== null || snapshot.releaseTargetingActive;
}
