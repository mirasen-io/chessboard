import { describe, expect, it } from 'vitest';
import {
	rendererAnimationClean,
	rendererAnimationPrepare
} from '../../../../../src/extensions/first-party/main-renderer/animation/render.js';
import { PieceCode, type Square } from '../../../../../src/state/board/types/internal.js';
import { createSvgElement } from '../../../../test-utils/dom/svg.js';
import {
	createAnimationCleanContext,
	createAnimationInternalState,
	createAnimationPrepareContext,
	createMockAnimationRuntimeSurface,
	createSimpleMovePlan
} from '../../../../test-utils/extensions/first-party/main-renderer/animation.js';

function createLayer(): SVGGElement {
	return createSvgElement('g');
}

describe('rendererAnimationClean – cleans prepared entries', () => {
	it('removes DOM nodes for a finished session with prepared nodes', () => {
		const { surface } = createMockAnimationRuntimeSurface();
		const state = createAnimationInternalState(surface);
		const plan = createSimpleMovePlan(0 as Square, 7 as Square, PieceCode.WhiteRook);
		state.entries.set(1, { plan, nodes: null });

		const layer = createLayer();
		// Prepare nodes
		const prepCtx = createAnimationPrepareContext({ submittedSessions: [{ id: 1 }] });
		rendererAnimationPrepare(state, prepCtx, layer);
		expect(layer.children.length).toBeGreaterThan(0);

		// Clean
		const { context: cleanCtx } = createAnimationCleanContext({
			finishedSessions: [{ id: 1, status: 'ended' }]
		});
		rendererAnimationClean(state, cleanCtx);

		expect(layer.children.length).toBe(0);
	});

	it('deletes the entry from state.entries after cleanup', () => {
		const { surface } = createMockAnimationRuntimeSurface();
		const state = createAnimationInternalState(surface);
		const plan = createSimpleMovePlan();
		state.entries.set(1, { plan, nodes: null });

		const layer = createLayer();
		const prepCtx = createAnimationPrepareContext({ submittedSessions: [{ id: 1 }] });
		rendererAnimationPrepare(state, prepCtx, layer);

		const { context: cleanCtx } = createAnimationCleanContext({
			finishedSessions: [{ id: 1, status: 'ended' }]
		});
		rendererAnimationClean(state, cleanCtx);

		expect(state.entries.has(1)).toBe(false);
	});

	it('deletes entry even if nodes is null (not yet prepared)', () => {
		const { surface } = createMockAnimationRuntimeSurface();
		const state = createAnimationInternalState(surface);
		const plan = createSimpleMovePlan();
		state.entries.set(1, { plan, nodes: null });

		const { context: cleanCtx } = createAnimationCleanContext({
			finishedSessions: [{ id: 1, status: 'ended' }]
		});
		rendererAnimationClean(state, cleanCtx);

		expect(state.entries.has(1)).toBe(false);
	});

	it('ignores unknown finished session ids without throwing', () => {
		const { surface } = createMockAnimationRuntimeSurface();
		const state = createAnimationInternalState(surface);

		const { context: cleanCtx } = createAnimationCleanContext({
			finishedSessions: [{ id: 999, status: 'ended' }]
		});

		expect(() => rendererAnimationClean(state, cleanCtx)).not.toThrow();
		expect(state.entries.size).toBe(0);
	});

	it('handles cancelled session status the same as ended', () => {
		const { surface } = createMockAnimationRuntimeSurface();
		const state = createAnimationInternalState(surface);
		const plan = createSimpleMovePlan();
		state.entries.set(1, { plan, nodes: null });

		const layer = createLayer();
		const prepCtx = createAnimationPrepareContext({ submittedSessions: [{ id: 1 }] });
		rendererAnimationPrepare(state, prepCtx, layer);

		const { context: cleanCtx } = createAnimationCleanContext({
			finishedSessions: [{ id: 1, status: 'cancelled' }]
		});
		rendererAnimationClean(state, cleanCtx);

		expect(state.entries.has(1)).toBe(false);
		expect(layer.children.length).toBe(0);
	});
});
