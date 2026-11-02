import assert from '@ktarmyshov/assert';
import { createSvgIdResolver } from '../../render/svg/ids.js';
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
	const svgIds = createSvgIdResolver();
	const extensions = new Map<string, ExtensionSystemExtensionRecord>();
	const extensionsArray = options.extensions ?? [];
	for (const extensionDef of extensionsArray) {
		if (extensionDef.id === 'core') {
			throw new Error('Extension id "core" is reserved and cannot be used by extensions');
		}
		if (extensions.has(extensionDef.id)) {
			throw new Error(`Duplicate extension id found: ${extensionDef.id}`);
		}
		const instance = extensionDef.createInstance({
			runtimeSurface: createExtensionRuntimeSurface(
				getInternalState,
				options.extensionRuntimeSurfaceCommands,
				options.extensionRuntimeSurfaceEvents,
				extensionDef
			),
			svgIds
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
			const subscribers = internalState.eventSubscribers.get(context.rawEvent.type);
			if (subscribers) {
				for (const extensionId of subscribers) {
					const extensionRec = internalState.extensions.get(extensionId);
					if (extensionRec) {
						extensionRec.instance.onEvent?.(context);
					}
				}
			}
		},
		completeDrag(session) {
			const extensionRec = internalState.extensions.get(session.owner);
			assert(
				extensionRec,
				`Extension record not found for completing drag session with owner ${session.owner}`
			);
			assert(
				extensionRec.instance.completeDrag,
				`Extension instance does not have a completeDrag handler for completing drag session with owner ${session.owner}`
			);
			extensionRec.instance.completeDrag(session);
		},
		cancelDrag(session) {
			const extensionRec = internalState.extensions.get(session.owner);
			assert(
				extensionRec,
				`Extension record not found for cancelling drag session with owner ${session.owner}`
			);
			extensionRec.instance.cancelDrag?.(session);
		},
		onUnmount() {
			internalState.transientVisualsSubscribers.clear();
			internalState.eventSubscribers.clear();
			internalState.currentFrame = null;
			for (const extensionRec of internalState.extensions.values()) {
				extensionRec.animation.clear();
			}
		},
		onDestroy() {
			// We assume that the onUnmount was already called by runtime, but let's still validate
			for (const extensionRec of internalState.extensions.values()) {
				extensionRec.instance.destroy?.();
				const onUnmountCalled = extensionRec.animation.getAll().length === 0;
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
