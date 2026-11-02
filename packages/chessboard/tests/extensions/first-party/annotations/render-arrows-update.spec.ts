import { describe, expect, it } from 'vitest';
import { DirtyLayer } from '../../../../src/extensions/first-party/annotations/types/internal.js';
import {
	createRenderContext,
	setupMountedInstance
} from '../../../test-utils/extensions/first-party/annotations/helpers.js';

describe('annotations — committed arrow update reconciliation', () => {
	describe('updating arrow color updates line and marker path', () => {
		it('updates stroke and fill without duplicating elements', () => {
			const { instance, api, roots } = setupMountedInstance();

			api.arrow('e2', 'e4', { color: '#ef4444' });
			instance.render!(createRenderContext());

			const line = roots.overPieces.querySelector('line')!;
			const marker = roots.defs.querySelector('marker')!;
			const path = marker.children[0];

			api.arrow('e2', 'e4', { color: '#3b82f6' });
			instance.render!(createRenderContext());

			// Same element references
			expect(roots.overPieces.querySelector('line')).toBe(line);
			expect(roots.defs.querySelector('marker')).toBe(marker);

			// Updated colors
			expect(line.getAttribute('stroke')).toBe('#3b82f6');
			expect(path.getAttribute('fill')).toBe('#3b82f6');
		});

		it('does not create additional lines or markers on update', () => {
			const { instance, api, roots } = setupMountedInstance();

			api.arrow('e2', 'e4', { color: '#ef4444' });
			instance.render!(createRenderContext());

			api.arrow('e2', 'e4', { color: '#3b82f6' });
			instance.render!(createRenderContext());

			const lines = Array.from(roots.overPieces.children).filter((el) => el.tagName === 'line');
			const markers = Array.from(roots.defs.children).filter((el) => el.tagName === 'marker');
			expect(lines.length).toBe(1);
			expect(markers.length).toBe(1);
		});
	});

	describe('removing an arrow removes both line and marker', () => {
		it('removes line from overPieces and marker from defs', () => {
			const { instance, api, roots } = setupMountedInstance();

			api.arrow('e2', 'e4', { color: '#ef4444' });
			instance.render!(createRenderContext());
			expect(roots.overPieces.querySelector('line')).not.toBeNull();
			expect(roots.defs.querySelector('marker')).not.toBeNull();

			api.arrow('e2', 'e4', null);
			instance.render!(createRenderContext());

			expect(roots.overPieces.querySelector('line')).toBeNull();
			expect(roots.defs.querySelector('marker')).toBeNull();
		});
	});

	describe('clear() removes all arrow elements', () => {
		it('removes all lines and markers after clear', () => {
			const { instance, api, roots } = setupMountedInstance();

			api.arrow('e2', 'e4', { color: '#ff0000' });
			api.arrow('d2', 'd4', { color: '#00ff00' });
			instance.render!(createRenderContext());

			const linesBefore = Array.from(roots.overPieces.children).filter(
				(el) => el.tagName === 'line'
			);
			expect(linesBefore.length).toBe(2);

			api.clear();
			instance.render!(createRenderContext());

			const linesAfter = Array.from(roots.overPieces.children).filter(
				(el) => el.tagName === 'line'
			);
			const markersAfter = Array.from(roots.defs.children).filter((el) => el.tagName === 'marker');
			expect(linesAfter.length).toBe(0);
			expect(markersAfter.length).toBe(0);
		});
	});

	describe('keyed reconciliation preserves existing elements on add', () => {
		it('adding a second arrow does not rebuild the first', () => {
			const { instance, api, roots } = setupMountedInstance();

			api.arrow('e2', 'e4', { color: '#ff0000' });
			instance.render!(createRenderContext());

			const firstLine = roots.overPieces.querySelector('line')!;
			const firstMarker = roots.defs.querySelector('marker')!;

			api.arrow('d2', 'd4', { color: '#00ff00' });
			instance.render!(createRenderContext());

			const lines = Array.from(roots.overPieces.children).filter((el) => el.tagName === 'line');
			expect(lines.length).toBe(2);
			expect(lines[0]).toBe(firstLine);

			const markers = Array.from(roots.defs.children).filter((el) => el.tagName === 'marker');
			expect(markers.length).toBe(2);
			expect(markers[0]).toBe(firstMarker);
		});
	});

	describe('render skips when DirtyLayer.COMMITTED is not set', () => {
		it('does not render arrows when dirty layer is not committed', () => {
			const { instance, api, roots } = setupMountedInstance();

			api.arrow('e2', 'e4', { color: '#ff0000' });
			instance.render!(createRenderContext({ dirtyLayers: DirtyLayer.PREVIEW }));

			const lines = Array.from(roots.overPieces.children).filter((el) => el.tagName === 'line');
			expect(lines.length).toBe(0);
		});
	});
});
