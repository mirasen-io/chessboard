import { ExtensionRenderAnimationContext } from '../../extensions/types';
import { RenderInternal } from '../types';
import { validateIsMounted } from './helpers';

export function performAnimationPass(state: RenderInternal): boolean {
	validateIsMounted(state);
	let requestNextRenderAnimation = false;
	const lastRendered = state.lastRendered;
	if (!lastRendered) {
		throw new Error(
			'RenderAnimation called but no previous render state found. RenderState must be called before RenderAnimation.'
		);
	}
	for (const extensionRec of state.extensions.values()) {
		// Prepare the animation context
		const context: ExtensionRenderAnimationContext = {
			current: lastRendered,
			invalidation: extensionRec.extension.invalidation,
			animation: extensionRec.extension.animation
		};
		// process submitted anymations
		const submittedSessions = extensionRec.extension.animation.getAll('submitted');
		if (submittedSessions.length > 0) {
			extensionRec.extension.instance.prepareAnimation?.(context, submittedSessions);
			submittedSessions.forEach((session) => {
				session.setStatus('active');
			});
		}
		// Now call the renderAnimation for active sessions
		const activeSessions = extensionRec.extension.animation.getAll('active');
		if (activeSessions.length > 0) {
			extensionRec.extension.instance.renderAnimation?.(context, activeSessions);
		}
		// Now update the sessions that have completed
		const currentTime = performance.now();
		const finishedSessions = activeSessions.filter(
			(session) => session.startTime + session.duration <= currentTime
		);
		// Also get cancelled sessions that need to be cleaned up
		const cancelledSessions = extensionRec.extension.animation.getAll('cancelled');
		finishedSessions.push(...cancelledSessions);
		if (finishedSessions.length > 0) {
			extensionRec.extension.instance.cleanAnimation?.(context, finishedSessions);
			finishedSessions.forEach((session) => {
				if (session.status !== 'cancelled') {
					session.setStatus('ended');
				}
			});
		}
		// Now get all ended and cancelled sessions, call cleanAnimation and remove them from the controller
		const removeSessions = extensionRec.extension.animation.getAll(['ended', 'cancelled']);
		if (removeSessions.length > 0) {
			extensionRec.extension.animation.remove(removeSessions.map((s) => s.id));
		}

		requestNextRenderAnimation =
			requestNextRenderAnimation || extensionRec.extension.animation.getAll('active').length > 0;
	}

	return requestNextRenderAnimation;
}
