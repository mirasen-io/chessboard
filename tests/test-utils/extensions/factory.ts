import { vi } from 'vitest';
import type {
	AnyExtensionDefinition,
	AnyExtensionInstance,
	ExtensionCreateInstanceOptions
} from '../../../src/extensions/types/extension.js';
import type { ExtensionSystemInitOptions } from '../../../src/extensions/types/main.js';
import type { ExtensionRuntimeSurfaceCommandsInternalSurface } from '../../../src/extensions/types/surface/commands.js';
import type { ExtensionRuntimeSurfaceEvents } from '../../../src/extensions/types/surface/events.js';
import { createSvgIdResolver } from '../../../src/render/svg/ids.js';

/**
 * Creates a minimal mock of ExtensionRuntimeSurfaceCommandsInternalSurface.
 * All methods are vi.fn() stubs.
 */
export function createMockCommands(): ExtensionRuntimeSurfaceCommandsInternalSurface {
	return {
		setPosition: vi.fn(),
		setPiecePosition: vi.fn(),
		setTurn: vi.fn(),
		move: vi.fn(),
		setOrientation: vi.fn(),
		setMovability: vi.fn(),
		select: vi.fn(),
		startDrag: vi.fn(),
		clearActiveInteraction: vi.fn(),
		clearInteraction: vi.fn(),
		resolveDeferredUIMoveRequest: vi.fn(),
		cancelDeferredUIMoveRequest: vi.fn(),
		requestRender: vi.fn(),
		getSnapshot: vi.fn()
	} as unknown as ExtensionRuntimeSurfaceCommandsInternalSurface;
}

/**
 * Creates a minimal mock of ExtensionRuntimeSurfaceEvents.
 */
export function createMockEvents(): ExtensionRuntimeSurfaceEvents {
	return {
		subscribeEvent: vi.fn(),
		unsubscribeEvent: vi.fn()
	};
}

/**
 * Creates ExtensionSystemInitOptions with mock commands/events and the given extension definitions.
 */
export function createExtensionSystemOptions(
	extensions?: readonly AnyExtensionDefinition[]
): ExtensionSystemInitOptions {
	return {
		extensionRuntimeSurfaceCommands: createMockCommands(),
		extensionRuntimeSurfaceEvents: createMockEvents(),
		extensions
	};
}

export interface FakeExtensionDefinitionOptions {
	id: string;
	hasPublic?: boolean;
	publicValue?: unknown;
}

/**
 * Creates a fake extension definition that captures createInstance options.
 * If hasPublic is true, the instance will expose getPublic() returning publicValue.
 */
export function createFakeExtensionDefinition(opts: FakeExtensionDefinitionOptions): {
	definition: AnyExtensionDefinition;
	getCapturedOptions: () => ExtensionCreateInstanceOptions | null;
} {
	let capturedOptions: ExtensionCreateInstanceOptions | null = null;

	const definition: AnyExtensionDefinition = {
		id: opts.id,
		slots: [],
		createInstance(options: ExtensionCreateInstanceOptions) {
			capturedOptions = options;
			const instance: AnyExtensionInstance = {
				id: opts.id,
				...(opts.hasPublic ? { getPublic: () => opts.publicValue } : {})
			} as unknown as AnyExtensionInstance;
			return instance;
		}
	};

	return {
		definition,
		getCapturedOptions: () => capturedOptions
	};
}

/**
 * Creates a mock ExtensionCreateInstanceOptions for use in tests.
 */
export function createMockExtensionCreateInstanceOptions(): ExtensionCreateInstanceOptions {
	return {
		runtimeSurface: {
			commands: createMockCommands(),
			animation: { submit: vi.fn(), cancel: vi.fn(), getAll: vi.fn(() => []) },
			transientVisuals: { subscribe: vi.fn(), unsubscribe: vi.fn() },
			events: { subscribeEvent: vi.fn(), unsubscribeEvent: vi.fn() },
			invalidation: { dirtyLayers: 0, markDirty: vi.fn(), clearDirty: vi.fn(), clear: vi.fn() }
		},
		svgIds: createSvgIdResolver()
	};
}
