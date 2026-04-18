import {
	ExtensionActiveAnimationSession,
	ExtensionAnimationFinishedContext,
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

/**
 * Runs deferred physical cleanup for all sessions that were marked pendingCleanup
 * in a previous animation pass. Called at the end of performRenderPass (after stable
 * base ownership has been rendered) so that animation SVG is never removed before
 * the unsuppressed base piece layer is rendered.
 */
export function performAnimationCleanup(state: RenderSystemInternal): void {
	const currentFrame = state.currentFrame;
	if (!currentFrame) {
		throw new Error(
			'performAnimationCleanup() called but no current render frame found. render() must be called before performAnimationCleanup().'
		);
	}
	for (const extensionRec of state.extensions.values()) {
		const pendingSessions = extensionRec.extension.animation
			.getAll(['ended', 'cancelled'])
			.filter((s) => s.pendingCleanup);
		if (pendingSessions.length === 0) continue;
		const context: ExtensionCleanAnimationContext = {
			currentFrame,
			invalidation: extensionRec.extension.invalidation,
			finishedSessions: pendingSessions as readonly ExtensionFinishedAnimationSession[]
		};
		extensionRec.extension.instance.cleanAnimation?.(context);
		extensionRec.extension.animation.remove(pendingSessions.map((s) => s.id));
	}
}

export function performAnimationPass(state: RenderSystemInternal): RenderAnimationResult {
	validateIsMounted(state);
	let requestRenderAnimation = false;
	let requestRender = false;
	const currentFrame = state.currentFrame;
	if (!currentFrame) {
		throw new Error(
			'renderAnimation() called but no current render frame found. render() must be called before renderAnimation().'
		);
	}
	for (const extensionRec of state.extensions.values()) {
		// Prepare submitted sessions
		const submittedSessions = extensionRec.extension.animation.getAll('submitted');
		if (submittedSessions.length > 0) {
			const context: ExtensionPrepareAnimationContext = {
				currentFrame: currentFrame,
				invalidation: extensionRec.extension.invalidation,
				submittedSessions: submittedSessions as readonly ExtensionSubmittedAnimationSession[]
			};
			extensionRec.extension.instance.prepareAnimation?.(context);
			submittedSessions.forEach((session) => {
				session.setStatus('active');
			});
		}
		// Render active sessions
		const activeSessions = extensionRec.extension.animation.getAll('active');
		if (activeSessions.length > 0) {
			const context: ExtensionRenderAnimationContext = {
				currentFrame: currentFrame,
				invalidation: extensionRec.extension.invalidation,
				activeSessions: activeSessions as readonly ExtensionActiveAnimationSession[]
			};
			extensionRec.extension.instance.renderAnimation?.(context);
		}
		// Detect newly terminal sessions: active sessions that have elapsed their duration
		const currentTime = performance.now();
		const newlyEndedSessions = activeSessions.filter(
			(session) => session.startTime + session.duration <= currentTime
		);
		newlyEndedSessions.forEach((session) => {
			session.setStatus('ended');
		});
		// Also collect cancelled sessions not yet marked pendingCleanup
		const cancelledSessions = extensionRec.extension.animation
			.getAll('cancelled')
			.filter((s) => !s.pendingCleanup);
		const terminalSessions = [...newlyEndedSessions, ...cancelledSessions];
		if (terminalSessions.length > 0) {
			// Mark for deferred physical cleanup — actual removal happens in performAnimationCleanup,
			// which runs after performRenderPass so stable base ownership is rendered first.
			terminalSessions.forEach((session) => session.markPendingCleanup());
			const context: ExtensionAnimationFinishedContext = {
				currentFrame,
				invalidation: extensionRec.extension.invalidation,
				finishedSessions: terminalSessions as readonly ExtensionFinishedAnimationSession[]
			};
			extensionRec.extension.instance.onAnimationFinished?.(context);
			// Invariant B: guarantee a state render is requested so performAnimationCleanup will run.
			requestRender = true;
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
