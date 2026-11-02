import { describe, expect, it } from 'vitest';
import { createExtensionRuntimeSurface } from '../../../src/extensions/factory/runtime.js';
import {
	createFakeExtensionDef,
	createFakeExtensionRecord,
	createInternalState,
	createMockCommandsSurface,
	createMockEventsSurface
} from '../../test-utils/extensions/runtime-surface.js';

describe('createExtensionRuntimeSurface – invalidation', () => {
	it("markDirty marks only this extension's own bucket", () => {
		const recordA = createFakeExtensionRecord('ext-a');
		const recordB = createFakeExtensionRecord('ext-b');
		const internalState = createInternalState([recordA, recordB]);
		const rawCommands = createMockCommandsSurface();
		const events = createMockEventsSurface();
		const extDefA = createFakeExtensionDef('ext-a');

		const surface = createExtensionRuntimeSurface(
			() => internalState,
			rawCommands,
			events,
			extDefA
		);

		surface.invalidation.markDirty(0b0101);

		expect(recordA.invalidation.dirtyLayers).toBe(0b0101);
		expect(recordB.invalidation.dirtyLayers).toBe(0);
	});

	it("clearDirty clears only this extension's own bucket", () => {
		const recordA = createFakeExtensionRecord('ext-a');
		const recordB = createFakeExtensionRecord('ext-b');
		const internalState = createInternalState([recordA, recordB]);
		const rawCommands = createMockCommandsSurface();
		const events = createMockEventsSurface();
		const extDefA = createFakeExtensionDef('ext-a');

		// Mark both directly on the records
		recordA.invalidation.markDirty(0b1111);
		recordB.invalidation.markDirty(0b1111);

		const surface = createExtensionRuntimeSurface(
			() => internalState,
			rawCommands,
			events,
			extDefA
		);

		surface.invalidation.clearDirty(0b0011);

		expect(recordA.invalidation.dirtyLayers).toBe(0b1100);
		expect(recordB.invalidation.dirtyLayers).toBe(0b1111);
	});

	it("clear clears only this extension's own bucket", () => {
		const recordA = createFakeExtensionRecord('ext-a');
		const recordB = createFakeExtensionRecord('ext-b');
		const internalState = createInternalState([recordA, recordB]);
		const rawCommands = createMockCommandsSurface();
		const events = createMockEventsSurface();
		const extDefA = createFakeExtensionDef('ext-a');

		// Mark both directly on the records
		recordA.invalidation.markDirty(0b1111);
		recordB.invalidation.markDirty(0b1010);

		const surface = createExtensionRuntimeSurface(
			() => internalState,
			rawCommands,
			events,
			extDefA
		);

		surface.invalidation.clear();

		expect(recordA.invalidation.dirtyLayers).toBe(0);
		expect(recordB.invalidation.dirtyLayers).toBe(0b1010);
	});

	it('dirtyLayers reflects the current bucket state', () => {
		const record = createFakeExtensionRecord('ext-a');
		const internalState = createInternalState([record]);
		const rawCommands = createMockCommandsSurface();
		const events = createMockEventsSurface();
		const extDef = createFakeExtensionDef('ext-a');

		const surface = createExtensionRuntimeSurface(() => internalState, rawCommands, events, extDef);

		expect(surface.invalidation.dirtyLayers).toBe(0);

		surface.invalidation.markDirty(0b0110);
		expect(surface.invalidation.dirtyLayers).toBe(0b0110);

		surface.invalidation.clearDirty(0b0010);
		expect(surface.invalidation.dirtyLayers).toBe(0b0100);

		surface.invalidation.clear();
		expect(surface.invalidation.dirtyLayers).toBe(0);
	});

	it('surface works when extension is unmounted (currentFrame is null) if the extension record exists', () => {
		const record = createFakeExtensionRecord('ext-a');
		const internalState = createInternalState([record]);
		// currentFrame is null by default in createInternalState — simulates unmounted
		expect(internalState.currentFrame).toBeNull();

		const rawCommands = createMockCommandsSurface();
		const events = createMockEventsSurface();
		const extDef = createFakeExtensionDef('ext-a');

		const surface = createExtensionRuntimeSurface(() => internalState, rawCommands, events, extDef);

		surface.invalidation.markDirty(0b1001);
		expect(surface.invalidation.dirtyLayers).toBe(0b1001);

		surface.invalidation.clearDirty(0b0001);
		expect(surface.invalidation.dirtyLayers).toBe(0b1000);

		surface.invalidation.clear();
		expect(surface.invalidation.dirtyLayers).toBe(0);
	});

	it('throws if extension record is missing from internal state – dirtyLayers', () => {
		const internalState = createInternalState([]);
		const rawCommands = createMockCommandsSurface();
		const events = createMockEventsSurface();
		const extDef = createFakeExtensionDef('missing-ext');

		const surface = createExtensionRuntimeSurface(() => internalState, rawCommands, events, extDef);

		expect(() => surface.invalidation.dirtyLayers).toThrow();
	});

	it('throws if extension record is missing from internal state – markDirty', () => {
		const internalState = createInternalState([]);
		const rawCommands = createMockCommandsSurface();
		const events = createMockEventsSurface();
		const extDef = createFakeExtensionDef('missing-ext');

		const surface = createExtensionRuntimeSurface(() => internalState, rawCommands, events, extDef);

		expect(() => surface.invalidation.markDirty(1)).toThrow();
	});

	it('throws if extension record is missing from internal state – clearDirty', () => {
		const internalState = createInternalState([]);
		const rawCommands = createMockCommandsSurface();
		const events = createMockEventsSurface();
		const extDef = createFakeExtensionDef('missing-ext');

		const surface = createExtensionRuntimeSurface(() => internalState, rawCommands, events, extDef);

		expect(() => surface.invalidation.clearDirty(1)).toThrow();
	});

	it('throws if extension record is missing from internal state – clear', () => {
		const internalState = createInternalState([]);
		const rawCommands = createMockCommandsSurface();
		const events = createMockEventsSurface();
		const extDef = createFakeExtensionDef('missing-ext');

		const surface = createExtensionRuntimeSurface(() => internalState, rawCommands, events, extDef);

		expect(() => surface.invalidation.clear()).toThrow();
	});

	it('no cross-extension leakage between two surfaces', () => {
		const recordA = createFakeExtensionRecord('ext-a');
		const recordB = createFakeExtensionRecord('ext-b');
		const internalState = createInternalState([recordA, recordB]);
		const rawCommands = createMockCommandsSurface();
		const events = createMockEventsSurface();
		const extDefA = createFakeExtensionDef('ext-a');
		const extDefB = createFakeExtensionDef('ext-b');

		const surfaceA = createExtensionRuntimeSurface(
			() => internalState,
			rawCommands,
			events,
			extDefA
		);
		const surfaceB = createExtensionRuntimeSurface(
			() => internalState,
			rawCommands,
			events,
			extDefB
		);

		surfaceA.invalidation.markDirty(0b0011);
		surfaceB.invalidation.markDirty(0b1100);

		expect(surfaceA.invalidation.dirtyLayers).toBe(0b0011);
		expect(surfaceB.invalidation.dirtyLayers).toBe(0b1100);

		surfaceA.invalidation.clear();

		expect(surfaceA.invalidation.dirtyLayers).toBe(0);
		expect(surfaceB.invalidation.dirtyLayers).toBe(0b1100);
	});
});
