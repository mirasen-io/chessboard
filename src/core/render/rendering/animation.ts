import { AnyExtensionRenderAnimationContext } from '../../extensions/types';
import { RenderAnimationRequest, RenderInternal } from '../types';

export function performAnimationPass(
	state: RenderInternal,
	request: RenderAnimationRequest | null
): RenderAnimationRequest | null {
	if (!request) {
		throw new Error('RenderAnimation called without a valid render request');
	}
	const contextCommonBase = state.lastRendered;
	let requestNextRenderAnimation = false;
	if (!contextCommonBase) {
		throw new Error(
			'RenderAnimation called but no previous render state found. RenderState must be called before RenderAnimation.'
		);
	}
	for (const extensionRec of state.extensions.values()) {
		// Prepare the animation context
		const context: AnyExtensionRenderAnimationContext = {
			...contextCommonBase,
			previousData: extensionRec.data.previous,
			currentData: extensionRec.data.current,
			invalidation: extensionRec.render.invalidation,
			animation: extensionRec.render.animation
		};
		// process submitted anymations
		const submittedSessions = extensionRec.render.animation.getAll('submitted');
		if (submittedSessions.length > 0) {
			extensionRec.instance.prepareAnimation?.(context, submittedSessions);
			submittedSessions.forEach((session) => {
				session.setStatus('active');
			});
		}
		// Now call the renderAnimation for active sessions
		const activeSessions = extensionRec.render.animation.getAll('active');
		if (activeSessions.length > 0) {
			extensionRec.instance.renderAnimation?.(context, activeSessions);
		}
		// Now update the sessions that have completed
		const currentTime = performance.now();
		const finishedSessions = activeSessions.filter(
			(session) => session.startTime + session.duration <= currentTime
		);
		// Also get cancelled sessions that need to be cleaned up
		const cancelledSessions = extensionRec.render.animation.getAll('cancelled');
		finishedSessions.push(...cancelledSessions);
		if (finishedSessions.length > 0) {
			extensionRec.instance.cleanAnimation?.(context, finishedSessions);
			finishedSessions.forEach((session) => {
				if (session.status !== 'cancelled') {
					session.setStatus('ended');
				}
			});
		}
		// Now get all ended and cancelled sessions, call cleanAnimation and remove them from the controller
		const removeSessions = extensionRec.render.animation.getAll(['ended', 'cancelled']);
		if (removeSessions.length > 0) {
			extensionRec.render.animation.remove(removeSessions.map((s) => s.id));
		}

		requestNextRenderAnimation =
			requestNextRenderAnimation || extensionRec.render.animation.getAll('active').length > 0;
	}

	return requestNextRenderAnimation ? request : null;
}
