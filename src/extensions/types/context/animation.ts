import { ExtensionInvalidationState } from '../../invalidation/types';
import { ExtensionAnimationSession } from '../basic/animation';
import { ExtensionRenderContext } from './render';

export interface ExtensionSubmittedAnimationSession extends ExtensionAnimationSession {
	readonly status: 'submitted';
}

export interface ExtensionActiveAnimationSession extends ExtensionAnimationSession {
	readonly status: 'active';
	readonly elapsedTime: DOMHighResTimeStamp;
	readonly progress: number;
}

export interface ExtensionFinishedAnimationSession extends ExtensionAnimationSession {
	readonly status: 'ended' | 'cancelled';
}

export interface ExtensionPrepareAnimationContext extends ExtensionRenderContext {
	readonly submittedSessions: readonly ExtensionSubmittedAnimationSession[];
}

export interface ExtensionRenderAnimationContext extends ExtensionRenderContext {
	readonly activeSessions: readonly ExtensionActiveAnimationSession[];
}

export interface ExtensionAnimationFinishedContext extends ExtensionRenderContext {
	readonly invalidation: ExtensionInvalidationState;
	readonly finishedSessions: readonly ExtensionFinishedAnimationSession[];
}

export interface ExtensionCleanAnimationContext extends ExtensionRenderContext {
	readonly invalidation: ExtensionInvalidationState;
	readonly finishedSessions: readonly ExtensionFinishedAnimationSession[];
}

export function isExtensionSubmittedAnimationSession(
	session: ExtensionAnimationSession
): session is ExtensionSubmittedAnimationSession {
	return session.status === 'submitted';
}

export function isExtensionActiveAnimationSession(
	session: ExtensionAnimationSession
): session is ExtensionActiveAnimationSession {
	return session.status === 'active';
}

export function isExtensionFinishedAnimationSession(
	session: ExtensionAnimationSession
): session is ExtensionFinishedAnimationSession {
	return session.status === 'ended' || session.status === 'cancelled';
}
