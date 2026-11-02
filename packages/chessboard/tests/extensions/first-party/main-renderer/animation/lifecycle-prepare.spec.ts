import { describe, expect, it } from 'vitest';
import { rendererAnimationPrepare } from '../../../../../src/extensions/first-party/main-renderer/animation/render.js';
import { createSvgElement } from '../../../../test-utils/dom/svg.js';
import {
	createAnimationInternalState,
	createAnimationPrepareContext,
	createMockAnimationRuntimeSurface,
	createSimpleMovePlan
} from '../../../../test-utils/extensions/first-party/main-renderer/animation.js';

function createLayer(): SVGGElement {
	return createSvgElement('g');
}

describe('rendererAnimationPrepare – prepares matching entries', () => {
	it('prepares nodes for a submitted session when a matching entry exists', () => {
		const { surface } = createMockAnimationRuntimeSurface();
		const state = createAnimationInternalState(surface);
		const plan = createSimpleMovePlan();
		state.entries.set(1, { plan, nodes: null });

		const layer = createLayer();
		const ctx = createAnimationPrepareContext({ submittedSessions: [{ id: 1 }] });

		rendererAnimationPrepare(state, ctx, layer);

		const entry = state.entries.get(1)!;
		expect(entry.nodes).not.toBeNull();
	});

	it('creates SVG elements in the provided layer', () => {
		const { surface } = createMockAnimationRuntimeSurface();
		const state = createAnimationInternalState(surface);
		const plan = createSimpleMovePlan();
		state.entries.set(1, { plan, nodes: null });

		const layer = createLayer();
		const ctx = createAnimationPrepareContext({ submittedSessions: [{ id: 1 }] });

		rendererAnimationPrepare(state, ctx, layer);

		expect(layer.children.length).toBeGreaterThan(0);
	});

	it('does not prepare the same entry twice when nodes already exist', () => {
		const { surface } = createMockAnimationRuntimeSurface();
		const state = createAnimationInternalState(surface);
		const plan = createSimpleMovePlan();
		state.entries.set(1, { plan, nodes: null });

		const layer = createLayer();
		const ctx = createAnimationPrepareContext({ submittedSessions: [{ id: 1 }] });

		// First prepare
		rendererAnimationPrepare(state, ctx, layer);
		const nodesAfterFirst = state.entries.get(1)!.nodes;
		const childCountAfterFirst = layer.children.length;

		// Second prepare — should not change anything
		rendererAnimationPrepare(state, ctx, layer);
		const nodesAfterSecond = state.entries.get(1)!.nodes;

		expect(nodesAfterSecond).toBe(nodesAfterFirst);
		expect(layer.children.length).toBe(childCountAfterFirst);
	});

	it('ignores unknown submitted session ids without throwing', () => {
		const { surface } = createMockAnimationRuntimeSurface();
		const state = createAnimationInternalState(surface);

		const layer = createLayer();
		const ctx = createAnimationPrepareContext({ submittedSessions: [{ id: 999 }] });

		expect(() => rendererAnimationPrepare(state, ctx, layer)).not.toThrow();
		expect(layer.children.length).toBe(0);
	});

	it('appends nodes to the provided layer element', () => {
		const { surface } = createMockAnimationRuntimeSurface();
		const state = createAnimationInternalState(surface);
		const plan = createSimpleMovePlan();
		state.entries.set(1, { plan, nodes: null });

		const layer = createLayer();
		const ctx = createAnimationPrepareContext({ submittedSessions: [{ id: 1 }] });

		rendererAnimationPrepare(state, ctx, layer);

		for (const child of Array.from(layer.children)) {
			expect(child.parentElement).toBe(layer);
		}
	});
});
