import { describe, expect, it } from 'vitest';
import { createExtensionInvalidationState } from '../../../src/extensions/invalidation/factory.js';

describe('createExtensionInvalidationState', () => {
	it('starts with dirtyLayers = 0', () => {
		const state = createExtensionInvalidationState();
		expect(state.dirtyLayers).toBe(0);
	});

	it('markDirty sets bits via OR', () => {
		const state = createExtensionInvalidationState();
		state.markDirty(0b0010);
		expect(state.dirtyLayers).toBe(0b0010);
	});

	it('repeated markDirty accumulates multiple bits', () => {
		const state = createExtensionInvalidationState();
		state.markDirty(0b0001);
		state.markDirty(0b0100);
		expect(state.dirtyLayers).toBe(0b0101);
	});

	it('markDirty with overlapping bits does not double-count', () => {
		const state = createExtensionInvalidationState();
		state.markDirty(0b0011);
		state.markDirty(0b0010);
		expect(state.dirtyLayers).toBe(0b0011);
	});

	it('clearDirty clears only the requested bits', () => {
		const state = createExtensionInvalidationState();
		state.markDirty(0b1111);
		state.clearDirty(0b0010);
		expect(state.dirtyLayers).toBe(0b1101);
	});

	it('clearDirty does not affect already-clear bits', () => {
		const state = createExtensionInvalidationState();
		state.markDirty(0b1010);
		state.clearDirty(0b0100);
		expect(state.dirtyLayers).toBe(0b1010);
	});

	it('clear resets all dirty layers to 0', () => {
		const state = createExtensionInvalidationState();
		state.markDirty(0b1111);
		state.clear();
		expect(state.dirtyLayers).toBe(0);
	});

	it('dirtyLayers getter reflects current state after mixed operations', () => {
		const state = createExtensionInvalidationState();
		state.markDirty(0b1100);
		state.markDirty(0b0011);
		state.clearDirty(0b0101);
		expect(state.dirtyLayers).toBe(0b1010);
	});
});
