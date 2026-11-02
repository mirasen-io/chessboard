import { describe, expect, it } from 'vitest';
import { DirtyLayer } from '../../../../src/extensions/first-party/annotations/types/internal.js';
import {
	createRenderContext,
	createSlotRoots,
	setupMountedInstance
} from '../../../test-utils/extensions/first-party/annotations/helpers.js';

describe('annotations — committed circle lifecycle', () => {
	describe('render does nothing when DirtyLayer.COMMITTED is not set', () => {
		it('does not create SVG elements when dirty layers are 0', () => {
			const { instance, api, roots } = setupMountedInstance();

			api.circle('e4', { color: '#ef4444' });
			instance.render!(createRenderContext({ dirtyLayers: 0 }));

			expect(roots.overPieces.children.length).toBe(0);
		});

		it('does not create SVG elements when only PREVIEW is dirty', () => {
			const { instance, api, roots } = setupMountedInstance();

			api.circle('e4', { color: '#ef4444' });
			instance.render!(createRenderContext({ dirtyLayers: DirtyLayer.PREVIEW }));

			expect(roots.overPieces.children.length).toBe(0);
		});

		it('does not modify existing circles when COMMITTED is not dirty', () => {
			const { instance, api, roots } = setupMountedInstance();

			api.circle('e4', { color: '#ef4444' });
			instance.render!(createRenderContext());
			expect(roots.overPieces.children.length).toBe(1);
			const originalStroke = roots.overPieces.children[0].getAttribute('stroke');

			// Change color but render without COMMITTED dirty
			api.circle('e4', { color: '#3b82f6' });
			instance.render!(createRenderContext({ dirtyLayers: DirtyLayer.PREVIEW }));

			// Element unchanged
			expect(roots.overPieces.children[0].getAttribute('stroke')).toBe(originalStroke);
		});
	});

	describe('unmount clears SVG maps and slot children', () => {
		it('clears slot children on unmount', () => {
			const { instance, api, roots } = setupMountedInstance();

			api.circle('e4', { color: '#ef4444' });
			instance.render!(createRenderContext());
			expect(roots.overPieces.children.length).toBe(1);

			instance.unmount!();

			expect(roots.overPieces.children.length).toBe(0);
		});

		it('preserves semantic annotations after unmount', () => {
			const { instance, api } = setupMountedInstance();

			api.circle('e4', { color: '#ef4444' });
			api.circle('d5', { color: '#3b82f6' });
			instance.render!(createRenderContext());

			instance.unmount!();

			const circles = api.getCircles();
			expect(circles).toHaveLength(2);
			expect(circles).toContainEqual({ square: 'e4', color: '#ef4444' });
			expect(circles).toContainEqual({ square: 'd5', color: '#3b82f6' });
		});
	});

	describe('re-mount and render creates fresh elements', () => {
		it('creates new SVG elements after re-mount', () => {
			const { instance, api, roots } = setupMountedInstance();

			api.circle('e4', { color: '#ef4444' });
			instance.render!(createRenderContext());
			const originalCircle = roots.overPieces.children[0];

			instance.unmount!();

			const newRoots = createSlotRoots();
			instance.mount!({ slotRoots: newRoots } as never);
			instance.render!(createRenderContext());

			expect(newRoots.overPieces.children.length).toBe(1);
			// New element, not the old one
			expect(newRoots.overPieces.children[0]).not.toBe(originalCircle);
		});

		it('renders all annotations after re-mount', () => {
			const { instance, api } = setupMountedInstance();

			api.circle('e4', { color: '#ef4444' });
			api.circle('d5', { color: '#3b82f6' });
			instance.render!(createRenderContext());

			instance.unmount!();

			const newRoots = createSlotRoots();
			instance.mount!({ slotRoots: newRoots } as never);
			instance.render!(createRenderContext());

			expect(newRoots.overPieces.children.length).toBe(2);
		});
	});

	describe('render is safe with no circles', () => {
		it('does not throw when circles map is empty', () => {
			const { instance } = setupMountedInstance();

			expect(() => instance.render!(createRenderContext())).not.toThrow();
		});

		it('leaves slot root empty when no circles exist', () => {
			const { instance, roots } = setupMountedInstance();

			instance.render!(createRenderContext());

			expect(roots.overPieces.children.length).toBe(0);
		});
	});
});
