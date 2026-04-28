import { vi } from 'vitest';
import type { ExtensionInvalidationState } from '../../../src/extensions/invalidation/types.js';
import type { ExtensionSlotName } from '../../../src/extensions/types/basic/mount.js';
import type {
	AnyExtensionDefinition,
	AnyExtensionInstance
} from '../../../src/extensions/types/extension.js';
import type {
	ExtensionSystemExtensionRecord,
	ExtensionSystemSharedDataForRenderSystem
} from '../../../src/extensions/types/main.js';
import type { RenderSystemInitOptions } from '../../../src/render/types.js';

export interface FakeExtensionOptions {
	id: string;
	slots?: readonly ExtensionSlotName[];
}

function createFakeInvalidation(): ExtensionInvalidationState {
	return {
		dirtyLayers: 0,
		markDirty: vi.fn(),
		clearDirty: vi.fn(),
		clear: vi.fn()
	};
}

function createFakeAnimationController() {
	return {
		sessions: new Map()
	};
}

export function createFakeExtensionRecord(
	opts: FakeExtensionOptions
): ExtensionSystemExtensionRecord {
	const instance: AnyExtensionInstance = {
		id: opts.id,
		mount: vi.fn(),
		unmount: vi.fn(),
		destroy: vi.fn(),
		onUpdate: vi.fn()
	} as unknown as AnyExtensionInstance;

	const definition: AnyExtensionDefinition = {
		id: opts.id,
		slots: opts.slots ?? [],
		createInstance: vi.fn(() => instance)
	};

	return {
		id: opts.id,
		definition,
		instance,
		invalidation: createFakeInvalidation(),
		animation:
			createFakeAnimationController() as unknown as ExtensionSystemExtensionRecord['animation']
	};
}

export interface FakeSharedDataOptions {
	extensions?: FakeExtensionOptions[];
	transientVisualsSubscribers?: string[];
}

export function createFakeSharedData(
	opts: FakeSharedDataOptions = {}
): ExtensionSystemSharedDataForRenderSystem {
	const extensions = new Map<string, ExtensionSystemExtensionRecord>();
	for (const extOpts of opts.extensions ?? []) {
		extensions.set(extOpts.id, createFakeExtensionRecord(extOpts));
	}
	return {
		extensions,
		transientVisualsSubscribers: new Set(opts.transientVisualsSubscribers ?? [])
	};
}

export function createMinimalRenderSystemOptions(
	opts: FakeSharedDataOptions = {}
): RenderSystemInitOptions {
	return {
		doc: document,
		sharedDataFromExtensionSystem: createFakeSharedData(opts)
	};
}
