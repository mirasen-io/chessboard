import assert from '@ktarmyshov/assert';
import { DragSessionExtensionOwned } from '../../state/interaction/types/internal.js';
import type { ExtensionAnimationController } from '../types/basic/animation.js';
import type { AnyExtensionDefinition } from '../types/extension.js';
import type { GetInternalState } from '../types/main.js';
import type {
	ExtensionRuntimeSurfaceCommands,
	ExtensionRuntimeSurfaceCommandsInternalSurface
} from '../types/surface/commands.js';
import { ExtensionRuntimeSurfaceEvents } from '../types/surface/events.js';
import type { ExtensionRuntimeSurface } from '../types/surface/main.js';
import type { ExtensionRuntimeSurfaceTransientVisuals } from '../types/surface/transient-visuals.js';

function createExtensionRuntimeSurfaceTransientVisuals(
	getInternalState: GetInternalState,
	extensionDef: AnyExtensionDefinition
): ExtensionRuntimeSurfaceTransientVisuals {
	return {
		subscribe() {
			const internalState = getInternalState();
			internalState.transientVisualsSubscribers.add(extensionDef.id);
		},
		unsubscribe() {
			const internalState = getInternalState();
			internalState.transientVisualsSubscribers.delete(extensionDef.id);
		}
	};
}

function createExtensionRuntimeSurfaceAnimation(
	getInternalState: GetInternalState,
	extensionDef: AnyExtensionDefinition
): ExtensionAnimationController {
	function getController(): ExtensionAnimationController {
		const internalState = getInternalState();
		const controller = internalState.extensions.get(extensionDef.id)?.animation;
		assert(controller, 'Extension animation controller not found');
		return controller;
	}

	return {
		submit(options) {
			const controller = getController();
			return controller.submit(options);
		},
		cancel(sessionId) {
			const controller = getController();
			controller.cancel(sessionId);
		},
		getAll(status) {
			const controller = getController();
			return controller.getAll(status);
		}
	};
}

function createExtensionRuntimeSurfaceEvents(
	getInternalState: GetInternalState,
	runtimeSurfaceEvents: ExtensionRuntimeSurfaceEvents,
	extensionDef: AnyExtensionDefinition
): ExtensionRuntimeSurfaceEvents {
	return {
		subscribeEvent(type) {
			const internalState = getInternalState();
			const extensionRec = internalState.extensions.get(extensionDef.id);
			assert(extensionRec, 'Extension record not found for subscribing to events');
			assert(
				extensionRec.instance.onEvent,
				'Extension instance does not have an onEvent handler for subscribing to events'
			);
			let subscribers = internalState.eventSubscribers.get(type);
			if (!subscribers) {
				subscribers = new Set<string>();
				internalState.eventSubscribers.set(type, subscribers);
			}
			subscribers.add(extensionDef.id);
			runtimeSurfaceEvents.subscribeEvent(type);
		},
		unsubscribeEvent(type) {
			const internalState = getInternalState();
			const subscribers = internalState.eventSubscribers.get(type);
			if (subscribers) {
				subscribers.delete(extensionDef.id);
				if (subscribers.size === 0) {
					internalState.eventSubscribers.delete(type);
					runtimeSurfaceEvents.unsubscribeEvent(type);
				}
			}
		}
	};
}

function createExtensionRuntimeSurfaceCommands(
	getInternalState: GetInternalState,
	runtimeSurfaceCommands: ExtensionRuntimeSurfaceCommandsInternalSurface,
	extensionDef: AnyExtensionDefinition
): ExtensionRuntimeSurfaceCommands {
	return {
		...runtimeSurfaceCommands,
		startDrag(session) {
			const internalState = getInternalState();
			const extensionRec = internalState.extensions.get(extensionDef.id);
			assert(extensionRec, 'Extension record not found for starting drag session');
			assert(
				extensionRec.instance.completeDrag,
				'Extension instance does not have a completeDrag handler for starting drag session'
			);
			const extSession: DragSessionExtensionOwned = {
				owner: extensionDef.id,
				...session
			};
			return runtimeSurfaceCommands.startDrag(extSession);
		}
	};
}

export function createExtensionRuntimeSurface(
	getInternalState: GetInternalState,
	commands: ExtensionRuntimeSurfaceCommands,
	events: ExtensionRuntimeSurfaceEvents,
	extensionDef: AnyExtensionDefinition
): ExtensionRuntimeSurface {
	return {
		commands: createExtensionRuntimeSurfaceCommands(getInternalState, commands, extensionDef),
		animation: createExtensionRuntimeSurfaceAnimation(getInternalState, extensionDef),
		transientVisuals: createExtensionRuntimeSurfaceTransientVisuals(getInternalState, extensionDef),
		events: createExtensionRuntimeSurfaceEvents(getInternalState, events, extensionDef)
	};
}
