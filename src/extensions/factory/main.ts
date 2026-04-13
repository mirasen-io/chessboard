import { createExtensionAnimationController } from '../animation/factory';
import { createExtensionInvalidationState } from '../invalidation/factory';
import {
	ExtensionSystem,
	ExtensionSystemExtensionRecord,
	ExtensionSystemInitOptions,
	ExtensionSystemInternal
} from '../types/main';
import { extensionSystemUpdateState } from '../update';
import { createExtensionRuntimeSurface } from './runtime';

function createExtensionSystemInternal(
	getInternalState: () => ExtensionSystemInternal,
	options: ExtensionSystemInitOptions
): ExtensionSystemInternal {
	const extensions = new Map<string, ExtensionSystemExtensionRecord>();
	const extensionsArray = options.extensions ?? [];
	for (const extensionDef of extensionsArray) {
		if (extensions.has(extensionDef.id)) {
			throw new Error(`Duplicate extension id found: ${extensionDef.id}`);
		}
		const instance = extensionDef.createInstance({
			runtimeSurface: createExtensionRuntimeSurface(
				getInternalState,
				options.extensionRuntimeSurfaceCommands,
				extensionDef
			)
		});
		const record: ExtensionSystemExtensionRecord = {
			id: extensionDef.id,
			definition: extensionDef,
			instance,
			invalidation: createExtensionInvalidationState(),
			animation: createExtensionAnimationController()
		};
		extensions.set(extensionDef.id, record);
	}
	return {
		extensions,
		transientVisualsSubscribers: new Set(),
		eventSubscribers: new Map(),
		currentFrame: null
	};
}

export function createExtensionSystem(options: ExtensionSystemInitOptions): ExtensionSystem {
	let internalState: ExtensionSystemInternal | null = null;
	function getInternalState(): ExtensionSystemInternal {
		if (!internalState) {
			throw new Error('Extension system internal state is not initialized');
		}
		return internalState;
	}
	internalState = createExtensionSystemInternal(getInternalState, options);

	return {
		getSharedDataForRenderSystem() {
			return {
				extensions: internalState.extensions,
				transientVisualsSubscribers: internalState.transientVisualsSubscribers
			};
		},
		get currentFrame() {
			return internalState.currentFrame;
		},
		onUpdate(request) {
			extensionSystemUpdateState(internalState, request);
		},
		onUnmount() {
			internalState.transientVisualsSubscribers.clear();
			internalState.eventSubscribers.clear();
			internalState.currentFrame = null;
			for (const extensionRec of internalState.extensions.values()) {
				extensionRec.invalidation.clear();
				extensionRec.animation.clear();
			}
		},
		onDestroy() {
			// We assume that the onUnmout was already called by runtime, but let's still validate
			for (const extensionRec of internalState.extensions.values()) {
				const onUnmountCalled = [
					extensionRec.invalidation.dirtyLayers === 0,
					extensionRec.animation.getAll().length === 0
				].every(Boolean);
				if (!onUnmountCalled) {
					throw new Error(
						`Extension ${extensionRec.id} was not properly unmounted before destroy. Please make sure to call onUnmount before onDestroy to allow the extension to clean up its state and resources.`
					);
				}
			}
			// So we just clear the extension map to release references to extension definitions and instances and allow them to be garbage collected
			// Cause they also have back reference to our surface to manipulate the core state
			internalState.extensions.clear();
		}
	};
}
