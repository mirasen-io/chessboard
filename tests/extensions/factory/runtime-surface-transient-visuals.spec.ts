import { describe, expect, it } from 'vitest';
import { createExtensionRuntimeSurface } from '../../../src/extensions/factory/runtime.js';
import {
	createFakeExtensionDef,
	createFakeExtensionRecord,
	createInternalState,
	createMockCommandsSurface,
	createMockEventsSurface
} from '../../test-utils/extensions/runtime-surface.js';

describe('createExtensionRuntimeSurface – transient visuals', () => {
	it('subscribe adds the extension id to the transient visuals subscribers set', () => {
		const record = createFakeExtensionRecord('my-ext');
		const internalState = createInternalState([record]);
		const rawCommands = createMockCommandsSurface();
		const rawEvents = createMockEventsSurface();
		const extDef = createFakeExtensionDef('my-ext');

		const surface = createExtensionRuntimeSurface(
			() => internalState,
			rawCommands,
			rawEvents,
			extDef
		);

		surface.transientVisuals.subscribe();

		expect(internalState.transientVisualsSubscribers.has('my-ext')).toBe(true);
		expect(internalState.transientVisualsSubscribers.size).toBe(1);
	});

	it('repeated subscribe does not duplicate the id', () => {
		const record = createFakeExtensionRecord('my-ext');
		const internalState = createInternalState([record]);
		const rawCommands = createMockCommandsSurface();
		const rawEvents = createMockEventsSurface();
		const extDef = createFakeExtensionDef('my-ext');

		const surface = createExtensionRuntimeSurface(
			() => internalState,
			rawCommands,
			rawEvents,
			extDef
		);

		surface.transientVisuals.subscribe();
		surface.transientVisuals.subscribe();

		expect(internalState.transientVisualsSubscribers.size).toBe(1);
	});

	it('unsubscribe removes the extension id from the set', () => {
		const record = createFakeExtensionRecord('my-ext');
		const internalState = createInternalState([record]);
		const rawCommands = createMockCommandsSurface();
		const rawEvents = createMockEventsSurface();
		const extDef = createFakeExtensionDef('my-ext');

		const surface = createExtensionRuntimeSurface(
			() => internalState,
			rawCommands,
			rawEvents,
			extDef
		);

		surface.transientVisuals.subscribe();
		surface.transientVisuals.unsubscribe();

		expect(internalState.transientVisualsSubscribers.has('my-ext')).toBe(false);
		expect(internalState.transientVisualsSubscribers.size).toBe(0);
	});

	it('repeated unsubscribe is a no-op', () => {
		const record = createFakeExtensionRecord('my-ext');
		const internalState = createInternalState([record]);
		const rawCommands = createMockCommandsSurface();
		const rawEvents = createMockEventsSurface();
		const extDef = createFakeExtensionDef('my-ext');

		const surface = createExtensionRuntimeSurface(
			() => internalState,
			rawCommands,
			rawEvents,
			extDef
		);

		surface.transientVisuals.subscribe();
		surface.transientVisuals.unsubscribe();
		surface.transientVisuals.unsubscribe();

		expect(internalState.transientVisualsSubscribers.size).toBe(0);
	});
});
