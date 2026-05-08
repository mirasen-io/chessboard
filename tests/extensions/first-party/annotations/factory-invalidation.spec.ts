import { describe, expect, it, vi } from 'vitest';
import { createAnnotations } from '../../../../src/extensions/first-party/annotations/factory.js';
import { DirtyLayer } from '../../../../src/extensions/first-party/annotations/types/internal.js';
import type { ExtensionRuntimeSurface } from '../../../../src/extensions/types/surface/main.js';
import { createMockExtensionCreateInstanceOptions } from '../../../test-utils/extensions/factory.js';

function createMockRuntimeSurface() {
	const markDirty = vi.fn();
	const clearDirty = vi.fn();
	const clear = vi.fn();
	const requestRender = vi.fn(() => true);

	const surface: ExtensionRuntimeSurface = {
		commands: {
			requestRender,
			setPosition: vi.fn(),
			setPiecePosition: vi.fn(),
			setTurn: vi.fn(),
			move: vi.fn(),
			setOrientation: vi.fn(),
			setMovability: vi.fn(),
			select: vi.fn(),
			startDrag: vi.fn(),
			clearActiveInteraction: vi.fn(),
			clearInteraction: vi.fn(),
			resolveDeferredUIMoveRequest: vi.fn(),
			cancelDeferredUIMoveRequest: vi.fn(),
			getSnapshot: vi.fn()
		} as never,
		animation: {} as never,
		events: {
			subscribeEvent: vi.fn(),
			unsubscribeEvent: vi.fn()
		},
		transientVisuals: {
			subscribe: vi.fn(),
			unsubscribe: vi.fn()
		},
		invalidation: {
			get dirtyLayers() {
				return 0;
			},
			markDirty,
			clearDirty,
			clear
		}
	};

	return { surface, markDirty, requestRender };
}

function createAnnotationsWithMockSurface() {
	const def = createAnnotations();
	const { surface, markDirty, requestRender } = createMockRuntimeSurface();
	const instance = def.createInstance(
		createMockExtensionCreateInstanceOptions({ runtimeSurface: surface })
	);
	const api = instance.getPublic();
	return { instance, api, markDirty, requestRender };
}

