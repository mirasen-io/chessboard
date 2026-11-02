import { vi } from 'vitest';
import { createExtensionAnimationController } from '../../../src/extensions/animation/factory.js';
import { createExtensionInvalidationState } from '../../../src/extensions/invalidation/factory.js';
import type { ExtensionAnimationControllerInternalSurface } from '../../../src/extensions/types/basic/animation.js';
import type {
	AnyExtensionDefinition,
	AnyExtensionInstance
} from '../../../src/extensions/types/extension.js';
import type {
	ExtensionSystemExtensionRecord,
	ExtensionSystemInternal
} from '../../../src/extensions/types/main.js';
import type { ExtensionRuntimeSurfaceCommandsInternalSurface } from '../../../src/extensions/types/surface/commands.js';
import type { ExtensionRuntimeSurfaceEvents } from '../../../src/extensions/types/surface/events.js';

export function createMockCommandsSurface(): ExtensionRuntimeSurfaceCommandsInternalSurface {
	return {
		setPosition: vi.fn(() => true),
		setPiecePosition: vi.fn(() => true),
		setTurn: vi.fn(() => true),
		move: vi.fn(),
		setOrientation: vi.fn(() => true),
		setMovability: vi.fn(() => true),
		select: vi.fn(() => true),
		startDrag: vi.fn(() => true),
		clearActiveInteraction: vi.fn(() => true),
		clearInteraction: vi.fn(() => true),
		resolveDeferredUIMoveRequest: vi.fn(),
		cancelDeferredUIMoveRequest: vi.fn(() => true),
		requestRender: vi.fn(() => true),
		getSnapshot: vi.fn()
	} as unknown as ExtensionRuntimeSurfaceCommandsInternalSurface;
}

export function createMockEventsSurface(): ExtensionRuntimeSurfaceEvents {
	return {
		subscribeEvent: vi.fn(),
		unsubscribeEvent: vi.fn()
	};
}

export function createFakeExtensionDef(id: string): AnyExtensionDefinition {
	return { id, slots: [], createInstance: vi.fn() };
}

export function createFakeExtensionRecord(
	id: string,
	opts: {
		hasCompleteDrag?: boolean;
		hasOnEvent?: boolean;
		animation?: ExtensionAnimationControllerInternalSurface;
	} = {}
): ExtensionSystemExtensionRecord {
	const instance: AnyExtensionInstance = {
		id,
		...(opts.hasCompleteDrag ? { completeDrag: vi.fn() } : {}),
		...(opts.hasOnEvent ? { onEvent: vi.fn() } : {})
	} as unknown as AnyExtensionInstance;
	return {
		id,
		definition: createFakeExtensionDef(id),
		instance,
		invalidation: createExtensionInvalidationState(),
		animation: opts.animation ?? createExtensionAnimationController()
	};
}

export function createInternalState(
	records: ExtensionSystemExtensionRecord[]
): ExtensionSystemInternal {
	const extensions = new Map<string, ExtensionSystemExtensionRecord>();
	for (const rec of records) {
		extensions.set(rec.id, rec);
	}
	return {
		extensions,
		transientVisualsSubscribers: new Set(),
		eventSubscribers: new Map(),
		currentFrame: null
	};
}
