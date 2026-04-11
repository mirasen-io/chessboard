import {
	ExtensionActiveAnimationSession,
	ExtensionCleanAnimationContext,
	ExtensionFinishedAnimationSession,
	ExtensionPrepareAnimationContext,
	ExtensionRenderAnimationContext,
	ExtensionSubmittedAnimationSession
} from '../../extensions/types/context/animation';
import { RenderSystemInternal } from '../types';
import { validateIsMounted } from './helpers';

export interface RenderAnimationResult {
	requestRenderAnimation: boolean;
	requestRender: boolean;
}

export function performAnimationPass(state: RenderSystemInternal): RenderAnimationResult {
	validateIsMounted(state);
	let requestRenderAnimation = false;
	let requestRender = false;
	const currentFrame = state.currentFrame;
	if (!currentFrame) {
		throw new Error(
			'renderAnimation() called but no previous render state found. render() must be called before renderAnimation().'
		);
	}
	for (const extensionRec of state.extensions.values()) {
		// Prepare the animation context
		const submittedSessions = extensionRec.extension.animation.getAll('submitted');
		// process submitted animations
		if (submittedSessions.length > 0) {
			const context: ExtensionPrepareAnimationContext = {
				currentFrame: currentFrame,
				invalidation: extensionRec.extension.invalidation,
				submittedSessions: submittedSessions as unknown as ExtensionSubmittedAnimationSession[]
			};
			extensionRec.extension.instance.prepareAnimation?.(context);
			submittedSessions.forEach((session) => {
				session.setStatus('active');
			});
		}
		// Now call the renderAnimation for active sessions
		const activeSessions = extensionRec.extension.animation.getAll('active');
		if (activeSessions.length > 0) {
			const context: ExtensionRenderAnimationContext = {
				currentFrame: currentFrame,
				invalidation: extensionRec.extension.invalidation,
				activeSessions: activeSessions as unknown as ExtensionActiveAnimationSession[]
			};
			extensionRec.extension.instance.renderAnimation?.(context);
		}
		// Now update the sessions that have completed
		const currentTime = performance.now();
		const finishedSessions = activeSessions.filter(
			(session) => session.startTime + session.duration <= currentTime
		);
		finishedSessions.forEach((session) => {
			session.setStatus('ended');
		});
		// Also get cancelled sessions that need to be cleaned up
		const cancelledSessions = extensionRec.extension.animation.getAll('cancelled');
		finishedSessions.push(...cancelledSessions);
		if (finishedSessions.length > 0) {
			const context: ExtensionCleanAnimationContext = {
				currentFrame: currentFrame,
				invalidation: extensionRec.extension.invalidation,
				finishedSessions: finishedSessions as unknown as ExtensionFinishedAnimationSession[]
			};
			extensionRec.extension.instance.cleanAnimation?.(context);
		}

		// Now get all ended and cancelled sessions, call cleanAnimation and remove them from the controller
		const removeSessions = extensionRec.extension.animation.getAll(['ended', 'cancelled']);
		if (removeSessions.length > 0) {
			extensionRec.extension.animation.remove(removeSessions.map((s) => s.id));
		}

		requestRenderAnimation =
			requestRenderAnimation || extensionRec.extension.animation.getAll('active').length > 0;
		requestRender = requestRender || extensionRec.extension.invalidation.dirtyLayers !== 0;
	}

	return {
		requestRenderAnimation,
		requestRender
	};
}
