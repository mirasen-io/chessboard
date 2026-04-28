import { describe, expect, it, vi } from 'vitest';
import { createExtensionAnimationController } from '../../../src/extensions/animation/factory.js';
import { createExtensionRuntimeSurface } from '../../../src/extensions/factory/runtime.js';
import { createExtensionInvalidationState } from '../../../src/extensions/invalidation/factory.js';
import type { ExtensionAnimationControllerInternalSurface } from '../../../src/extensions/types/basic/animation.js';
import type {
	AnyExtensionDefinition,
	AnyExtensionInstance
} from '../../../src/extensions/types/extension.js';
import type {
	ExtensionSystemExtensionRecord,
	ExtensionSystemInternal
} from '../../../src/extensions/types/main.js';
import type { ExtensionRuntimeSurfaceCommandsInternalSurface } from '../../../src/extensions/types/surface/commands.js';
import type { ExtensionRuntimeSurfaceEvents } from '../../../src/extensions/types/surface/events.js';

// --- Minimal fixtures ---

function createMockCommandsSurface(): ExtensionRuntimeSurfaceCommandsInternalSurface {
	return {
		setPosition: vi.fn(() => true),
		setPiecePosition: vi.fn(() => true),
		setTurn: vi.fn(() => true),
		move: vi.fn(),
		setOrientation: vi.fn(() => true),
		setMovability: vi.fn(() => true),
		select: vi.fn(() => true),
		startDrag: vi.fn(() => true),
		clearActiveInteraction: vi.fn(() => true),
		clearInteraction: vi.fn(() => true),
		resolveDeferredUIMoveRequest: vi.fn(),
		cancelDeferredUIMoveRequest: vi.fn(() => true),
		requestRender: vi.fn(),
		getSnapshot: vi.fn()
	} as unknown as ExtensionRuntimeSurfaceCommandsInternalSurface;
}

function createMockEventsSurface(): ExtensionRuntimeSurfaceEvents {
	return {
		subscribeEvent: vi.fn(),
		unsubscribeEvent: vi.fn()
	};
}

function createFakeExtensionDef(id: string): AnyExtensionDefinition {
	return { id, slots: [], createInstance: vi.fn() };
}

function createFakeExtensionRecord(
	id: string,
	opts: { hasCompleteDrag?: boolean; animation?: ExtensionAnimationControllerInternalSurface } = {}
): ExtensionSystemExtensionRecord {
	const instance: AnyExtensionInstance = {
		id,
		...(opts.hasCompleteDrag ? { completeDrag: vi.fn() } : {})
	} as unknown as AnyExtensionInstance;
	return {
		id,
		definition: createFakeExtensionDef(id),
		instance,
		invalidation: createExtensionInvalidationState(),
		animation: opts.animation ?? createExtensionAnimationController()
	};
}

function createInternalState(records: ExtensionSystemExtensionRecord[]): ExtensionSystemInternal {
	const extensions = new Map<string, ExtensionSystemExtensionRecord>();
	for (const rec of records) {
		extensions.set(rec.id, rec);
	}
	return {
		extensions,
		transientVisualsSubscribers: new Set(),
		eventSubscribers: new Map(),
		currentFrame: null
	};
}

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
		const internalState = createInternalState([]); // no records
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
		const internalState = createInternalState([]); // no records
		const rawCommands = createMockCommandsSurface();
		const events = createMockEventsSurface();
		const extDef = createFakeExtensionDef('missing-ext');

		const surface = createExtensionRuntimeSurface(() => internalState, rawCommands, events, extDef);

		expect(() => surface.animation.submit({ duration: 100 })).toThrow();
		expect(() => surface.animation.cancel(1)).toThrow();
		expect(() => surface.animation.getAll()).toThrow();
	});
});
