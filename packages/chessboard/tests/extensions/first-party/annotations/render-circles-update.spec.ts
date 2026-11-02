import { describe, expect, it, vi } from 'vitest';
import { createAnnotations } from '../../../../src/extensions/first-party/annotations/factory.js';
import { DirtyLayer } from '../../../../src/extensions/first-party/annotations/types/internal.js';
import {
	createMockMutation,
	createMockRuntimeSurface,
	createRenderableUpdateContext,
	setupMountedInstance
} from '../../../test-utils/extensions/first-party/annotations/helpers.js';
import { createMockExtensionCreateInstanceOptions } from '../../../test-utils/extensions/factory.js';

describe('annotations — onUpdate for layout geometry refresh', () => {
	describe('marks COMMITTED dirty on layout.refreshGeometry', () => {
		it('marks dirty when mutation includes layout.refreshGeometry and frame is renderable', () => {
			const { instance } = setupMountedInstance();

			const { context, markDirty } = createRenderableUpdateContext({
				causes: ['layout.refreshGeometry']
			});

			instance.onUpdate!(context);

			expect(markDirty).toHaveBeenCalledTimes(1);
			expect(markDirty).toHaveBeenCalledWith(DirtyLayer.COMMITTED);
		});
	});

	describe('does not mark dirty for unrelated mutations', () => {
		it('ignores state.board.setPosition', () => {
			const { instance } = setupMountedInstance();

			const { context, markDirty } = createRenderableUpdateContext({
				causes: ['state.board.setPosition']
			});

			instance.onUpdate!(context);

			expect(markDirty).not.toHaveBeenCalled();
		});

		it('ignores state.interaction.setSelectedSquare', () => {
			const { instance } = setupMountedInstance();

			const { context, markDirty } = createRenderableUpdateContext({
				causes: ['state.interaction.setSelectedSquare']
			});

			instance.onUpdate!(context);

			expect(markDirty).not.toHaveBeenCalled();
		});

		it('ignores empty mutation list', () => {
			const { instance } = setupMountedInstance();

			const { context, markDirty } = createRenderableUpdateContext({
				causes: []
			});

			instance.onUpdate!(context);

			expect(markDirty).not.toHaveBeenCalled();
		});
	});

	describe('does not mark dirty when frame is not renderable', () => {
		it('ignores layout.refreshGeometry when unmounted', () => {
			const def = createAnnotations();
			const surface = createMockRuntimeSurface();
			const instance = def.createInstance(
				createMockExtensionCreateInstanceOptions({ runtimeSurface: surface })
			);

			const markDirty = vi.fn();
			const context = {
				previousFrame: null,
				mutation: createMockMutation(['layout.refreshGeometry']),
				currentFrame: { isMounted: false, state: {} },
				invalidation: { dirtyLayers: 0, markDirty, clearDirty: vi.fn(), clear: vi.fn() }
			} as never;

			instance.onUpdate!(context);

			expect(markDirty).not.toHaveBeenCalled();
		});
	});
});
