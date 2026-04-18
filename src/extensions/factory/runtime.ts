import assert from '@ktarmyshov/assert';
import type { ExtensionAnimationController } from '../types/basic/animation';
import type { AnyExtensionDefinition } from '../types/extension';
import type { GetInternalState } from '../types/main';
import type { ExtensionRuntimeSurfaceCommands } from '../types/surface/commands';
import type { ExtensionRuntimeSurface } from '../types/surface/main';
import type { ExtensionRuntimeSurfaceTransientVisuals } from '../types/surface/transient-visuals';

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

export function createExtensionRuntimeSurface(
	getInternalState: GetInternalState,
	commands: ExtensionRuntimeSurfaceCommands,
	extensionDef: AnyExtensionDefinition
): ExtensionRuntimeSurface {
	// @ts-expect-error We will implement events later, for now we just return empty object for it to satisfy the interface
	return {
		commands,
		animation: createExtensionRuntimeSurfaceAnimation(getInternalState, extensionDef),
		transientVisuals: createExtensionRuntimeSurfaceTransientVisuals(getInternalState, extensionDef)
	};
}
