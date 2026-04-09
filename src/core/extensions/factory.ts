import { createExtensionAnimationController } from './animation/factory';
import { createExtensionInvalidationState } from './invalidation/factory';
import {
	ExtensionSystem,
	ExtensionSystemExtensionRecord,
	ExtensionSystemInitOptions,
	ExtensionSystemInternal
} from './types';
import { extensionSystemUpdateState } from './update';

function createExtensionSystemInternal(
	options: ExtensionSystemInitOptions
): ExtensionSystemInternal {
	const extensions = new Map<string, ExtensionSystemExtensionRecord>();
	// Check that the first extension is the main renderer extension
	if (options.extensions.length === 0 || options.extensions[0].id !== 'main-renderer') {
		throw new Error('The first extension must be the main renderer extension.');
	}
	for (const extensionDef of options.extensions) {
		if (extensions.has(extensionDef.id)) {
			throw new Error(`Duplicate extension id found: ${extensionDef.id}`);
		}
		const instance = extensionDef.createInstance(options.createInstanceOptions);
		const record: ExtensionSystemExtensionRecord = {
			id: extensionDef.id,
			definition: extensionDef,
			instance,
			storedData: {
				previous: null,
				current: null
			},
			invalidation: createExtensionInvalidationState(),
			animation: createExtensionAnimationController()
		};
		extensions.set(extensionDef.id, record);
	}
	return {
		extensions,
		lastUpdated: null
	};
}

export function createExtensionSystem(options: ExtensionSystemInitOptions): ExtensionSystem {
	const internalState = createExtensionSystemInternal(options);

	return {
		get extensions() {
			return internalState.extensions;
		},
		updateState(request) {
			if (internalState.extensions.size === 0) {
				// We at least expect the main renderer extension to be present, so if there are no extensions at all, it means the system hasn't been properly initialized yet
				throw new Error(
					'Cannot update state before extensions have been created. Expected at least the main renderer extension to be present.'
				);
			}
			extensionSystemUpdateState(internalState, request);
		},
		onUnmount() {
			internalState.lastUpdated = null;
			for (const extensionRec of internalState.extensions.values()) {
				extensionRec.storedData.previous = null;
				extensionRec.storedData.current = null;
				extensionRec.invalidation.clear();
				extensionRec.animation.clear();
			}
		},
		onDestroy() {
			// We assume that the onUnmout was already called by runtime, but let's still validate
			for (const extensionRec of internalState.extensions.values()) {
				const onUnmountCalled = [
					extensionRec.storedData.current === null,
					extensionRec.storedData.previous === null,
					extensionRec.invalidation.dirtyLayers === 0,
					extensionRec.animation.getAll().length === 0
				].every(Boolean);
				if (!onUnmountCalled) {
					throw new Error(
						`Extension ${extensionRec.id} was not properly unmounted before destroy. Please make sure to call onUnmount before onDestroy to allow the extension to clean up its state and resources.`
					);
				}
				// So we just clear the extension map to release references to extension definitions and instances and allow them to be garbage collected
				// Cause they also have back reference to our surface to manipulate the core state
				internalState.extensions.clear();
			}
		}
	};
}
