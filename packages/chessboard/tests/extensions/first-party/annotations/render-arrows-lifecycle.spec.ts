import { describe, expect, it } from 'vitest';
import {
	createRenderContext,
	setupMountedInstance
} from '../../../test-utils/extensions/first-party/annotations/helpers.js';

describe('annotations — committed arrow lifecycle', () => {
	describe('unmount clears arrow SVG state', () => {
		it('unmount removes markers from defs via extension cleanup', () => {
			const { instance, api, roots } = setupMountedInstance();

			api.arrow('e2', 'e4', { color: '#ff0000' });
			api.arrow('d2', 'd4', { color: '#00ff00' });
			instance.render!(createRenderContext());

			expect(roots.defs.children.length).toBe(2);

			instance.unmount!();

			// defs markers removed by clearDefinitionSlotChildren
			expect(roots.defs.children.length).toBe(0);
		});

		it('unmount clears overPieces lines', () => {
			const { instance, api, roots } = setupMountedInstance();

			api.arrow('e2', 'e4', { color: '#ff0000' });
			instance.render!(createRenderContext());

			expect(roots.overPieces.querySelector('line')).not.toBeNull();

			instance.unmount!();

			expect(roots.overPieces.children.length).toBe(0);
		});
	});

	describe('destroy clears arrow SVG state', () => {
		it('destroy removes markers from defs', () => {
			const { instance, api, roots } = setupMountedInstance();

			api.arrow('e2', 'e4', { color: '#ff0000' });
			instance.render!(createRenderContext());

			expect(roots.defs.children.length).toBe(1);

			instance.destroy!();

			expect(roots.defs.children.length).toBe(0);
		});
	});
});
