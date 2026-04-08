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
		const instance = extensionDef.createInstance();
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
				extensionRec.invalidation.clear();
				extensionRec.animation.clear();
			}
		}
	};
}
