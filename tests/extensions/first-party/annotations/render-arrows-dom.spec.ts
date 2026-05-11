import { describe, expect, it } from 'vitest';
import { VISUAL_CONFIG } from '../../../../src/extensions/first-party/annotations/constants.js';
import {
	createRenderContext,
	setupMountedInstance,
	SQUARE_SIZE
} from '../../../test-utils/extensions/first-party/annotations/helpers.js';

describe('annotations — committed arrow DOM rendering', () => {
	describe('arrow add creates SVG line + marker after render', () => {
		it('renders a line in overPieces and a marker in defs', () => {
			const { instance, api, roots } = setupMountedInstance();

			api.arrow('e2', 'e4', { color: '#ef4444' });
			instance.render!(createRenderContext());

			const lines = Array.from(roots.overPieces.children).filter((el) => el.tagName === 'line');
			expect(lines.length).toBe(1);

			const markers = Array.from(roots.defs.children).filter((el) => el.tagName === 'marker');
			expect(markers.length).toBe(1);
		});

		it('marker contains one path element', () => {
			const { instance, api, roots } = setupMountedInstance();

			api.arrow('e2', 'e4', { color: '#ef4444' });
			instance.render!(createRenderContext());

			const marker = roots.defs.children[0];
			expect(marker.children.length).toBe(1);
			expect(marker.children[0].tagName).toBe('path');
		});

		it('line marker-end references the marker id', () => {
			const { instance, api, roots } = setupMountedInstance();

			api.arrow('e2', 'e4', { color: '#ef4444' });
			instance.render!(createRenderContext());

			const line = roots.overPieces.querySelector('line')!;
			const marker = roots.defs.querySelector('marker')!;
			const markerId = marker.getAttribute('id');

			expect(markerId).toBeTruthy();
			expect(line.getAttribute('marker-end')).toBe(`url(#${markerId})`);
		});

		it('renders marker inside the annotations defs root', () => {
			const { instance, api, roots } = setupMountedInstance();

			api.arrow('e2', 'e4', { color: '#ef4444' });
			instance.render!(createRenderContext());

			const marker = roots.defs.querySelector('marker')!;
			expect(marker).not.toBeNull();
			expect(marker.parentElement).toBe(roots.defs);
			expect(roots.defs.tagName.toLowerCase()).toBe('defs');
		});

		it('marker has expected structural attributes', () => {
			const { instance, api, roots } = setupMountedInstance();

			api.arrow('e2', 'e4', { color: '#ef4444' });
			instance.render!(createRenderContext());

			const marker = roots.defs.children[0];
			expect(marker.getAttribute('orient')).toBe('auto');
			expect(marker.getAttribute('markerUnits')).toBe('strokeWidth');
			expect(marker.getAttribute('overflow')).toBe('visible');
			expect(marker.getAttribute('viewBox')).toBe('0 0 4 4');
		});

		it('line has expected stroke attributes', () => {
			const { instance, api, roots } = setupMountedInstance();

			api.arrow('e2', 'e4', { color: '#ef4444' });
			instance.render!(createRenderContext());

			const line = roots.overPieces.querySelector('line')!;
			expect(line.getAttribute('stroke')).toBe('#ef4444');
			expect(line.getAttribute('stroke-linecap')).toBe('round');

			const expectedStrokeWidth = (
				SQUARE_SIZE * VISUAL_CONFIG.arrow.committed.strokeWidth
			).toString();
			expect(line.getAttribute('stroke-width')).toBe(expectedStrokeWidth);
			expect(line.getAttribute('opacity')).toBe(VISUAL_CONFIG.arrow.committed.opacity.toString());
		});

		it('marker path fill matches arrow color', () => {
			const { instance, api, roots } = setupMountedInstance();

			api.arrow('e2', 'e4', { color: '#3b82f6' });
			instance.render!(createRenderContext());

			const marker = roots.defs.children[0];
			const path = marker.children[0];
			expect(path.getAttribute('fill')).toBe('#3b82f6');
		});

		it('line has data-chessboard-id with arrow key', () => {
			const { instance, api, roots } = setupMountedInstance();

			api.arrow('e2', 'e4', { color: '#ef4444' });
			instance.render!(createRenderContext());

			const line = roots.overPieces.querySelector('line')!;
			expect(line.getAttribute('data-chessboard-id')).toMatch(/^annotation-arrow-committed-\d+$/);
		});

		it('marker has data-chessboard-id with arrow key', () => {
			const { instance, api, roots } = setupMountedInstance();

			api.arrow('e2', 'e4', { color: '#ef4444' });
			instance.render!(createRenderContext());

			const marker = roots.defs.children[0];
			expect(marker.getAttribute('data-chessboard-id')).toMatch(
				/^annotation-arrowhead-committed-\d+$/
			);
		});
	});

	describe('multiple arrows render with distinct markers', () => {
		it('renders correct number of lines and markers', () => {
			const { instance, api, roots } = setupMountedInstance();

			api.arrow('e2', 'e4', { color: '#ff0000' });
			api.arrow('d2', 'd4', { color: '#00ff00' });
			api.arrow('a1', 'h8', { color: '#0000ff' });
			instance.render!(createRenderContext());

			const lines = Array.from(roots.overPieces.children).filter((el) => el.tagName === 'line');
			expect(lines.length).toBe(3);

			const markers = Array.from(roots.defs.children).filter((el) => el.tagName === 'marker');
			expect(markers.length).toBe(3);
		});

		it('each marker has a unique id', () => {
			const { instance, api, roots } = setupMountedInstance();

			api.arrow('e2', 'e4', { color: '#ff0000' });
			api.arrow('d2', 'd4', { color: '#00ff00' });
			instance.render!(createRenderContext());

			const markers = Array.from(roots.defs.children).filter((el) => el.tagName === 'marker');
			const ids = markers.map((m) => m.getAttribute('id'));
			expect(new Set(ids).size).toBe(2);
		});
	});

	describe('circles and arrows coexist', () => {
		it('renders both circles and arrows without conflict', () => {
			const { instance, api, roots } = setupMountedInstance();

			api.circle('e4', { color: '#ff0000' });
			api.arrow('e2', 'e4', { color: '#00ff00' });
			instance.render!(createRenderContext());

			const circles = Array.from(roots.overPieces.children).filter((el) => el.tagName === 'circle');
			const lines = Array.from(roots.overPieces.children).filter((el) => el.tagName === 'line');
			expect(circles.length).toBe(1);
			expect(lines.length).toBe(1);

			// Markers in defs
			const markers = Array.from(roots.defs.children).filter((el) => el.tagName === 'marker');
			expect(markers.length).toBe(1);
		});
	});
});
