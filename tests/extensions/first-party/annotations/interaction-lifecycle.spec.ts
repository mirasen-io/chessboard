import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_CONFIG } from '../../../../src/extensions/first-party/annotations/constants.js';
import {
	cancelAnnotationsDrag,
	completeAnnotationsDrag
} from '../../../../src/extensions/first-party/annotations/interaction.js';
import type { AnnotationsStateInternal } from '../../../../src/extensions/first-party/annotations/types/main.js';
import type { ExtensionDragSessionSnapshot } from '../../../../src/extensions/types/basic/interaction.js';

function createMockState(): AnnotationsStateInternal {
	return {
		slotRoots: null as never,
		runtimeSurface: {
			commands: {
				startDrag: vi.fn(() => true),
				requestRender: vi.fn(() => true)
			},
			events: { subscribeEvent: vi.fn(), unsubscribeEvent: vi.fn() },
			invalidation: { dirtyLayers: 0, markDirty: vi.fn(), clearDirty: vi.fn(), clear: vi.fn() }
		} as never,
		svg: { svgCircles: new Map(), svgArrows: new Map() },
		annotations: { circles: new Map(), arrows: new Map() },
		config: { ...DEFAULT_CONFIG },
		activeDrawGesture: null
	} as unknown as AnnotationsStateInternal;
}

describe('completeAnnotationsDrag — ext:draw', () => {
	it('clears activeDrawGesture', () => {
		const state = createMockState();
		state.activeDrawGesture = { sourceSquare: 10, color: '#ff0000' };

		const session: ExtensionDragSessionSnapshot = {
			type: 'ext:draw',
			sourceSquare: 10,
			sourcePieceCode: null,
			targetSquare: 20,
			owner: 'annotations'
		} as unknown as ExtensionDragSessionSnapshot;

		completeAnnotationsDrag(state, session);

		expect(state.activeDrawGesture).toBeNull();
	});

	it('does not mutate committed annotations when activeDrawGesture is null', () => {
		const state = createMockState();
		state.annotations.circles.set(0, { key: 0, square: 0, color: '#ff0000' });
		state.annotations.arrows.set(64, { key: 64, from: 1, to: 0, color: '#00ff00' });
		state.activeDrawGesture = null;

		const session: ExtensionDragSessionSnapshot = {
			type: 'ext:draw',
			sourceSquare: 10,
			sourcePieceCode: null,
			targetSquare: 20,
			owner: 'annotations'
		} as unknown as ExtensionDragSessionSnapshot;

		completeAnnotationsDrag(state, session);

		expect(state.annotations.circles.size).toBe(1);
		expect(state.annotations.arrows.size).toBe(1);
	});

	it('does not mutate committed annotations when targetSquare is null', () => {
		const state = createMockState();
		state.annotations.circles.set(0, { key: 0, square: 0, color: '#ff0000' });
		state.activeDrawGesture = { sourceSquare: 10, color: '#ff0000' };

		const session: ExtensionDragSessionSnapshot = {
			type: 'ext:draw',
			sourceSquare: 10,
			sourcePieceCode: null,
			targetSquare: null,
			owner: 'annotations'
		} as unknown as ExtensionDragSessionSnapshot;

		completeAnnotationsDrag(state, session);

		expect(state.annotations.circles.size).toBe(1);
		expect(state.activeDrawGesture).toBeNull();
	});
});

describe('cancelAnnotationsDrag — ext:draw', () => {
	it('clears activeDrawGesture', () => {
		const state = createMockState();
		state.activeDrawGesture = { sourceSquare: 5, color: '#003088' };

		const session: ExtensionDragSessionSnapshot = {
			type: 'ext:draw',
			sourceSquare: 5,
			sourcePieceCode: null,
			targetSquare: 5,
			owner: 'annotations'
		} as unknown as ExtensionDragSessionSnapshot;

		cancelAnnotationsDrag(state, session);

		expect(state.activeDrawGesture).toBeNull();
	});

	it('ext:idle-clear cancel is a no-op', () => {
		const state = createMockState();

		const session: ExtensionDragSessionSnapshot = {
			type: 'ext:idle-clear',
			sourceSquare: 0,
			sourcePieceCode: null,
			targetSquare: 0,
			owner: 'annotations'
		} as unknown as ExtensionDragSessionSnapshot;

		expect(() => cancelAnnotationsDrag(state, session)).not.toThrow();
	});
});