describe('annotations public API – render invalidation', () => {
	describe('visual mutations mark DirtyLayer.COMMITTED and call requestRender', () => {
		it('setCircles marks dirty and requests render', () => {
			const { api, markDirty, requestRender } = createAnnotationsWithMockSurface();

			api.setCircles([{ square: 'e4', color: '#ff0000' }]);

			expect(markDirty).toHaveBeenCalledTimes(1);
			expect(markDirty).toHaveBeenCalledWith(DirtyLayer.COMMITTED);
			expect(requestRender).toHaveBeenCalledTimes(1);
			expect(requestRender).toHaveBeenCalledWith({ state: true });
		});

		it('setArrows marks dirty and requests render', () => {
			const { api, markDirty, requestRender } = createAnnotationsWithMockSurface();

			api.setArrows([{ from: 'e2', to: 'e4', color: '#00ff00' }]);

			expect(markDirty).toHaveBeenCalledTimes(1);
			expect(markDirty).toHaveBeenCalledWith(DirtyLayer.COMMITTED);
			expect(requestRender).toHaveBeenCalledTimes(1);
			expect(requestRender).toHaveBeenCalledWith({ state: true });
		});

		it('circle add marks dirty and requests render', () => {
			const { api, markDirty, requestRender } = createAnnotationsWithMockSurface();

			api.circle('a1', { color: '#ff0000' });

			expect(markDirty).toHaveBeenCalledTimes(1);
			expect(markDirty).toHaveBeenCalledWith(DirtyLayer.COMMITTED);
			expect(requestRender).toHaveBeenCalledTimes(1);
			expect(requestRender).toHaveBeenCalledWith({ state: true });
		});

		it('circle remove via null marks dirty and requests render', () => {
			const { api, markDirty, requestRender } = createAnnotationsWithMockSurface();

			// Add first, then remove
			api.circle('a1', { color: '#ff0000' });
			markDirty.mockClear();
			requestRender.mockClear();

			api.circle('a1', null);

			expect(markDirty).toHaveBeenCalledTimes(1);
			expect(markDirty).toHaveBeenCalledWith(DirtyLayer.COMMITTED);
			expect(requestRender).toHaveBeenCalledTimes(1);
			expect(requestRender).toHaveBeenCalledWith({ state: true });
		});

		it('arrow add marks dirty and requests render', () => {
			const { api, markDirty, requestRender } = createAnnotationsWithMockSurface();

			api.arrow('e2', 'e4', { color: '#ff0000' });

			expect(markDirty).toHaveBeenCalledTimes(1);
			expect(markDirty).toHaveBeenCalledWith(DirtyLayer.COMMITTED);
			expect(requestRender).toHaveBeenCalledTimes(1);
			expect(requestRender).toHaveBeenCalledWith({ state: true });
		});

		it('arrow remove via null marks dirty and requests render', () => {
			const { api, markDirty, requestRender } = createAnnotationsWithMockSurface();

			// Add first, then remove
			api.arrow('e2', 'e4', { color: '#ff0000' });
			markDirty.mockClear();
			requestRender.mockClear();

			api.arrow('e2', 'e4', null);

			expect(markDirty).toHaveBeenCalledTimes(1);
			expect(markDirty).toHaveBeenCalledWith(DirtyLayer.COMMITTED);
			expect(requestRender).toHaveBeenCalledTimes(1);
			expect(requestRender).toHaveBeenCalledWith({ state: true });
		});

		it('clear marks dirty and requests render', () => {
			const { api, markDirty, requestRender } = createAnnotationsWithMockSurface();

			api.clear();

			expect(markDirty).toHaveBeenCalledTimes(1);
			expect(markDirty).toHaveBeenCalledWith(DirtyLayer.COMMITTED);
			expect(requestRender).toHaveBeenCalledTimes(1);
			expect(requestRender).toHaveBeenCalledWith({ state: true });
		});
	});

	describe('read-only methods do not request render', () => {
		it('getCircles does not request render', () => {
			const { api, markDirty, requestRender } = createAnnotationsWithMockSurface();

			api.getCircles();

			expect(markDirty).not.toHaveBeenCalled();
			expect(requestRender).not.toHaveBeenCalled();
		});

		it('getArrows does not request render', () => {
			const { api, markDirty, requestRender } = createAnnotationsWithMockSurface();

			api.getArrows();

			expect(markDirty).not.toHaveBeenCalled();
			expect(requestRender).not.toHaveBeenCalled();
		});
	});

	describe('behavioral config methods do not request render', () => {
		it('setClearOnCoreInteraction does not mark dirty or request render', () => {
			const { api, markDirty, requestRender } = createAnnotationsWithMockSurface();

			api.setClearOnCoreInteraction(true);

			expect(markDirty).not.toHaveBeenCalled();
			expect(requestRender).not.toHaveBeenCalled();
		});

		it('getClearOnCoreInteraction does not mark dirty or request render', () => {
			const { api, markDirty, requestRender } = createAnnotationsWithMockSurface();

			api.getClearOnCoreInteraction();

			expect(markDirty).not.toHaveBeenCalled();
			expect(requestRender).not.toHaveBeenCalled();
		});
	});

	describe('clearOnCoreInteraction on successful core move completion', () => {
		function createUpdateContext(causes: string[]) {
			const markDirty = vi.fn();
			return {
				context: {
					previousFrame: null,
					mutation: {
						hasMutation(match?: { causes?: Iterable<string> }) {
							if (!match || !match.causes) return causes.length > 0;
							for (const cause of match.causes) {
								if (causes.includes(cause)) return true;
							}
							return false;
						},
						getPayloads: vi.fn(() => undefined),
						getAll: vi.fn(() => new Map())
					},
					currentFrame: {
						isMounted: true,
						state: {},
						layout: {
							sceneSize: { width: 400, height: 400 },
							orientation: 0,
							geometry: null,
							layoutEpoch: 1
						}
					},
					invalidation: { dirtyLayers: 0, markDirty, clearDirty: vi.fn(), clear: vi.fn() }
				} as never,
				markDirty
			};
		}

		it('clears annotations and marks dirty on completeCoreDragTo when clearOnCoreInteraction=true and annotations exist', () => {
			const def = createAnnotations({
				annotations: {
					circles: [{ square: 'e4', color: '#ff0000' }],
					arrows: [{ from: 'a1', to: 'h8', color: '#00ff00' }]
				}
			});
			const { surface } = createMockRuntimeSurface();
			const instance = def.createInstance(
				createMockExtensionCreateInstanceOptions({ runtimeSurface: surface })
			);
			const api = instance.getPublic();

			// Default is clearOnCoreInteraction=true
			expect(api.getClearOnCoreInteraction()).toBe(true);
			expect(api.getCircles()).toHaveLength(1);
			expect(api.getArrows()).toHaveLength(1);

			const { context, markDirty } = createUpdateContext([
				'runtime.interaction.completeCoreDragTo'
			]);
			instance.onUpdate!(context);

			expect(api.getCircles()).toEqual([]);
			expect(api.getArrows()).toEqual([]);
			expect(markDirty).toHaveBeenCalledWith(DirtyLayer.COMMITTED);
		});

		it('does not clear annotations on completeCoreDragTo when clearOnCoreInteraction=false', () => {
			const def = createAnnotations({
				config: { clearOnCoreInteraction: false },
				annotations: {
					circles: [{ square: 'e4', color: '#ff0000' }],
					arrows: [{ from: 'a1', to: 'h8', color: '#00ff00' }]
				}
			});
			const { surface } = createMockRuntimeSurface();
			const instance = def.createInstance(
				createMockExtensionCreateInstanceOptions({ runtimeSurface: surface })
			);
			const api = instance.getPublic();

			const { context, markDirty } = createUpdateContext([
				'runtime.interaction.completeCoreDragTo'
			]);
			instance.onUpdate!(context);

			expect(api.getCircles()).toHaveLength(1);
			expect(api.getArrows()).toHaveLength(1);
			expect(markDirty).not.toHaveBeenCalled();
		});

		it('does not mark dirty on completeCoreDragTo when annotations are empty', () => {
			const def = createAnnotations();
			const { surface } = createMockRuntimeSurface();
			const instance = def.createInstance(
				createMockExtensionCreateInstanceOptions({ runtimeSurface: surface })
			);

			const { context, markDirty } = createUpdateContext([
				'runtime.interaction.completeCoreDragTo'
			]);
			instance.onUpdate!(context);

			expect(markDirty).not.toHaveBeenCalled();
		});

		it('does not clear annotations on unrelated interaction mutations', () => {
			const def = createAnnotations({
				annotations: {
					circles: [{ square: 'e4', color: '#ff0000' }],
					arrows: [{ from: 'a1', to: 'h8', color: '#00ff00' }]
				}
			});
			const { surface } = createMockRuntimeSurface();
			const instance = def.createInstance(
				createMockExtensionCreateInstanceOptions({ runtimeSurface: surface })
			);
			const api = instance.getPublic();

			const { context, markDirty } = createUpdateContext(['state.interaction.setDragSession']);
			instance.onUpdate!(context);

			expect(api.getCircles()).toHaveLength(1);
			expect(api.getArrows()).toHaveLength(1);
			expect(markDirty).not.toHaveBeenCalled();
		});
	});

	describe('annotations do not guard mounted state', () => {
		it('public API mutations unconditionally delegate markDirty and requestRender without a mounted-state guard', () => {
			// This test proves only that the annotations layer itself does NOT add
			// any mounted-state check before calling invalidation.markDirty or
			// commands.requestRender. Whether requestRender is safe to call while
			// unmounted is a runtime-layer concern tested elsewhere.
			const { api, markDirty, requestRender } = createAnnotationsWithMockSurface();

			// Extension is never mounted — just created
			api.setCircles([{ square: 'e4', color: '#f00' }]);
			api.setArrows([{ from: 'a1', to: 'h8', color: '#0f0' }]);
			api.circle('a1', { color: '#f00' });
			api.circle('a1', null);
			api.arrow('e2', 'e4', { color: '#f00' });
			api.arrow('e2', 'e4', null);
			api.clear();

			// All calls went through — annotations does not short-circuit
			expect(markDirty).toHaveBeenCalledTimes(7);
			expect(requestRender).toHaveBeenCalledTimes(7);
		});
	});
});
