import { describe, expect, it, vi } from 'vitest';
import { createExtensionSystem } from '../../../src/extensions/factory/main.js';
import type { UpdateFrameSnapshotMounted } from '../../../src/extensions/types/basic/update.js';
import type {
	AnyExtensionDefinition,
	AnyExtensionInstance
} from '../../../src/extensions/types/extension.js';
import type { ExtensionSystemUpdateRequest } from '../../../src/extensions/types/main.js';
import type { RuntimeReadonlyMutationSession } from '../../../src/runtime/mutation/types.js';
import type { RuntimeStateSnapshot } from '../../../src/state/types.js';
import {
	createExtensionSystemOptions,
	createFakeExtensionDefinition
} from '../../test-utils/extensions/factory.js';

function createMockMutationSession(): RuntimeReadonlyMutationSession {
	return {
		hasMutation: vi.fn(() => false),
		getPayloads: vi.fn(() => undefined),
		getAll: vi.fn(() => new Map())
	} as unknown as RuntimeReadonlyMutationSession;
}

function createMountedFrame(): UpdateFrameSnapshotMounted {
	return {
		isMounted: true,
		state: {} as RuntimeStateSnapshot,
		layout: { sceneSize: null, orientation: null, geometry: null, layoutEpoch: 0 }
	};
}

function createUpdateRequest(): ExtensionSystemUpdateRequest {
	return {
		state: createMountedFrame(),
		mutation: createMockMutationSession()
	};
}

describe('createExtensionSystem – onUnmount cleanup', () => {
	it('clears transient visuals subscribers', () => {
		let surface: { transientVisuals: { subscribe: () => void } } | null = null;
		const def: AnyExtensionDefinition = {
			id: 'ext-a',
			slots: [],
			createInstance(opts) {
				surface = opts.runtimeSurface as typeof surface;
				return { id: 'ext-a' } as unknown as AnyExtensionInstance;
			}
		};
		const system = createExtensionSystem(createExtensionSystemOptions([def]));
		const shared = system.getSharedDataForRenderSystem();

		surface!.transientVisuals.subscribe();
		expect(shared.transientVisualsSubscribers.size).toBe(1);

		system.onUnmount();

		expect(shared.transientVisualsSubscribers.size).toBe(0);
	});

	it('clears currentFrame', () => {
		const { definition } = createFakeExtensionDefinition({ id: 'ext-a' });
		const system = createExtensionSystem(createExtensionSystemOptions([definition]));

		system.onUpdate(createUpdateRequest());
		expect(system.currentFrame).not.toBeNull();

		system.onUnmount();

		expect(system.currentFrame).toBeNull();
	});

	it('clears event subscribers', () => {
		const onEvent = vi.fn();
		let surface: { events: { subscribeEvent: (t: string) => void } } | null = null;
		const def: AnyExtensionDefinition = {
			id: 'ext-a',
			slots: [],
			createInstance(opts) {
				surface = opts.runtimeSurface as typeof surface;
				return { id: 'ext-a', onEvent } as unknown as AnyExtensionInstance;
			}
		};
		const system = createExtensionSystem(createExtensionSystemOptions([def]));

		surface!.events.subscribeEvent('pointerdown');

		system.onEvent({
			rawEvent: new Event('pointerdown'),
			sceneEvent: null,
			runtimeInteractionActionPreview: null
		});
		expect(onEvent).toHaveBeenCalledTimes(1);

		system.onUnmount();

		onEvent.mockClear();
		system.onEvent({
			rawEvent: new Event('pointerdown'),
			sceneEvent: null,
			runtimeInteractionActionPreview: null
		});
		expect(onEvent).not.toHaveBeenCalled();
	});

	it('does NOT clear extension invalidation state on unmount', () => {
		const onUpdate = vi.fn();
		const def: AnyExtensionDefinition = {
			id: 'ext-a',
			slots: [],
			createInstance: () => ({ id: 'ext-a', onUpdate }) as unknown as AnyExtensionInstance
		};
		const system = createExtensionSystem(createExtensionSystemOptions([def]));
		const shared = system.getSharedDataForRenderSystem();

		shared.extensions.get('ext-a')!.invalidation.markDirty(0b1111);
		expect(shared.extensions.get('ext-a')!.invalidation.dirtyLayers).toBe(0b1111);

		system.onUnmount();

		// Invalidation dirty bits survive unmount — they represent pending visual work
		expect(shared.extensions.get('ext-a')!.invalidation.dirtyLayers).toBe(0b1111);
	});

	it('clears each extension animation sessions', () => {
		const { definition } = createFakeExtensionDefinition({ id: 'ext-a' });
		const system = createExtensionSystem(createExtensionSystemOptions([definition]));
		const shared = system.getSharedDataForRenderSystem();

		shared.extensions.get('ext-a')!.animation.submit({ duration: 100 });
		expect(shared.extensions.get('ext-a')!.animation.getAll()).toHaveLength(1);

		system.onUnmount();

		expect(shared.extensions.get('ext-a')!.animation.getAll()).toHaveLength(0);
	});

	it('does not call extension instance unmount hooks (render system owns that)', () => {
		const unmount = vi.fn();
		const def: AnyExtensionDefinition = {
			id: 'ext-a',
			slots: [],
			createInstance: () => ({ id: 'ext-a', unmount }) as unknown as AnyExtensionInstance
		};
		const system = createExtensionSystem(createExtensionSystemOptions([def]));

		system.onUnmount();

		expect(unmount).not.toHaveBeenCalled();
	});
});

