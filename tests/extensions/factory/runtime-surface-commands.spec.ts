import { describe, expect, it, vi } from 'vitest';
import { createExtensionRuntimeSurface } from '../../../src/extensions/factory/runtime.js';
import {
	createFakeExtensionDef,
	createFakeExtensionRecord,
	createInternalState,
	createMockCommandsSurface,
	createMockEventsSurface
} from '../../test-utils/extensions/runtime-surface.js';

describe('createExtensionRuntimeSurface – commands', () => {
	it('startDrag injects owner from extensionDef.id', () => {
		const record = createFakeExtensionRecord('my-ext', { hasCompleteDrag: true });
		const internalState = createInternalState([record]);
		const rawCommands = createMockCommandsSurface();
		const events = createMockEventsSurface();
		const extDef = createFakeExtensionDef('my-ext');

		const surface = createExtensionRuntimeSurface(() => internalState, rawCommands, events, extDef);

		surface.commands.startDrag({
			type: 'lifted-piece-drag',
			sourceSquare: 4,
			sourcePieceCode: 9,
			targetSquare: 12
		} as never);

		expect(rawCommands.startDrag).toHaveBeenCalledTimes(1);
		const passedSession = (rawCommands.startDrag as ReturnType<typeof vi.fn>).mock.calls[0][0];
		expect(passedSession.owner).toBe('my-ext');
	});

	it('startDrag preserves input drag session fields', () => {
		const record = createFakeExtensionRecord('my-ext', { hasCompleteDrag: true });
		const internalState = createInternalState([record]);
		const rawCommands = createMockCommandsSurface();
		const events = createMockEventsSurface();
		const extDef = createFakeExtensionDef('my-ext');

		const surface = createExtensionRuntimeSurface(() => internalState, rawCommands, events, extDef);

		const inputSession = {
			type: 'release-targeting' as const,
			sourceSquare: 10,
			sourcePieceCode: null,
			targetSquare: 20
		};
		surface.commands.startDrag(inputSession as never);

		const passedSession = (rawCommands.startDrag as ReturnType<typeof vi.fn>).mock.calls[0][0];
		expect(passedSession.type).toBe('release-targeting');
		expect(passedSession.sourceSquare).toBe(10);
		expect(passedSession.sourcePieceCode).toBeNull();
		expect(passedSession.targetSquare).toBe(20);
	});

	it('startDrag throws if extension record has no completeDrag handler', () => {
		const record = createFakeExtensionRecord('my-ext', { hasCompleteDrag: false });
		const internalState = createInternalState([record]);
		const rawCommands = createMockCommandsSurface();
		const events = createMockEventsSurface();
		const extDef = createFakeExtensionDef('my-ext');

		const surface = createExtensionRuntimeSurface(() => internalState, rawCommands, events, extDef);

		expect(() =>
			surface.commands.startDrag({
				type: 'lifted-piece-drag',
				sourceSquare: 4,
				sourcePieceCode: 9,
				targetSquare: 12
			} as never)
		).toThrow();
	});

	it('startDrag throws if extension record is missing from internal state', () => {
		const internalState = createInternalState([]);
		const rawCommands = createMockCommandsSurface();
		const events = createMockEventsSurface();
		const extDef = createFakeExtensionDef('missing-ext');

		const surface = createExtensionRuntimeSurface(() => internalState, rawCommands, events, extDef);

		expect(() =>
			surface.commands.startDrag({
				type: 'lifted-piece-drag',
				sourceSquare: 0,
				sourcePieceCode: 1,
				targetSquare: 8
			} as never)
		).toThrow();
	});

	it('other command methods pass through to raw commands surface', () => {
		const record = createFakeExtensionRecord('my-ext');
		const internalState = createInternalState([record]);
		const rawCommands = createMockCommandsSurface();
		const events = createMockEventsSurface();
		const extDef = createFakeExtensionDef('my-ext');

		const surface = createExtensionRuntimeSurface(() => internalState, rawCommands, events, extDef);

		surface.commands.setPosition({} as never);
		expect(rawCommands.setPosition).toHaveBeenCalledTimes(1);

		surface.commands.clearActiveInteraction();
		expect(rawCommands.clearActiveInteraction).toHaveBeenCalledTimes(1);

		surface.commands.requestRender({ state: true });
		expect(rawCommands.requestRender).toHaveBeenCalledWith({ state: true });
	});
});
