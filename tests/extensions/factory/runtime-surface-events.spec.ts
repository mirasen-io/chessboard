import { describe, expect, it } from 'vitest';
import { createExtensionRuntimeSurface } from '../../../src/extensions/factory/runtime.js';
import {
	createFakeExtensionDef,
	createFakeExtensionRecord,
	createInternalState,
	createMockCommandsSurface,
	createMockEventsSurface
} from '../../test-utils/extensions/runtime-surface.js';

describe('createExtensionRuntimeSurface – events', () => {
	describe('subscribeEvent', () => {
		it('adds the extension id to the event subscribers set for that type', () => {
			const record = createFakeExtensionRecord('my-ext', { hasOnEvent: true });
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

			surface.events.subscribeEvent('pointerdown' as never);

			const subscribers = internalState.eventSubscribers.get('pointerdown');
			expect(subscribers).toBeDefined();
			expect(subscribers!.has('my-ext')).toBe(true);
		});

		it('delegates to raw runtime events surface subscribeEvent', () => {
			const record = createFakeExtensionRecord('my-ext', { hasOnEvent: true });
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

			surface.events.subscribeEvent('pointerdown' as never);

			expect(rawEvents.subscribeEvent).toHaveBeenCalledWith('pointerdown');
		});

		it('calls raw subscribeEvent each time even if already subscribed', () => {
			const record = createFakeExtensionRecord('my-ext', { hasOnEvent: true });
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

			surface.events.subscribeEvent('pointerdown' as never);
			surface.events.subscribeEvent('pointerdown' as never);

			expect(rawEvents.subscribeEvent).toHaveBeenCalledTimes(2);
			expect(internalState.eventSubscribers.get('pointerdown')!.size).toBe(1);
		});

		it('throws if extension record is missing', () => {
			const internalState = createInternalState([]);
			const rawCommands = createMockCommandsSurface();
			const rawEvents = createMockEventsSurface();
			const extDef = createFakeExtensionDef('missing-ext');

			const surface = createExtensionRuntimeSurface(
				() => internalState,
				rawCommands,
				rawEvents,
				extDef
			);

			expect(() => surface.events.subscribeEvent('pointerdown' as never)).toThrow();
		});

		it('throws if extension instance has no onEvent handler', () => {
			const record = createFakeExtensionRecord('my-ext', { hasOnEvent: false });
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

			expect(() => surface.events.subscribeEvent('pointerdown' as never)).toThrow();
		});
	});

	describe('unsubscribeEvent', () => {
		it('removes the extension id from event subscribers for that type', () => {
			const record = createFakeExtensionRecord('my-ext', { hasOnEvent: true });
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

			surface.events.subscribeEvent('pointerdown' as never);
			surface.events.unsubscribeEvent('pointerdown' as never);

			expect(internalState.eventSubscribers.has('pointerdown')).toBe(false);
		});

		it('delegates to raw unsubscribeEvent only when last subscriber is removed', () => {
			const recA = createFakeExtensionRecord('ext-a', { hasOnEvent: true });
			const recB = createFakeExtensionRecord('ext-b', { hasOnEvent: true });
			const internalState = createInternalState([recA, recB]);
			const rawCommands = createMockCommandsSurface();
			const rawEvents = createMockEventsSurface();
			const extDefA = createFakeExtensionDef('ext-a');
			const extDefB = createFakeExtensionDef('ext-b');

			const surfaceA = createExtensionRuntimeSurface(
				() => internalState,
				rawCommands,
				rawEvents,
				extDefA
			);
			const surfaceB = createExtensionRuntimeSurface(
				() => internalState,
				rawCommands,
				rawEvents,
				extDefB
			);

			surfaceA.events.subscribeEvent('pointerdown' as never);
			surfaceB.events.subscribeEvent('pointerdown' as never);

			surfaceA.events.unsubscribeEvent('pointerdown' as never);
			expect(rawEvents.unsubscribeEvent).not.toHaveBeenCalled();
			expect(internalState.eventSubscribers.get('pointerdown')!.has('ext-b')).toBe(true);

			surfaceB.events.unsubscribeEvent('pointerdown' as never);
			expect(rawEvents.unsubscribeEvent).toHaveBeenCalledWith('pointerdown');
		});

		it('no-ops when extension was not subscribed for that event type', () => {
			const record = createFakeExtensionRecord('my-ext', { hasOnEvent: true });
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

			expect(() => surface.events.unsubscribeEvent('pointerdown' as never)).not.toThrow();
			expect(rawEvents.unsubscribeEvent).not.toHaveBeenCalled();
		});

		it('no-ops when the event type does not exist in the subscriber map', () => {
			const record = createFakeExtensionRecord('my-ext', { hasOnEvent: true });
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

			expect(() => surface.events.unsubscribeEvent('click' as never)).not.toThrow();
			expect(rawEvents.unsubscribeEvent).not.toHaveBeenCalled();
		});
	});
});
