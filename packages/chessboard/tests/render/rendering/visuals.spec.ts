import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TransientInput } from '../../../src/extensions/types/basic/transient-visuals.js';
import { performRenderTransientVisualsPass } from '../../../src/render/rendering/visuals.js';
import type { RenderSystemInternal } from '../../../src/render/types.js';
import {
	createFakeRenderFrame,
	createFakeRenderInternal
} from '../../test-utils/render/factory.js';

function createFakeTransientInput(): TransientInput {
	return {
		target: null,
		point: { x: 100, y: 150 },
		clampedPoint: { x: 100, y: 150 },
		boardClampedPoint: { x: 100, y: 150 }
	};
}

describe('performRenderTransientVisualsPass', () => {
	let state: RenderSystemInternal;

	beforeEach(() => {
		state = createFakeRenderInternal({
			extensions: [{ id: 'ext-a' }, { id: 'ext-b' }],
			transientVisualsSubscribers: ['ext-a']
		});
		// Set a currentFrame so the guard passes
		state.currentFrame = createFakeRenderFrame();
	});

	describe('guards', () => {
		it('throws when state is not mounted', () => {
			state.container = null;
			const request = createFakeTransientInput();
			expect(() => performRenderTransientVisualsPass(state, request)).toThrow();
		});

		it('throws when currentFrame is null', () => {
			state.currentFrame = null;
			const request = createFakeTransientInput();
			expect(() => performRenderTransientVisualsPass(state, request)).toThrow();
		});

		it('throws when a subscribed extension id is not found in extensions map', () => {
			// Subscribe an id that doesn't exist in extensions
			(state.transientVisualsSubscribers as Set<string>).add('nonexistent');
			const request = createFakeTransientInput();
			expect(() => performRenderTransientVisualsPass(state, request)).toThrow();
		});
	});

	describe('dispatch protocol', () => {
		it('calls renderTransientVisuals on a subscribed extension', () => {
			const request = createFakeTransientInput();
			performRenderTransientVisualsPass(state, request);

			const extA = state.extensions.get('ext-a')!;
			expect(extA.extension.instance.renderTransientVisuals).toHaveBeenCalledOnce();
		});

		it('does NOT call renderTransientVisuals on a non-subscribed extension', () => {
			const request = createFakeTransientInput();
			performRenderTransientVisualsPass(state, request);

			const extB = state.extensions.get('ext-b')!;
			expect(extB.extension.instance.renderTransientVisuals).not.toHaveBeenCalled();
		});

		it('with multiple subscribers, calls renderTransientVisuals on each', () => {
			// Add ext-b as a subscriber too
			(state.transientVisualsSubscribers as Set<string>).add('ext-b');

			const request = createFakeTransientInput();
			performRenderTransientVisualsPass(state, request);

			const extA = state.extensions.get('ext-a')!;
			const extB = state.extensions.get('ext-b')!;
			expect(extA.extension.instance.renderTransientVisuals).toHaveBeenCalledOnce();
			expect(extB.extension.instance.renderTransientVisuals).toHaveBeenCalledOnce();
		});

		it('passes context with currentFrame equal to state.currentFrame', () => {
			const request = createFakeTransientInput();
			performRenderTransientVisualsPass(state, request);

			const extA = state.extensions.get('ext-a')!;
			const mock = extA.extension.instance.renderTransientVisuals as ReturnType<typeof vi.fn>;
			const ctx = mock.mock.calls[0][0];
			expect(ctx.currentFrame).toBe(state.currentFrame);
		});

		it('passes context with transientInput equal to the request', () => {
			const request = createFakeTransientInput();
			performRenderTransientVisualsPass(state, request);

			const extA = state.extensions.get('ext-a')!;
			const mock = extA.extension.instance.renderTransientVisuals as ReturnType<typeof vi.fn>;
			const ctx = mock.mock.calls[0][0];
			expect(ctx.transientInput).toBe(request);
		});

		it('does not throw when extension has no renderTransientVisuals hook', () => {
			// Remove the hook from the subscribed extension
			const extA = state.extensions.get('ext-a')!;
			(extA.extension.instance as unknown as Record<string, unknown>).renderTransientVisuals =
				undefined;

			const request = createFakeTransientInput();
			expect(() => performRenderTransientVisualsPass(state, request)).not.toThrow();
		});
	});
});
