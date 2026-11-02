import { describe, expect, it } from 'vitest';
import { getAnimationSuppressedSquares } from '../../../../../src/extensions/first-party/main-renderer/animation/render.js';
import { PieceCode, type Square } from '../../../../../src/state/board/types/internal.js';
import {
	createAnimationInternalState,
	createMockAnimationRuntimeSurface,
	createSimpleMovePlan
} from '../../../../test-utils/extensions/first-party/main-renderer/animation.js';

describe('getAnimationSuppressedSquares – empty cases', () => {
	it('returns empty set when getAll returns no sessions', () => {
		const { surface, getAll } = createMockAnimationRuntimeSurface();
		const state = createAnimationInternalState(surface);
		getAll.mockReturnValue([]);

		const result = getAnimationSuppressedSquares(state);

		expect(result.size).toBe(0);
	});

	it('returns empty set when returned sessions have no matching entries', () => {
		const { surface, getAll } = createMockAnimationRuntimeSurface();
		const state = createAnimationInternalState(surface);
		getAll.mockReturnValue([{ id: 99, startTime: 0, duration: 180, status: 'submitted' }]);

		const result = getAnimationSuppressedSquares(state);

		expect(result.size).toBe(0);
	});
});

describe('getAnimationSuppressedSquares – returns squares from entries', () => {
	it('returns suppressed squares from a submitted session entry', () => {
		const { surface, getAll } = createMockAnimationRuntimeSurface();
		const state = createAnimationInternalState(surface);
		const plan = createSimpleMovePlan(12 as Square, 28 as Square, PieceCode.WhitePawn);
		state.entries.set(1, { plan, nodes: null });

		getAll.mockReturnValue([{ id: 1, startTime: 0, duration: 180, status: 'submitted' }]);

		const result = getAnimationSuppressedSquares(state);

		expect(result.has(12 as Square)).toBe(true);
		expect(result.has(28 as Square)).toBe(true);
		expect(result.size).toBe(2);
	});

	it('returns suppressed squares from an active session entry', () => {
		const { surface, getAll } = createMockAnimationRuntimeSurface();
		const state = createAnimationInternalState(surface);
		const plan = createSimpleMovePlan(0 as Square, 7 as Square, PieceCode.WhiteRook);
		state.entries.set(1, { plan, nodes: null });

		getAll.mockReturnValue([{ id: 1, startTime: 0, duration: 180, status: 'active' }]);

		const result = getAnimationSuppressedSquares(state);

		expect(result.has(0 as Square)).toBe(true);
		expect(result.has(7 as Square)).toBe(true);
	});

	it('combines suppression from multiple sessions without duplicates', () => {
		const { surface, getAll } = createMockAnimationRuntimeSurface();
		const state = createAnimationInternalState(surface);

		const plan1 = createSimpleMovePlan(0 as Square, 7 as Square, PieceCode.WhiteRook);
		const plan2 = createSimpleMovePlan(7 as Square, 63 as Square, PieceCode.BlackKing);
		state.entries.set(1, { plan: plan1, nodes: null });
		state.entries.set(2, { plan: plan2, nodes: null });

		getAll.mockReturnValue([
			{ id: 1, startTime: 0, duration: 180, status: 'submitted' },
			{ id: 2, startTime: 0, duration: 180, status: 'active' }
		]);

		const result = getAnimationSuppressedSquares(state);

		// plan1: {0, 7}, plan2: {7, 63} → combined: {0, 7, 63}
		expect(result.has(0 as Square)).toBe(true);
		expect(result.has(7 as Square)).toBe(true);
		expect(result.has(63 as Square)).toBe(true);
		expect(result.size).toBe(3);
	});

	it('calls getAll with submitted and active statuses', () => {
		const { surface, getAll } = createMockAnimationRuntimeSurface();
		const state = createAnimationInternalState(surface);
		getAll.mockReturnValue([]);

		getAnimationSuppressedSquares(state);

		expect(getAll).toHaveBeenCalledWith(['submitted', 'active']);
	});

	it('ignores sessions without stored entries in the map', () => {
		const { surface, getAll } = createMockAnimationRuntimeSurface();
		const state = createAnimationInternalState(surface);
		const plan = createSimpleMovePlan(4 as Square, 5 as Square, PieceCode.WhiteKing);
		state.entries.set(1, { plan, nodes: null });

		// getAll returns session id=1 (has entry) and id=2 (no entry)
		getAll.mockReturnValue([
			{ id: 1, startTime: 0, duration: 180, status: 'active' },
			{ id: 2, startTime: 0, duration: 180, status: 'submitted' }
		]);

		const result = getAnimationSuppressedSquares(state);

		// Only plan from session 1
		expect(result.has(4 as Square)).toBe(true);
		expect(result.has(5 as Square)).toBe(true);
		expect(result.size).toBe(2);
	});
});
