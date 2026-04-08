import {
	ExtensionAnimationControllerInternalSurface,
	ExtensionAnimationSessionInternalSurface,
	ExtensionAnimationSessionSubmitOptions,
	ExtensionAnimationStatus
} from '../types';
import { ExtensionAnimationControllerInternal, ExtensionAnimationSessionInternal } from './types';

function createExtensionAnimationSessionInternal(
	id: string,
	options: ExtensionAnimationSessionSubmitOptions<unknown>
): ExtensionAnimationSessionInternal {
	return {
		id,
		startTime: performance.now(),
		duration: options.duration,
		data: options.data,
		status: 'submitted' as ExtensionAnimationStatus
	};
}

export function createExtensionAnimationSession(
	id: string,
	options: ExtensionAnimationSessionSubmitOptions<unknown>
): ExtensionAnimationSessionInternalSurface {
	const internalState = createExtensionAnimationSessionInternal(id, options);

	return {
		id: internalState.id,
		startTime: internalState.startTime,
		duration: internalState.duration,
		get status() {
			return internalState.status;
		},
		setData<TData>(data: TData) {
			internalState.data = data;
		},
		getData<TData>() {
			return internalState.data as TData;
		},
		setStatus(newStatus: ExtensionAnimationStatus) {
			internalState.status = newStatus;
		}
	};
}

function createExtensionAnimationControllerInternal(): ExtensionAnimationControllerInternal {
	return {
		sessions: new Map()
	};
}

export function createExtensionAnimationController(): ExtensionAnimationControllerInternalSurface {
	const internalState = createExtensionAnimationControllerInternal();
	const allStati = new Set<ExtensionAnimationStatus>(['submitted', 'active', 'ended', 'cancelled']);
	return {
		submit(options) {
			let sessionId: string = performance.now().toString(); // Simple unique ID generation based on timestamp
			while (internalState.sessions.has(sessionId)) {
				sessionId = (performance.now() + Math.random()).toString(); // Ensure uniqueness
			}
			const session = createExtensionAnimationSession(sessionId, options);
			internalState.sessions.set(sessionId, session);
			// Logic to start the animation can be added here
			return session;
		},
		cancel(sessionId) {
			const session = internalState.sessions.get(sessionId);
			if (session) {
				session.setStatus('cancelled');
			}
		},
		getAll(status) {
			const stati: Set<ExtensionAnimationStatus> = status
				? // If iterable
					Symbol.iterator in Object(status)
					? (new Set([...status]) as Set<ExtensionAnimationStatus>)
					: (new Set([status]) as Set<ExtensionAnimationStatus>)
				: allStati;
			return Array.from(internalState.sessions.values()).filter((session) =>
				stati.has(session.status)
			);
		},
		remove(sessionId) {
			if (typeof sessionId === 'string') {
				internalState.sessions.delete(sessionId);
			} else {
				for (const id of sessionId) {
					internalState.sessions.delete(id);
				}
			}
		},
		clear() {
			internalState.sessions.clear();
		}
	};
}
