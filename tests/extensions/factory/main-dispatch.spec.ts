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

describe('createExtensionSystem – onUIMoveRequest dispatch', () => {
	it('calls onUIMoveRequest on extensions that define it', () => {
		const onUIMoveRequest = vi.fn();
		const def: AnyExtensionDefinition = {
			id: 'ext-a',
			slots: [],
			createInstance: () => ({ id: 'ext-a', onUIMoveRequest }) as unknown as AnyExtensionInstance
		};
		const system = createExtensionSystem(createExtensionSystemOptions([def]));

		const context = { request: {} as never };
		system.onUIMoveRequest(context);

		expect(onUIMoveRequest).toHaveBeenCalledTimes(1);
	});

	it('skips extensions without onUIMoveRequest', () => {
		const def: AnyExtensionDefinition = {
			id: 'ext-a',
			slots: [],
			createInstance: () => ({ id: 'ext-a' }) as unknown as AnyExtensionInstance
		};
		const system = createExtensionSystem(createExtensionSystemOptions([def]));

		expect(() => system.onUIMoveRequest({ request: {} as never })).not.toThrow();
	});

	it('passes the same context object to all handlers', () => {
		const onUIMoveA = vi.fn();
		const onUIMoveB = vi.fn();
		const defA: AnyExtensionDefinition = {
			id: 'ext-a',
			slots: [],
			createInstance: () =>
				({ id: 'ext-a', onUIMoveRequest: onUIMoveA }) as unknown as AnyExtensionInstance
		};
		const defB: AnyExtensionDefinition = {
			id: 'ext-b',
			slots: [],
			createInstance: () =>
				({ id: 'ext-b', onUIMoveRequest: onUIMoveB }) as unknown as AnyExtensionInstance
		};
		const system = createExtensionSystem(createExtensionSystemOptions([defA, defB]));

		const context = { request: {} as never };
		system.onUIMoveRequest(context);

		expect(onUIMoveA).toHaveBeenCalledWith(context);
		expect(onUIMoveB).toHaveBeenCalledWith(context);
	});
});

describe('createExtensionSystem – onEvent dispatch', () => {
	it('calls onEvent only for extensions subscribed to the given event type', () => {
		const onEventA = vi.fn();
		const onEventB = vi.fn();
		let surfaceA: { events: { subscribeEvent: (t: string) => void } } | null = null;
		const defA: AnyExtensionDefinition = {
			id: 'ext-a',
			slots: [],
			createInstance(opts) {
				surfaceA = opts.runtimeSurface as typeof surfaceA;
				return { id: 'ext-a', onEvent: onEventA } as unknown as AnyExtensionInstance;
			}
		};
		const defB: AnyExtensionDefinition = {
			id: 'ext-b',
			slots: [],
			createInstance() {
				return { id: 'ext-b', onEvent: onEventB } as unknown as AnyExtensionInstance;
			}
		};
		const system = createExtensionSystem(createExtensionSystemOptions([defA, defB]));

		surfaceA!.events.subscribeEvent('pointerdown');

		const eventContext = {
			rawEvent: new Event('pointerdown'),
			sceneEvent: null
		};
		system.onEvent(eventContext);

		expect(onEventA).toHaveBeenCalledTimes(1);
		expect(onEventA).toHaveBeenCalledWith(eventContext);
		expect(onEventB).not.toHaveBeenCalled();
	});

	it('does nothing when no extensions are subscribed to the event type', () => {
		const onEvent = vi.fn();
		const def: AnyExtensionDefinition = {
			id: 'ext-a',
			slots: [],
			createInstance: () => ({ id: 'ext-a', onEvent }) as unknown as AnyExtensionInstance
		};
		const system = createExtensionSystem(createExtensionSystemOptions([def]));

		system.onEvent({ rawEvent: new Event('click'), sceneEvent: null });

		expect(onEvent).not.toHaveBeenCalled();
	});
});

describe('createExtensionSystem – completeDrag dispatch', () => {
	it('calls completeDrag on the owning extension', () => {
		const completeDrag = vi.fn();
		const def: AnyExtensionDefinition = {
			id: 'ext-a',
			slots: [],
			createInstance: () => ({ id: 'ext-a', completeDrag }) as unknown as AnyExtensionInstance
		};
		const system = createExtensionSystem(createExtensionSystemOptions([def]));

		const session = {
			owner: 'ext-a',
			type: 'lifted-piece-drag' as const,
			sourceSquare: 0,
			sourcePieceCode: 1,
			targetSquare: 8
		};
		system.completeDrag(session as never);

		expect(completeDrag).toHaveBeenCalledTimes(1);
		expect(completeDrag).toHaveBeenCalledWith(session);
	});

	it('throws if the owning extension record does not exist', () => {
		const { definition } = createFakeExtensionDefinition({ id: 'ext-a' });
		const system = createExtensionSystem(createExtensionSystemOptions([definition]));

		const session = { owner: 'nonexistent', type: 'lifted-piece-drag' };
		expect(() => system.completeDrag(session as never)).toThrow();
	});

	it('throws if the owning extension has no completeDrag handler', () => {
		const def: AnyExtensionDefinition = {
			id: 'ext-a',
			slots: [],
			createInstance: () => ({ id: 'ext-a' }) as unknown as AnyExtensionInstance
		};
		const system = createExtensionSystem(createExtensionSystemOptions([def]));

		const session = { owner: 'ext-a', type: 'lifted-piece-drag' };
		expect(() => system.completeDrag(session as never)).toThrow();
	});
});
