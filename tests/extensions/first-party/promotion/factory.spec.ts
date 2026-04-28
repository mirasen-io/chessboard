import { describe, expect, it, vi } from 'vitest';
import { createPromotion } from '../../../../src/extensions/first-party/promotion/factory.js';
import {
	DirtyLayer,
	EXTENSION_ID
} from '../../../../src/extensions/first-party/promotion/types/main.js';
import type { ExtensionRuntimeSurface } from '../../../../src/extensions/types/surface/main.js';
import type { RuntimeReadonlyMutationSession } from '../../../../src/runtime/mutation/types.js';

function createMockMutation(hasCauses: string[] = []): RuntimeReadonlyMutationSession {
	return {
		hasMutation(match?: { causes?: Iterable<string> }) {
			if (!match || !match.causes) return hasCauses.length > 0;
			for (const cause of match.causes) {
				if (hasCauses.includes(cause)) return true;
			}
			return false;
		},
		getPayloads: vi.fn(() => undefined),
		getAll: vi.fn(() => new Map())
	} as unknown as RuntimeReadonlyMutationSession;
}

function createMockRuntimeSurface(): ExtensionRuntimeSurface {
	return {
		commands: {} as never,
		animation: {} as never,
		events: {
			subscribeEvent: vi.fn(),
			unsubscribeEvent: vi.fn()
		},
		transientVisuals: {
			subscribe: vi.fn(),
			unsubscribe: vi.fn()
		}
	};
}

function createSlotRoots() {
	return {
		animation: document.createElementNS('http://www.w3.org/2000/svg', 'g')
	};
}

function createRenderableUpdateContext(opts: {
	causes?: string[];
	deferredUIMoveRequest?: unknown;
}) {
	const markDirty = vi.fn();
	return {
		context: {
			previousFrame: null,
			mutation: createMockMutation(opts.causes ?? []),
			currentFrame: {
				isMounted: true,
				state: {
					change: {
						deferredUIMoveRequest: opts.deferredUIMoveRequest ?? null
					}
				},
				layout: {
					sceneSize: { width: 400, height: 400 },
					orientation: 0,
					geometry: {
						sceneSize: { width: 400, height: 400 },
						boardRect: { x: 0, y: 0, width: 400, height: 400 },
						squareSize: 50,
						orientation: 0,
						getSquareRect: () => ({ x: 0, y: 0, width: 50, height: 50 })
					},
					layoutEpoch: 1
				}
			},
			invalidation: { dirtyLayers: 0, markDirty, clearDirty: vi.fn(), clear: vi.fn() }
		} as never,
		markDirty
	};
}

describe('createPromotion', () => {
	it('creates a definition with the expected extension id', () => {
		const def = createPromotion();
		expect(def.id).toBe(EXTENSION_ID);
		expect(def.id).toBe('promotion');
	});

	it('createInstance returns an instance with expected hooks', () => {
		const def = createPromotion();
		const surface = createMockRuntimeSurface();
		const instance = def.createInstance({ runtimeSurface: surface });
		expect(instance.id).toBe(EXTENSION_ID);
		expect(instance.mount).toBeDefined();
		expect(instance.unmount).toBeDefined();
		expect(instance.destroy).toBeDefined();
		expect(instance.onUpdate).toBeDefined();
		expect(instance.render).toBeDefined();
		expect(instance.onUIMoveRequest).toBeDefined();
		expect(instance.onEvent).toBeDefined();
		expect(instance.renderTransientVisuals).toBeDefined();
	});

	describe('lifecycle', () => {
		it('mount/unmount/destroy works', () => {
			const def = createPromotion();
			const surface = createMockRuntimeSurface();
			const instance = def.createInstance({ runtimeSurface: surface });
			const roots = createSlotRoots();

			instance.mount!({ slotRoots: roots } as never);
			instance.unmount!();
			instance.destroy!();

			expect(roots.animation.children.length).toBe(0);
		});

		it('destroy auto-unmounts if mounted', () => {
			const def = createPromotion();
			const surface = createMockRuntimeSurface();
			const instance = def.createInstance({ runtimeSurface: surface });
			const roots = createSlotRoots();

			instance.mount!({ slotRoots: roots } as never);
			instance.destroy!();

			expect(roots.animation.children.length).toBe(0);
		});
	});

	describe('onUpdate invalidation', () => {
		it('marks dirty when setDeferredUIMoveRequest mutation occurs and frame is renderable', () => {
			const def = createPromotion();
			const surface = createMockRuntimeSurface();
			const instance = def.createInstance({ runtimeSurface: surface });
			instance.mount!({ slotRoots: createSlotRoots() } as never);

			const { context, markDirty } = createRenderableUpdateContext({
				causes: ['state.change.setDeferredUIMoveRequest'],
				deferredUIMoveRequest: { destination: { to: 60, promotedTo: [5, 4, 3, 2] } }
			});

			instance.onUpdate!(context);

			expect(markDirty).toHaveBeenCalledWith(DirtyLayer.Promotion);
		});

		it('marks dirty on layout.refreshGeometry', () => {
			const def = createPromotion();
			const surface = createMockRuntimeSurface();
			const instance = def.createInstance({ runtimeSurface: surface });
			instance.mount!({ slotRoots: createSlotRoots() } as never);

			const { context, markDirty } = createRenderableUpdateContext({
				causes: ['layout.refreshGeometry']
			});

			instance.onUpdate!(context);

			expect(markDirty).toHaveBeenCalledWith(DirtyLayer.Promotion);
		});

		it('does not mark dirty when no relevant mutation occurs', () => {
			const def = createPromotion();
			const surface = createMockRuntimeSurface();
			const instance = def.createInstance({ runtimeSurface: surface });
			instance.mount!({ slotRoots: createSlotRoots() } as never);

			const { context, markDirty } = createRenderableUpdateContext({
				causes: ['state.board.setPosition']
			});

			instance.onUpdate!(context);

			expect(markDirty).not.toHaveBeenCalled();
		});

		it('subscribes to transient visuals and events when deferred request becomes non-null', () => {
			const def = createPromotion();
			const surface = createMockRuntimeSurface();
			const instance = def.createInstance({ runtimeSurface: surface });
			instance.mount!({ slotRoots: createSlotRoots() } as never);

			const { context } = createRenderableUpdateContext({
				causes: ['state.change.setDeferredUIMoveRequest'],
				deferredUIMoveRequest: { destination: { to: 60, promotedTo: [5, 4, 3, 2] } }
			});

			instance.onUpdate!(context);

			expect(surface.transientVisuals.subscribe).toHaveBeenCalled();
			expect(surface.events.subscribeEvent).toHaveBeenCalledWith('pointerdown');
		});

		it('unsubscribes from transient visuals and events when deferred request becomes null', () => {
			const def = createPromotion();
			const surface = createMockRuntimeSurface();
			const instance = def.createInstance({ runtimeSurface: surface });
			instance.mount!({ slotRoots: createSlotRoots() } as never);

			const { context } = createRenderableUpdateContext({
				causes: ['state.change.setDeferredUIMoveRequest'],
				deferredUIMoveRequest: null
			});

			instance.onUpdate!(context);

			expect(surface.transientVisuals.unsubscribe).toHaveBeenCalled();
			expect(surface.events.unsubscribeEvent).toHaveBeenCalledWith('pointerdown');
		});
	});
});
