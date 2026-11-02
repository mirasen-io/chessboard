import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { RenderFrameSnapshot } from '../../../src/extensions/types/basic/render.js';
import { checkNeedsRender, performRenderPass } from '../../../src/render/rendering/state.js';
import type { RenderSystemInternal } from '../../../src/render/types.js';
import {
	createFakeRenderFrame,
	createFakeRenderInternal
} from '../../test-utils/render/factory.js';

describe('checkNeedsRender', () => {
	it('returns false when no extensions have dirty layers', () => {
		const state = createFakeRenderInternal({ extensions: [{ id: 'a' }, { id: 'b' }] });
		expect(checkNeedsRender(state)).toBe(false);
	});

	it('returns true when at least one extension has dirty layers', () => {
		const state = createFakeRenderInternal({ extensions: [{ id: 'a' }] });
		const ext = state.extensions.get('a')!;
		(ext.extension.invalidation as { dirtyLayers: number }).dirtyLayers = 1;
		expect(checkNeedsRender(state)).toBe(true);
	});

	it('returns true when only one of multiple extensions is dirty', () => {
		const state = createFakeRenderInternal({ extensions: [{ id: 'a' }, { id: 'b' }] });
		const ext = state.extensions.get('b')!;
		(ext.extension.invalidation as { dirtyLayers: number }).dirtyLayers = 2;
		expect(checkNeedsRender(state)).toBe(true);
	});
});

