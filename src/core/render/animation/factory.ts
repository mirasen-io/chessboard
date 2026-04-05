import {
	ExtensionAnimationController,
	ExtensionAnimationSessionSubmitOptions,
	ExtensionAnimationStatus
} from '../../extensions/types';
import { ExtensionAnimationControllerInternal, ExtensionAnimationSessionInternal } from '../types';

function createExtensionAnimationControllerInternal(): ExtensionAnimationControllerInternal {
	return {
		sessions: new Map()
	};
}

export function createExtensionAnimationSessionInternal(
	id: string,
	options: ExtensionAnimationSessionSubmitOptions<unknown>
): ExtensionAnimationSessionInternal {
	const state = {
		data: options.data,
		status: 'submitted' as ExtensionAnimationStatus
	};
	return {
		id,
		startTime: performance.now(),
		duration: options.duration,
		get status() {
			return state.status;
		},
		setStatus(newStatus: ExtensionAnimationStatus) {
			state.status = newStatus;
		},
		setData<TData>(data: TData) {
			state.data = data;
		},
		getData<TData>() {
			return state.data as TData;
		}
	};
}

export function createExtensionAnimationController(): ExtensionAnimationController {
	const internalState = createExtensionAnimationControllerInternal();
	const allStati = new Set<ExtensionAnimationStatus>(['submitted', 'active', 'ended', 'canceled']);
	return {
		submit(options) {
			let sessionId: string = performance.now().toString(); // Simple unique ID generation based on timestamp
			while (internalState.sessions.has(sessionId)) {
				sessionId = (performance.now() + Math.random()).toString(); // Ensure uniqueness
			}
			const session = createExtensionAnimationSessionInternal(sessionId, options);
			internalState.sessions.set(sessionId, session);
			// Logic to start the animation can be added here
			return session;
		},
		cancel(sessionId) {
			const session = internalState.sessions.get(sessionId);
			if (session) {
				session.setStatus('canceled');
			}
		},
		getAll(status) {
			const stati: Set<ExtensionAnimationStatus> = status
				? status instanceof Set
					? status
					: new Set([status])
				: allStati;
			return Array.from(internalState.sessions.values()).filter((session) =>
				stati.has(session.status)
			);
		}
	};
}
