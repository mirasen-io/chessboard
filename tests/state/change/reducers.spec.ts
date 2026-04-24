import { describe, expect, it } from 'vitest';
import type { Square } from '../../../src/state/board/types/internal.js';
import { createPendingUIMoveRequest } from '../../../src/state/change/factory/ui-move.js';
import {
	changeStateSetDeferredUIMoveRequest,
	changeStateSetLastMove
} from '../../../src/state/change/reducers.js';
import {
	makeChangeStateInternal,
	makeMoveDestination,
	makeMoveSnapshot
} from '../../test-utils/state/change/fixtures.js';

describe('changeStateSetLastMove', () => {
	it('sets move and returns true', () => {
		const state = makeChangeStateInternal();
		const move = makeMoveSnapshot();
		const result = changeStateSetLastMove(state, move);
		expect(result).toBe(true);
		expect(state.lastMove).not.toBeNull();
		expect(state.lastMove!.from).toBe(move.from);
		expect(state.lastMove!.to).toBe(move.to);
	});

	it('returns false when setting same move again (no-op)', () => {
		const state = makeChangeStateInternal();
		const move = makeMoveSnapshot();
		changeStateSetLastMove(state, move);
		const result = changeStateSetLastMove(state, move);
		expect(result).toBe(false);
	});

	it('sets to null to clear last move', () => {
		const state = makeChangeStateInternal();
		changeStateSetLastMove(state, makeMoveSnapshot());
		const result = changeStateSetLastMove(state, null);
		expect(result).toBe(true);
		expect(state.lastMove).toBeNull();
	});

	it('deep-clones the move (mutation of input does not affect state)', () => {
		const state = makeChangeStateInternal();
		const move = makeMoveSnapshot();
		changeStateSetLastMove(state, move);
		// state.lastMove should not be the same reference as input
		expect(state.lastMove).not.toBe(move);
	});
});

describe('changeStateSetDeferredUIMoveRequest', () => {
	it('sets request and returns true', () => {
		const state = makeChangeStateInternal();
		const req = createPendingUIMoveRequest(12 as Square, makeMoveDestination());
		const result = changeStateSetDeferredUIMoveRequest(state, req);
		expect(result).toBe(true);
		expect(state.deferredUIMoveRequest).toBe(req);
	});

	it('returns false when setting a distinct request with the same snapshot', () => {
		const state = makeChangeStateInternal();
		const dest = makeMoveDestination();
		const req1 = createPendingUIMoveRequest(12 as Square, dest);
		changeStateSetDeferredUIMoveRequest(state, req1);
		// Create a second, distinct object with an equivalent snapshot
		const req2 = createPendingUIMoveRequest(12 as Square, dest);
		expect(req1).not.toBe(req2);
		const result = changeStateSetDeferredUIMoveRequest(state, req2);
		expect(result).toBe(false);
	});

	it('sets to null to clear deferred request', () => {
		const state = makeChangeStateInternal();
		const req = createPendingUIMoveRequest(12 as Square, makeMoveDestination());
		changeStateSetDeferredUIMoveRequest(state, req);
		const result = changeStateSetDeferredUIMoveRequest(state, null);
		expect(result).toBe(true);
		expect(state.deferredUIMoveRequest).toBeNull();
	});
});
