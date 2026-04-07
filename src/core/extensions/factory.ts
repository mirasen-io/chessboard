import {
	ExtensionRecordInternalDraft,
	ExtensionSystem,
	ExtensionSystemInitOptions,
	ExtensionSystemInternal
} from './types';
import { extensionSystemUpdateState } from './update';

function createExtensionSystemInternal(
	options: ExtensionSystemInitOptions
): ExtensionSystemInternal {
	const draftExtensions = new Map<string, ExtensionRecordInternalDraft>();
	// Check that the first extension is the main renderer extension
	if (options.extensions.length === 0 || options.extensions[0].id !== 'main-renderer') {
		throw new Error('The first extension must be the main renderer extension.');
	}
	for (const extensionDef of options.extensions) {
		if (draftExtensions.has(extensionDef.id)) {
			throw new Error(`Duplicate extension id found: ${extensionDef.id}`);
		}
		const instance = extensionDef.createInstance();
		const recordDraft: ExtensionRecordInternalDraft = {
			id: extensionDef.id,
			definition: extensionDef,
			instance,
			data: {
				previous: null,
				current: null
			}
		};
		draftExtensions.set(extensionDef.id, recordDraft);
	}
	return {
		draftExtensions,
		extensions: new Map(), // Will be populated after initialization of the render system is complete
		extensionsFinalized: false,
		lastRenderedState: null
	};
}

export function createExtensionSystem(options: ExtensionSystemInitOptions): ExtensionSystem {
	const internalState = createExtensionSystemInternal(options);

	return {
		get draftExtensions() {
			return internalState.draftExtensions;
		},
		get extensions() {
			return internalState.extensions;
		},
		updateState(request) {
			extensionSystemUpdateState(internalState, request);
		},
		setFinalExtensions(extensions) {
			if (internalState.extensionsFinalized) {
				throw new Error('Extensions have already been finalized and cannot be updated.');
			}
			if (internalState.extensions.size > 0) {
				throw new Error('Final extensions have already been set and cannot be updated.');
			}
			if (internalState.draftExtensions === null) {
				throw new Error(
					'Draft extensions are not available. Final extensions have likely already been set.'
				);
			}
			internalState.extensionsFinalized = true;
			internalState.draftExtensions = null; // Clear draft extensions to free memory
			for (const [id, extRec] of extensions.entries()) {
				internalState.extensions.set(id, extRec);
			}
		},
		setLastRenderedState(context) {
			internalState.lastRenderedState = context;
		}
	};
}
