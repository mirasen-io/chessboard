import { createExtensionAnimationController } from '../animation/factory.js';
import { createExtensionInvalidationState } from '../invalidation/factory.js';
import {
	ExtensionSystem,
	ExtensionSystemExtensionRecord,
	ExtensionSystemInitOptions,
	ExtensionSystemInternal
} from '../types/main.js';
import { extensionSystemUpdateState, extensionSystemUpdateUIMoveRequest } from '../update.js';
import { createExtensionRuntimeSurface } from './runtime.js';

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
		get hasSubmittedAnimations() {
			for (const ext of internalState.extensions.values()) {
				if (ext.animation.getAll('submitted').length > 0) {
					return true;
				}
			}
			return false;
		},
		get currentFrame() {
			return internalState.currentFrame;
		},
		getPublicRecord() {
			const publicRecord: Record<string, unknown> = {};
			for (const [id, extRecord] of internalState.extensions.entries()) {
				if ('getPublic' in extRecord.instance) {
					// We know that if getPublic exists, then the instance has a public API, so this type assertion is safe
					const instanceWithPublic = extRecord.instance;
					publicRecord[id] = instanceWithPublic.getPublic();
				}
			}
			return publicRecord;
		},
		onUpdate(request) {
			extensionSystemUpdateState(internalState, request);
		},
		onUIMoveRequest(context) {
			extensionSystemUpdateUIMoveRequest(internalState, context);
		},
		onEvent(context) {
			// TODO: Implement
			console.log('Received event in extension system:', context);
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
				extensionRec.instance.destroy();
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
