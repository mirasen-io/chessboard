import { describe, expect, it, vi } from 'vitest';
import { createExtensionSystem } from '../../../src/extensions/factory/main.js';
import type {
	AnyExtensionDefinition,
	AnyExtensionInstance
} from '../../../src/extensions/types/extension.js';
import {
	createExtensionSystemOptions,
	createFakeExtensionDefinition
} from '../../test-utils/extensions/factory.js';

describe('createExtensionSystem', () => {
	describe('factory guards', () => {
		it('throws when extension id is the reserved "core"', () => {
			const def: AnyExtensionDefinition = {
				id: 'core',
				slots: [],
				createInstance: vi.fn(() => ({ id: 'core' }) as unknown as AnyExtensionInstance)
			};
			expect(() => createExtensionSystem(createExtensionSystemOptions([def]))).toThrow(/core/);
		});

		it('throws on duplicate extension ids', () => {
			const { definition: def1 } = createFakeExtensionDefinition({ id: 'dup' });
			const { definition: def2 } = createFakeExtensionDefinition({ id: 'dup' });
			expect(() => createExtensionSystem(createExtensionSystemOptions([def1, def2]))).toThrow(
				/[Dd]uplicate/
			);
		});

		it('creates system with no extensions when extensions is undefined', () => {
			const system = createExtensionSystem(createExtensionSystemOptions(undefined));
			expect(system).toBeDefined();
			expect(system.getPublicRecord()).toEqual({});
		});

		it('creates system with no extensions when extensions is empty array', () => {
			const system = createExtensionSystem(createExtensionSystemOptions([]));
			expect(system).toBeDefined();
			expect(system.getPublicRecord()).toEqual({});
		});
	});

	describe('extension record creation', () => {
		it('calls createInstance on each extension definition', () => {
			const { definition: def1 } = createFakeExtensionDefinition({ id: 'ext-a' });
			const { definition: def2 } = createFakeExtensionDefinition({ id: 'ext-b' });
			const spy1 = vi.spyOn(def1, 'createInstance');
			const spy2 = vi.spyOn(def2, 'createInstance');

			createExtensionSystem(createExtensionSystemOptions([def1, def2]));

			expect(spy1).toHaveBeenCalledTimes(1);
			expect(spy2).toHaveBeenCalledTimes(1);
		});

		it('passes a runtimeSurface object to createInstance', () => {
			const { definition, getCapturedOptions } = createFakeExtensionDefinition({ id: 'ext-a' });

			createExtensionSystem(createExtensionSystemOptions([definition]));

			const options = getCapturedOptions();
			expect(options).not.toBeNull();
			expect(options!.runtimeSurface).toBeDefined();
			expect(options!.runtimeSurface.commands).toBeDefined();
			expect(options!.runtimeSurface.animation).toBeDefined();
			expect(options!.runtimeSurface.events).toBeDefined();
			expect(options!.runtimeSurface.transientVisuals).toBeDefined();
		});

		it('extension records are accessible via getSharedDataForRenderSystem', () => {
			const { definition: def1 } = createFakeExtensionDefinition({ id: 'ext-a' });
			const { definition: def2 } = createFakeExtensionDefinition({ id: 'ext-b' });

			const system = createExtensionSystem(createExtensionSystemOptions([def1, def2]));
			const shared = system.getSharedDataForRenderSystem();

			const recA = shared.extensions.get('ext-a');
			expect(recA).toBeDefined();
			expect(recA!.id).toBe('ext-a');
			expect(recA!.definition).toBe(def1);
			expect(recA!.instance).toBeDefined();
			expect(recA!.instance.id).toBe('ext-a');
			expect(recA!.invalidation).toBeDefined();
			expect(recA!.invalidation.dirtyLayers).toBe(0);
			expect(recA!.animation).toBeDefined();

			const recB = shared.extensions.get('ext-b');
			expect(recB).toBeDefined();
			expect(recB!.id).toBe('ext-b');
			expect(recB!.definition).toBe(def2);
		});

		it('each extension gets its own invalidation state', () => {
			const { definition: def1 } = createFakeExtensionDefinition({ id: 'ext-a' });
			const { definition: def2 } = createFakeExtensionDefinition({ id: 'ext-b' });

			const system = createExtensionSystem(createExtensionSystemOptions([def1, def2]));
			const shared = system.getSharedDataForRenderSystem();

			const recA = shared.extensions.get('ext-a')!;
			const recB = shared.extensions.get('ext-b')!;

			recA.invalidation.markDirty(1);
			expect(recA.invalidation.dirtyLayers).toBe(1);
			expect(recB.invalidation.dirtyLayers).toBe(0);
		});

		it('each extension gets its own animation controller', () => {
			const { definition: def1 } = createFakeExtensionDefinition({ id: 'ext-a' });
			const { definition: def2 } = createFakeExtensionDefinition({ id: 'ext-b' });

			const system = createExtensionSystem(createExtensionSystemOptions([def1, def2]));
			const shared = system.getSharedDataForRenderSystem();

			const recA = shared.extensions.get('ext-a')!;
			const recB = shared.extensions.get('ext-b')!;

			recA.animation.submit({ duration: 100 });
			expect(recA.animation.getAll()).toHaveLength(1);
			expect(recB.animation.getAll()).toHaveLength(0);
		});
	});

	describe('getPublicRecord', () => {
		it('includes extensions that expose getPublic()', () => {
			const { definition } = createFakeExtensionDefinition({
				id: 'pub-ext',
				hasPublic: true,
				publicValue: { hello: 'world' }
			});

			const system = createExtensionSystem(createExtensionSystemOptions([definition]));
			const publicRecord = system.getPublicRecord();

			expect(publicRecord['pub-ext']).toEqual({ hello: 'world' });
		});

		it('omits extensions without getPublic()', () => {
			const { definition } = createFakeExtensionDefinition({
				id: 'no-pub',
				hasPublic: false
			});

			const system = createExtensionSystem(createExtensionSystemOptions([definition]));
			const publicRecord = system.getPublicRecord();

			expect('no-pub' in publicRecord).toBe(false);
		});

		it('mixes public and non-public extensions correctly', () => {
			const { definition: pubDef } = createFakeExtensionDefinition({
				id: 'pub',
				hasPublic: true,
				publicValue: 42
			});
			const { definition: noPubDef } = createFakeExtensionDefinition({
				id: 'nopub',
				hasPublic: false
			});

			const system = createExtensionSystem(createExtensionSystemOptions([pubDef, noPubDef]));
			const publicRecord = system.getPublicRecord();

			expect(publicRecord['pub']).toBe(42);
			expect('nopub' in publicRecord).toBe(false);
		});
	});

	describe('getSharedDataForRenderSystem', () => {
		it('exposes the extensions map', () => {
			const { definition } = createFakeExtensionDefinition({ id: 'ext-a' });
			const system = createExtensionSystem(createExtensionSystemOptions([definition]));
			const shared = system.getSharedDataForRenderSystem();

			expect(shared.extensions).toBeInstanceOf(Map);
			expect(shared.extensions.size).toBe(1);
			expect(shared.extensions.has('ext-a')).toBe(true);
		});

		it('exposes the transient visuals subscribers set (initially empty)', () => {
			const { definition } = createFakeExtensionDefinition({ id: 'ext-a' });
			const system = createExtensionSystem(createExtensionSystemOptions([definition]));
			const shared = system.getSharedDataForRenderSystem();

			expect(shared.transientVisualsSubscribers).toBeInstanceOf(Set);
			expect(shared.transientVisualsSubscribers.size).toBe(0);
		});

		it('returns the same reference on repeated calls', () => {
			const { definition } = createFakeExtensionDefinition({ id: 'ext-a' });
			const system = createExtensionSystem(createExtensionSystemOptions([definition]));

			const shared1 = system.getSharedDataForRenderSystem();
			const shared2 = system.getSharedDataForRenderSystem();

			expect(shared1.extensions).toBe(shared2.extensions);
			expect(shared1.transientVisualsSubscribers).toBe(shared2.transientVisualsSubscribers);
		});
	});

	describe('hasSubmittedAnimations', () => {
		it('is false when no extension has submitted animation sessions', () => {
			const { definition } = createFakeExtensionDefinition({ id: 'ext-a' });
			const system = createExtensionSystem(createExtensionSystemOptions([definition]));

			expect(system.hasSubmittedAnimations).toBe(false);
		});

		it('is true when any extension animation controller has a submitted session', () => {
			const { definition } = createFakeExtensionDefinition({ id: 'ext-a' });
			const system = createExtensionSystem(createExtensionSystemOptions([definition]));
			const shared = system.getSharedDataForRenderSystem();

			shared.extensions.get('ext-a')!.animation.submit({ duration: 200 });

			expect(system.hasSubmittedAnimations).toBe(true);
		});

		it('is false when submitted sessions are cancelled', () => {
			const { definition } = createFakeExtensionDefinition({ id: 'ext-a' });
			const system = createExtensionSystem(createExtensionSystemOptions([definition]));
			const shared = system.getSharedDataForRenderSystem();

			const controller = shared.extensions.get('ext-a')!.animation;
			const session = controller.submit({ duration: 200 });
			controller.cancel(session.id);

			expect(system.hasSubmittedAnimations).toBe(false);
		});

		it('is true when only one of multiple extensions has a submitted session', () => {
			const { definition: def1 } = createFakeExtensionDefinition({ id: 'ext-a' });
			const { definition: def2 } = createFakeExtensionDefinition({ id: 'ext-b' });
			const system = createExtensionSystem(createExtensionSystemOptions([def1, def2]));
			const shared = system.getSharedDataForRenderSystem();

			shared.extensions.get('ext-b')!.animation.submit({ duration: 100 });

			expect(system.hasSubmittedAnimations).toBe(true);
		});
	});

	describe('currentFrame', () => {
		it('starts as null', () => {
			const { definition } = createFakeExtensionDefinition({ id: 'ext-a' });
			const system = createExtensionSystem(createExtensionSystemOptions([definition]));

			expect(system.currentFrame).toBeNull();
		});
	});
});
