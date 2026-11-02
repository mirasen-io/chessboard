import { describe, expect, it } from 'vitest';
import {
	rendererAnimationPrepare,
	rendererAnimationRender
} from '../../../../../src/extensions/first-party/main-renderer/animation/render.js';
import { PieceCode, type Square } from '../../../../../src/state/board/types/internal.js';
import { createSvgElement } from '../../../../test-utils/dom/svg.js';
import {
	createAnimationInternalState,
	createAnimationPrepareContext,
	createAnimationRenderContext,
	createMockAnimationRuntimeSurface,
	createSimpleMovePlan
} from '../../../../test-utils/extensions/first-party/main-renderer/animation.js';

function createLayer(): SVGGElement {
	return createSvgElement('g');
}

function prepareEntry(
	state: ReturnType<typeof createAnimationInternalState>,
	sessionId: number,
	layer: SVGGElement
) {
	const ctx = createAnimationPrepareContext({ submittedSessions: [{ id: sessionId }] });
	rendererAnimationPrepare(state, ctx, layer);
}

describe('rendererAnimationRender – active sessions', () => {
	it('updates node position based on progress', () => {
		const { surface } = createMockAnimationRuntimeSurface();
		const state = createAnimationInternalState(surface);
		// Move from sq 0 (file=0, rank=0) to sq 7 (file=7, rank=0)
		// In white orientation 400px: sq 0 = x:0, y:350; sq 7 = x:350, y:350
		const plan = createSimpleMovePlan(0 as Square, 7 as Square, PieceCode.WhiteRook);
		state.entries.set(1, { plan, nodes: null });

		const layer = createLayer();
		prepareEntry(state, 1, layer);

		// Render at progress 0 — should be at source position
		const renderCtx0 = createAnimationRenderContext({
			activeSessions: [{ id: 1, progress: 0 }]
		});
		rendererAnimationRender(state, renderCtx0);

		const img = layer.children[0];
		expect(img.getAttribute('x')).toBe('0');
		expect(img.getAttribute('y')).toBe('350');
	});

	it('at progress=1, position matches destination square', () => {
		const { surface } = createMockAnimationRuntimeSurface();
		const state = createAnimationInternalState(surface);
		const plan = createSimpleMovePlan(0 as Square, 7 as Square, PieceCode.WhiteRook);
		state.entries.set(1, { plan, nodes: null });

		const layer = createLayer();
		prepareEntry(state, 1, layer);

		const renderCtx = createAnimationRenderContext({
			activeSessions: [{ id: 1, progress: 1 }]
		});
		rendererAnimationRender(state, renderCtx);

		const img = layer.children[0];
		expect(img.getAttribute('x')).toBe('350');
		expect(img.getAttribute('y')).toBe('350');
	});

	it('at progress=0.5, position is midpoint', () => {
		const { surface } = createMockAnimationRuntimeSurface();
		const state = createAnimationInternalState(surface);
		const plan = createSimpleMovePlan(0 as Square, 7 as Square, PieceCode.WhiteRook);
		state.entries.set(1, { plan, nodes: null });

		const layer = createLayer();
		prepareEntry(state, 1, layer);

		const renderCtx = createAnimationRenderContext({
			activeSessions: [{ id: 1, progress: 0.5 }]
		});
		rendererAnimationRender(state, renderCtx);

		const img = layer.children[0];
		expect(img.getAttribute('x')).toBe('175');
		expect(img.getAttribute('y')).toBe('350');
	});
});

describe('rendererAnimationRender – edge cases', () => {
	it('ignores unknown active session ids without throwing', () => {
		const { surface } = createMockAnimationRuntimeSurface();
		const state = createAnimationInternalState(surface);

		const renderCtx = createAnimationRenderContext({
			activeSessions: [{ id: 999, progress: 0.5 }]
		});

		expect(() => rendererAnimationRender(state, renderCtx)).not.toThrow();
	});

	it('ignores entries whose nodes are still null', () => {
		const { surface } = createMockAnimationRuntimeSurface();
		const state = createAnimationInternalState(surface);
		const plan = createSimpleMovePlan();
		state.entries.set(1, { plan, nodes: null }); // not prepared

		const renderCtx = createAnimationRenderContext({
			activeSessions: [{ id: 1, progress: 0.5 }]
		});

		expect(() => rendererAnimationRender(state, renderCtx)).not.toThrow();
	});

	it('does not create additional DOM nodes on repeated render', () => {
		const { surface } = createMockAnimationRuntimeSurface();
		const state = createAnimationInternalState(surface);
		const plan = createSimpleMovePlan(0 as Square, 7 as Square, PieceCode.WhiteRook);
		state.entries.set(1, { plan, nodes: null });

		const layer = createLayer();
		prepareEntry(state, 1, layer);
		const childCountAfterPrepare = layer.children.length;

		// Render multiple times
		const renderCtx = createAnimationRenderContext({
			activeSessions: [{ id: 1, progress: 0.3 }]
		});
		rendererAnimationRender(state, renderCtx);
		rendererAnimationRender(state, renderCtx);

		expect(layer.children.length).toBe(childCountAfterPrepare);
	});
});
