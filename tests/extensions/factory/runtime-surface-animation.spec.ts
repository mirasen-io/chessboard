import { describe, expect, it } from 'vitest';
import { createExtensionAnimationController } from '../../../src/extensions/animation/factory.js';
import { createExtensionRuntimeSurface } from '../../../src/extensions/factory/runtime.js';
import {
	createFakeExtensionDef,
	createFakeExtensionRecord,
	createInternalState,
	createMockCommandsSurface,
	createMockEventsSurface
} from '../../test-utils/extensions/runtime-surface.js';

describe('createExtensionRuntimeSurface – animation', () => {
	it('submit delegates to the extension record animation controller', () => {
		const animController = createExtensionAnimationController();
		const record = createFakeExtensionRecord('my-ext', { animation: animController });
		const internalState = createInternalState([record]);
		const rawCommands = createMockCommandsSurface();
		const events = createMockEventsSurface();
		const extDef = createFakeExtensionDef('my-ext');

		const surface = createExtensionRuntimeSurface(() => internalState, rawCommands, events, extDef);

		const session = surface.animation.submit({ duration: 300 });

		expect(session).toBeDefined();
		expect(session.duration).toBe(300);
		expect(session.status).toBe('submitted');
		expect(animController.getAll()).toHaveLength(1);
	});

	it('cancel delegates to the extension record animation controller', () => {
		const animController = createExtensionAnimationController();
		const record = createFakeExtensionRecord('my-ext', { animation: animController });
		const internalState = createInternalState([record]);
		const rawCommands = createMockCommandsSurface();
		const events = createMockEventsSurface();
		const extDef = createFakeExtensionDef('my-ext');

		const surface = createExtensionRuntimeSurface(() => internalState, rawCommands, events, extDef);

		const session = surface.animation.submit({ duration: 200 });
		surface.animation.cancel(session.id);

		const all = animController.getAll('cancelled');
		expect(all).toHaveLength(1);
	});

	it('getAll delegates to the extension record animation controller', () => {
		const animController = createExtensionAnimationController();
		const record = createFakeExtensionRecord('my-ext', { animation: animController });
		const internalState = createInternalState([record]);
		const rawCommands = createMockCommandsSurface();
		const events = createMockEventsSurface();
		const extDef = createFakeExtensionDef('my-ext');

		const surface = createExtensionRuntimeSurface(() => internalState, rawCommands, events, extDef);

		surface.animation.submit({ duration: 100 });
		surface.animation.submit({ duration: 200 });

		const all = surface.animation.getAll();
		expect(all).toHaveLength(2);
	});

	it('throws if extension record is missing from internal state', () => {
		const internalState = createInternalState([]);
		const rawCommands = createMockCommandsSurface();
		const events = createMockEventsSurface();
		const extDef = createFakeExtensionDef('missing-ext');

		const surface = createExtensionRuntimeSurface(() => internalState, rawCommands, events, extDef);

		expect(() => surface.animation.submit({ duration: 100 })).toThrow();
		expect(() => surface.animation.cancel(1)).toThrow();
		expect(() => surface.animation.getAll()).toThrow();
	});
});