describe('createExtensionSystem – onDestroy cleanup', () => {
	it('calls extension destroy hooks if defined', () => {
		const destroy = vi.fn();
		const def: AnyExtensionDefinition = {
			id: 'ext-a',
			slots: [],
			createInstance: () => ({ id: 'ext-a', destroy }) as unknown as AnyExtensionInstance
		};
		const system = createExtensionSystem(createExtensionSystemOptions([def]));

		system.onUnmount();
		system.onDestroy();

		expect(destroy).toHaveBeenCalledTimes(1);
	});

	it('skips missing destroy hooks without throwing', () => {
		const { definition } = createFakeExtensionDefinition({ id: 'ext-a' });
		const system = createExtensionSystem(createExtensionSystemOptions([definition]));

		system.onUnmount();

		expect(() => system.onDestroy()).not.toThrow();
	});

	it('clears extension records after destroy', () => {
		const { definition } = createFakeExtensionDefinition({ id: 'ext-a' });
		const system = createExtensionSystem(createExtensionSystemOptions([definition]));
		const shared = system.getSharedDataForRenderSystem();

		expect(shared.extensions.size).toBe(1);

		system.onUnmount();
		system.onDestroy();

		expect(shared.extensions.size).toBe(0);
	});

	it('does not throw on destroy when invalidation is dirty (dirty bits are not a lifecycle signal)', () => {
		const def: AnyExtensionDefinition = {
			id: 'ext-a',
			slots: [],
			createInstance: () => ({ id: 'ext-a' }) as unknown as AnyExtensionInstance
		};
		const system = createExtensionSystem(createExtensionSystemOptions([def]));
		const shared = system.getSharedDataForRenderSystem();

		shared.extensions.get('ext-a')!.invalidation.markDirty(1);

		// Dirty invalidation is legitimate — it does not prevent destroy
		system.onUnmount();
		expect(() => system.onDestroy()).not.toThrow();
	});

	it('dirty invalidation disappears structurally when destroy removes extension records', () => {
		const def: AnyExtensionDefinition = {
			id: 'ext-a',
			slots: [],
			createInstance: () => ({ id: 'ext-a' }) as unknown as AnyExtensionInstance
		};
		const system = createExtensionSystem(createExtensionSystemOptions([def]));
		const shared = system.getSharedDataForRenderSystem();

		shared.extensions.get('ext-a')!.invalidation.markDirty(0b1111);

		system.onUnmount();
		system.onDestroy();

		// Records are cleared, so no invalidation state remains
		expect(shared.extensions.size).toBe(0);
	});

	it('throws if called without proper unmount (pending animation)', () => {
		const def: AnyExtensionDefinition = {
			id: 'ext-a',
			slots: [],
			createInstance: () => ({ id: 'ext-a' }) as unknown as AnyExtensionInstance
		};
		const system = createExtensionSystem(createExtensionSystemOptions([def]));
		const shared = system.getSharedDataForRenderSystem();

		shared.extensions.get('ext-a')!.animation.submit({ duration: 100 });

		expect(() => system.onDestroy()).toThrow();
	});
});
