import { describe, expect, it } from 'vitest';
import { VISUAL_CONFIG } from '../../../../src/extensions/first-party/annotations/constants.js';
import {
	createRenderContext,
	setupMountedInstance,
	SQUARE_SIZE
} from '../../../test-utils/extensions/first-party/annotations/helpers.js';

describe('annotations — committed circle DOM reconciliation', () => {
	describe('circle add creates SVG circle after render', () => {
		it('renders a single circle with correct attributes', () => {
			const { instance, api, roots } = setupMountedInstance();

			api.circle('e4', { color: '#ef4444' });
			instance.render!(createRenderContext());

			expect(roots.overPieces.children.length).toBe(1);
			const circle = roots.overPieces.children[0];
			expect(circle.tagName).toBe('circle');
			expect(circle.getAttribute('fill')).toBe('none');
			expect(circle.getAttribute('stroke')).toBe('#ef4444');

			// e4 = file 4, rank 3 → square index = 3*8 + 4 = 28
			// geometry: x = (28 % 8)*50 = 200, y = floor(28/8)*50 = 150
			// center = (225, 175)
			expect(circle.getAttribute('cx')).toBe('225');
			expect(circle.getAttribute('cy')).toBe('175');

			const expectedRadius = (SQUARE_SIZE * VISUAL_CONFIG.circle.committed.radius).toString();
			expect(circle.getAttribute('r')).toBe(expectedRadius);

			const expectedStrokeWidth = (
				SQUARE_SIZE * VISUAL_CONFIG.circle.committed.strokeWidth
			).toString();
			expect(circle.getAttribute('stroke-width')).toBe(expectedStrokeWidth);
			expect(circle.getAttribute('opacity')).toBe(
				VISUAL_CONFIG.circle.committed.opacity.toString()
			);
			expect(circle.hasAttribute('stroke-opacity')).toBe(false);
		});

		it('sets data-chessboard-id on the circle element', () => {
			const { instance, api, roots } = setupMountedInstance();

			api.circle('e4', { color: '#ef4444' });
			instance.render!(createRenderContext());

			const circle = roots.overPieces.children[0];
			expect(circle.getAttribute('data-chessboard-id')).toMatch(
				/^annotation-circle-committed-\d+$/
			);
		});
	});

	describe('circle replace/update updates existing SVG circle', () => {
		it('updates stroke color without duplicating elements', () => {
			const { instance, api, roots } = setupMountedInstance();

			api.circle('e4', { color: '#ef4444' });
			instance.render!(createRenderContext());
			expect(roots.overPieces.children.length).toBe(1);
			const circle = roots.overPieces.children[0];

			api.circle('e4', { color: '#3b82f6' });
			instance.render!(createRenderContext());

			expect(roots.overPieces.children.length).toBe(1);
			// Same element reference (updated in place)
			expect(roots.overPieces.children[0]).toBe(circle);
			expect(circle.getAttribute('stroke')).toBe('#3b82f6');
		});
	});

	describe('circle remove removes SVG circle', () => {
		it('removes the SVG element when circle is deleted', () => {
			const { instance, api, roots } = setupMountedInstance();

			api.circle('e4', { color: '#ef4444' });
			instance.render!(createRenderContext());
			expect(roots.overPieces.children.length).toBe(1);

			api.circle('e4', null);
			instance.render!(createRenderContext());

			expect(roots.overPieces.children.length).toBe(0);
		});
	});

	describe('clear removes all committed circle SVG elements', () => {
		it('removes all circles after clear()', () => {
			const { instance, api, roots } = setupMountedInstance();

			api.circle('e4', { color: '#ef4444' });
			api.circle('d5', { color: '#3b82f6' });
			api.circle('a1', { color: '#22c55e' });
			instance.render!(createRenderContext());
			expect(roots.overPieces.children.length).toBe(3);

			api.clear();
			instance.render!(createRenderContext());

			expect(roots.overPieces.children.length).toBe(0);
		});
	});

	describe('multiple circles render correctly', () => {
		it('renders the correct number of circles with distinct positions', () => {
			const { instance, api, roots } = setupMountedInstance();

			api.circle('a1', { color: '#ff0000' });
			api.circle('h8', { color: '#00ff00' });
			api.circle('e4', { color: '#0000ff' });
			instance.render!(createRenderContext());

			expect(roots.overPieces.children.length).toBe(3);

			for (let i = 0; i < roots.overPieces.children.length; i++) {
				expect(roots.overPieces.children[i].tagName).toBe('circle');
			}

			// All positions are distinct
			const positions = new Set<string>();
			for (let i = 0; i < roots.overPieces.children.length; i++) {
				const el = roots.overPieces.children[i];
				positions.add(`${el.getAttribute('cx')},${el.getAttribute('cy')}`);
			}
			expect(positions.size).toBe(3);
		});
	});

	describe('keyed reconciliation', () => {
		it('does not rebuild all elements when adding a new circle', () => {
			const { instance, api, roots } = setupMountedInstance();

			api.circle('a1', { color: '#ff0000' });
			instance.render!(createRenderContext());
			const firstCircle = roots.overPieces.children[0];

			api.circle('h8', { color: '#00ff00' });
			instance.render!(createRenderContext());

			expect(roots.overPieces.children.length).toBe(2);
			// Original element still present (same reference)
			expect(roots.overPieces.children[0]).toBe(firstCircle);
		});

		it('only removes the targeted circle, leaving others intact', () => {
			const { instance, api, roots } = setupMountedInstance();

			api.circle('a1', { color: '#ff0000' });
			api.circle('h8', { color: '#00ff00' });
			api.circle('e4', { color: '#0000ff' });
			instance.render!(createRenderContext());
			expect(roots.overPieces.children.length).toBe(3);

			const remainingBefore = [roots.overPieces.children[0], roots.overPieces.children[2]];

			api.circle('h8', null);
			instance.render!(createRenderContext());

			expect(roots.overPieces.children.length).toBe(2);
			// The other two remain (by reference)
			expect(roots.overPieces.children[0]).toBe(remainingBefore[0]);
			expect(roots.overPieces.children[1]).toBe(remainingBefore[1]);
		});
	});

	describe('arrows do not interfere with circle slot assertions', () => {
		it('circles render in overPieces even when arrows are present', () => {
			const { instance, api, roots } = setupMountedInstance();

			api.circle('e4', { color: '#ef4444' });
			api.arrow('e2', 'e4', { color: '#ff0000' });
			instance.render!(createRenderContext());

			// At least one circle element exists
			const circles = Array.from(roots.overPieces.children).filter((el) => el.tagName === 'circle');
			expect(circles.length).toBe(1);
		});
	});
});
