import { AnyExtensionDefinition } from '../types/extension';
import { GetInternalState } from '../types/main';
import { ExtensionRuntimeSurfaceCommands } from '../types/surface/commands';
import { ExtensionRuntimeSurface } from '../types/surface/main';
import { ExtensionRuntimeSurfaceTransientVisuals } from '../types/surface/transient-visuals';

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

export function createExtensionRuntimeSurface(
	getInternalState: GetInternalState,
	commands: ExtensionRuntimeSurfaceCommands,
	extensionDef: AnyExtensionDefinition
): ExtensionRuntimeSurface {
	// @ts-expect-error We will implement events and transient visuals later, for now we just return empty objects for them to satisfy the interface
	return {
		commands,
		transientVisuals: createExtensionRuntimeSurfaceTransientVisuals(getInternalState, extensionDef)
	};
}
