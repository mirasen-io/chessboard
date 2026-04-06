import {
	ExtensionAnimationController,
	ExtensionAnimationSession,
	ExtensionAnimationSessionSubmitOptions,
	ExtensionAnimationStatus
} from '../../extensions/types';
import {
	ExtensionAnimationControllerInternal,
	ExtensionAnimationSessionInternal,
	ExtensionAnimationSessionRenderInternal
} from '../types';

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

function createExtensionAnimationSession(
	state: ExtensionAnimationSessionInternal
): ExtensionAnimationSession {
	return {
		id: state.id,
		startTime: state.startTime,
		duration: state.duration,
		get status() {
			return state.status;
		},
		setData<TData>(data: TData) {
			state.data = data;
		},
		getData<TData>() {
			return state.data as TData;
		}
	};
}

export function createExtensionAnimationSessionRenderInternal(
	id: string,
	options: ExtensionAnimationSessionSubmitOptions<unknown>
): ExtensionAnimationSessionRenderInternal {
	const internalState = createExtensionAnimationSessionInternal(id, options);
	const readonlySession = createExtensionAnimationSession(internalState);

	return {
		...readonlySession,
		get status() {
			return internalState.status;
		},
		setStatus(newStatus: ExtensionAnimationStatus) {
			internalState.status = newStatus;
		},
		readonlySession
	};
}

function createExtensionAnimationControllerInternal(): ExtensionAnimationControllerInternal {
	return {
		sessions: new Map()
	};
}

export function createExtensionAnimationController(): ExtensionAnimationController {
	const internalState = createExtensionAnimationControllerInternal();
	const allStati = new Set<ExtensionAnimationStatus>(['submitted', 'active', 'ended', 'cancelled']);
	return {
		submit(options) {
			let sessionId: string = performance.now().toString(); // Simple unique ID generation based on timestamp
			while (internalState.sessions.has(sessionId)) {
				sessionId = (performance.now() + Math.random()).toString(); // Ensure uniqueness
			}
			const session = createExtensionAnimationSessionRenderInternal(sessionId, options);
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
				? Array.isArray(status)
					? new Set(status)
					: new Set([status])
				: allStati;
			return Array.from(internalState.sessions.values()).filter((session) =>
				stati.has(session.status)
			);
		}
	};
}