describe('performRenderPass', () => {
	let state: RenderSystemInternal;

	beforeEach(() => {
		state = createFakeRenderInternal({ extensions: [{ id: 'ext-a' }, { id: 'ext-b' }] });
	});

	describe('guards', () => {
		it('throws when state is not mounted', () => {
			state.container = null;
			const frame = createFakeRenderFrame();
			expect(() => performRenderPass(state, frame)).toThrow();
		});

		it('throws when request is null', () => {
			expect(() => performRenderPass(state, null)).toThrow();
		});

		it('throws when request.layout.geometry is null', () => {
			const frame = createFakeRenderFrame();
			const noGeom = {
				...frame,
				layout: { ...frame.layout, geometry: null }
			} as unknown as RenderFrameSnapshot;
			expect(() => performRenderPass(state, noGeom)).toThrow();
		});
	});

	describe('SVG root sizing', () => {
		it('sets width, height, viewBox on first render', () => {
			const frame = createFakeRenderFrame({ sceneWidth: 320, sceneHeight: 320 });
			// Mark dirty so render actually processes
			const ext = state.extensions.get('ext-a')!;
			(ext.extension.invalidation as { dirtyLayers: number }).dirtyLayers = 1;

			performRenderPass(state, frame);

			const svg = state.svgRoots.svgRoot;
			expect(svg.getAttribute('width')).toBe('320');
			expect(svg.getAttribute('height')).toBe('320');
			expect(svg.getAttribute('viewBox')).toBe('0 0 320 320');
		});

		it('updates width, height, viewBox when scene size changes', () => {
			const frame1 = createFakeRenderFrame({ sceneWidth: 300, sceneHeight: 300 });
			performRenderPass(state, frame1);

			const frame2 = createFakeRenderFrame({ sceneWidth: 500, sceneHeight: 500 });
			performRenderPass(state, frame2);

			const svg = state.svgRoots.svgRoot;
			expect(svg.getAttribute('width')).toBe('500');
			expect(svg.getAttribute('height')).toBe('500');
			expect(svg.getAttribute('viewBox')).toBe('0 0 500 500');
		});

		it('does not update SVG root attrs when scene size is unchanged', () => {
			const frame1 = createFakeRenderFrame({ sceneWidth: 400, sceneHeight: 400 });
			performRenderPass(state, frame1);

			// Set attrs to a known sentinel to detect any update
			state.svgRoots.svgRoot.setAttribute('width', 'sentinel');

			const frame2 = createFakeRenderFrame({ sceneWidth: 400, sceneHeight: 400 });
			performRenderPass(state, frame2);

			// Should remain sentinel because sizes are equal
			expect(state.svgRoots.svgRoot.getAttribute('width')).toBe('sentinel');
		});
	});

	describe('no dirty extensions (early return)', () => {
		it('stores currentFrame even when no extensions are dirty', () => {
			const frame = createFakeRenderFrame();
			performRenderPass(state, frame);
			expect(state.currentFrame).toBe(frame);
		});

		it('does not call render on any extension when none are dirty', () => {
			const frame = createFakeRenderFrame();
			performRenderPass(state, frame);

			for (const ext of state.extensions.values()) {
				expect(ext.extension.instance.render).not.toHaveBeenCalled();
			}
		});
	});

	describe('dirty extension dispatch', () => {
		it('calls render on extensions that have dirty layers', () => {
			const ext = state.extensions.get('ext-a')!;
			(ext.extension.invalidation as { dirtyLayers: number }).dirtyLayers = 1;

			const frame = createFakeRenderFrame();
			performRenderPass(state, frame);

			expect(ext.extension.instance.render).toHaveBeenCalledOnce();
		});

		it('does not call render on extensions with dirtyLayers === 0', () => {
			const extA = state.extensions.get('ext-a')!;
			(extA.extension.invalidation as { dirtyLayers: number }).dirtyLayers = 1;

			const frame = createFakeRenderFrame();
			performRenderPass(state, frame);

			const extB = state.extensions.get('ext-b')!;
			expect(extB.extension.instance.render).not.toHaveBeenCalled();
		});

		it('passes context with currentFrame equal to the request', () => {
			const ext = state.extensions.get('ext-a')!;
			(ext.extension.invalidation as { dirtyLayers: number }).dirtyLayers = 1;

			const frame = createFakeRenderFrame();
			performRenderPass(state, frame);

			const renderMock = ext.extension.instance.render as ReturnType<typeof vi.fn>;
			const ctx = renderMock.mock.calls[0][0];
			expect(ctx.currentFrame).toBe(frame);
		});

		it('passes context with invalidation from the extension record', () => {
			const ext = state.extensions.get('ext-a')!;
			(ext.extension.invalidation as { dirtyLayers: number }).dirtyLayers = 1;

			const frame = createFakeRenderFrame();
			performRenderPass(state, frame);

			const renderMock = ext.extension.instance.render as ReturnType<typeof vi.fn>;
			const ctx = renderMock.mock.calls[0][0];
			expect(ctx.invalidation).toBe(ext.extension.invalidation);
		});

		it('calls invalidation.clear() after render', () => {
			const ext = state.extensions.get('ext-a')!;
			(ext.extension.invalidation as { dirtyLayers: number }).dirtyLayers = 1;

			const frame = createFakeRenderFrame();
			performRenderPass(state, frame);

			expect(ext.extension.invalidation.clear).toHaveBeenCalledOnce();
		});

		it('multiple dirty extensions all get their render called', () => {
			const extA = state.extensions.get('ext-a')!;
			const extB = state.extensions.get('ext-b')!;
			(extA.extension.invalidation as { dirtyLayers: number }).dirtyLayers = 1;
			(extB.extension.invalidation as { dirtyLayers: number }).dirtyLayers = 3;

			const frame = createFakeRenderFrame();
			performRenderPass(state, frame);

			expect(extA.extension.instance.render).toHaveBeenCalledOnce();
			expect(extB.extension.instance.render).toHaveBeenCalledOnce();
		});
	});

	describe('frame storage', () => {
		it('stores currentFrame after dispatching renders', () => {
			const ext = state.extensions.get('ext-a')!;
			(ext.extension.invalidation as { dirtyLayers: number }).dirtyLayers = 1;

			const frame = createFakeRenderFrame();
			performRenderPass(state, frame);

			expect(state.currentFrame).toBe(frame);
		});

		it('stores currentFrame even on a no-dirty early return', () => {
			const frame = createFakeRenderFrame();
			performRenderPass(state, frame);
			expect(state.currentFrame).toBe(frame);
		});
	});
});
