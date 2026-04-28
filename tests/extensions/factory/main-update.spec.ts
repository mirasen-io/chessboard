import { describe, expect, it, vi } from 'vitest';
import { createExtensionSystem } from '../../../src/extensions/factory/main.js';
import type {
	UpdateFrameSnapshot,
	UpdateFrameSnapshotMounted,
	UpdateFrameSnapshotUnmounted
} from '../../../src/extensions/types/basic/update.js';
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

function createUnmountedFrame(): UpdateFrameSnapshotUnmounted {
	return {
		isMounted: false,
		state: {} as RuntimeStateSnapshot
	};
}

function createMountedFrame(): UpdateFrameSnapshotMounted {
	return {
		isMounted: true,
		state: {} as RuntimeStateSnapshot,
		layout: { sceneSize: null, orientation: null, geometry: null, layoutEpoch: 0 }
	};
}

function createUpdateRequest(frame?: UpdateFrameSnapshot): ExtensionSystemUpdateRequest {
	return {
		state: frame ?? createMountedFrame(),
		mutation: createMockMutationSession()
	};
}

describe('createExtensionSystem – onUpdate dispatch', () => {
	it('calls onUpdate on extensions that define it', () => {
		const onUpdate = vi.fn();
		const def: AnyExtensionDefinition = {
			id: 'ext-a',
			slots: [],
			createInstance: () => ({ id: 'ext-a', onUpdate }) as unknown as AnyExtensionInstance
		};
		const system = createExtensionSystem(createExtensionSystemOptions([def]));

		system.onUpdate(createUpdateRequest());

		expect(onUpdate).toHaveBeenCalledTimes(1);
	});

	it('skips extensions without onUpdate', () => {
		const def: AnyExtensionDefinition = {
			id: 'ext-a',
			slots: [],
			createInstance: () => ({ id: 'ext-a' }) as unknown as AnyExtensionInstance
		};
		const system = createExtensionSystem(createExtensionSystemOptions([def]));

		expect(() => system.onUpdate(createUpdateRequest())).not.toThrow();
	});

	it('passes expected context with previousFrame, mutation, and currentFrame', () => {
		const onUpdate = vi.fn();
		const def: AnyExtensionDefinition = {
			id: 'ext-a',
			slots: [],
			createInstance: () => ({ id: 'ext-a', onUpdate }) as unknown as AnyExtensionInstance
		};
		const system = createExtensionSystem(createExtensionSystemOptions([def]));

		const frame = createMountedFrame();
		const mutation = createMockMutationSession();
		system.onUpdate({ state: frame, mutation });

		const ctx = onUpdate.mock.calls[0][0];
		expect(ctx.previousFrame).toBeNull();
		expect(ctx.currentFrame).toBe(frame);
		expect(ctx.mutation).toBe(mutation);
	});

	it('updates currentFrame after dispatch', () => {
		const { definition } = createFakeExtensionDefinition({ id: 'ext-a' });
		const system = createExtensionSystem(createExtensionSystemOptions([definition]));

		const frame = createMountedFrame();
		system.onUpdate({ state: frame, mutation: createMockMutationSession() });

		expect(system.currentFrame).toBe(frame);
	});

	it('sets previousFrame to the last currentFrame on subsequent calls', () => {
		const onUpdate = vi.fn();
		const def: AnyExtensionDefinition = {
			id: 'ext-a',
			slots: [],
			createInstance: () => ({ id: 'ext-a', onUpdate }) as unknown as AnyExtensionInstance
		};
		const system = createExtensionSystem(createExtensionSystemOptions([def]));

		const frame1 = createMountedFrame();
		const frame2 = createMountedFrame();
		system.onUpdate({ state: frame1, mutation: createMockMutationSession() });
		system.onUpdate({ state: frame2, mutation: createMockMutationSession() });

		const ctx2 = onUpdate.mock.calls[1][0];
		expect(ctx2.previousFrame).toBe(frame1);
		expect(ctx2.currentFrame).toBe(frame2);
	});

	it('includes invalidation in context when frame is mounted', () => {
		const onUpdate = vi.fn();
		const def: AnyExtensionDefinition = {
			id: 'ext-a',
			slots: [],
			createInstance: () => ({ id: 'ext-a', onUpdate }) as unknown as AnyExtensionInstance
		};
		const system = createExtensionSystem(createExtensionSystemOptions([def]));

		system.onUpdate(createUpdateRequest(createMountedFrame()));

		const ctx = onUpdate.mock.calls[0][0];
		expect(ctx.invalidation).toBeDefined();
		expect(ctx.invalidation.markDirty).toBeDefined();
	});

	it('does not include invalidation in context when frame is unmounted', () => {
		const onUpdate = vi.fn();
		const def: AnyExtensionDefinition = {
			id: 'ext-a',
			slots: [],
			createInstance: () => ({ id: 'ext-a', onUpdate }) as unknown as AnyExtensionInstance
		};
		const system = createExtensionSystem(createExtensionSystemOptions([def]));

		system.onUpdate(createUpdateRequest(createUnmountedFrame()));

		const ctx = onUpdate.mock.calls[0][0];
		expect(ctx.invalidation).toBeUndefined();
	});

	it('each extension receives its own invalidation state in the context', () => {
		const onUpdateA = vi.fn();
		const onUpdateB = vi.fn();
		const defA: AnyExtensionDefinition = {
			id: 'ext-a',
			slots: [],
			createInstance: () =>
				({ id: 'ext-a', onUpdate: onUpdateA }) as unknown as AnyExtensionInstance
		};
		const defB: AnyExtensionDefinition = {
			id: 'ext-b',
			slots: [],
			createInstance: () =>
				({ id: 'ext-b', onUpdate: onUpdateB }) as unknown as AnyExtensionInstance
		};
		const system = createExtensionSystem(createExtensionSystemOptions([defA, defB]));

		system.onUpdate(createUpdateRequest(createMountedFrame()));

		const ctxA = onUpdateA.mock.calls[0][0];
		const ctxB = onUpdateB.mock.calls[0][0];
		expect(ctxA.invalidation).not.toBe(ctxB.invalidation);
	});
});
