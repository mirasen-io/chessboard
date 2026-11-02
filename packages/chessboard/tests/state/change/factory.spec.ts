import { describe, expect, it } from 'vitest';
import { createMutationSession } from '../../../src/mutation/session.js';
import type { Square } from '../../../src/state/board/types/internal.js';
import { createChangeState } from '../../../src/state/change/factory/main.js';
import { createPendingUIMoveRequest } from '../../../src/state/change/factory/ui-move.js';
import type { ChangeStateMutationPayloadByCause } from '../../../src/state/change/mutation.js';
import { makeMoveDestination, makeMoveSnapshot } from '../../test-utils/state/change/fixtures.js';

function createChangeMutationSession() {
	return createMutationSession<ChangeStateMutationPayloadByCause>();
}

describe('createChangeState', () => {
	it('initial state has null lastMove and null deferredUIMoveRequest', () => {
		const state = createChangeState();
		expect(state.lastMove).toBeNull();
		expect(state.deferredUIMoveRequest).toBeNull();
	});

	it('lastMove getter returns cloned value', () => {
		const state = createChangeState();
		const session = createChangeMutationSession();
		const move = makeMoveSnapshot();
		state.setLastMove(move, session);

		const a = state.lastMove;
		const b = state.lastMove;
		expect(a).not.toBe(b);
		expect(a).toEqual(b);
	});

	it('setLastMove updates state and records mutation cause', () => {
		const state = createChangeState();
		const session = createChangeMutationSession();
		const move = makeMoveSnapshot();

		const changed = state.setLastMove(move, session);

		expect(changed).toBe(true);
		expect(session.hasMutation({ causes: ['state.change.setLastMove'] })).toBe(true);
		expect(state.lastMove).not.toBeNull();
		expect(state.lastMove!.from).toBe(move.from);
	});

	it('setLastMove no-op returns false and records no mutation', () => {
		const state = createChangeState();
		const session1 = createChangeMutationSession();
		state.setLastMove(makeMoveSnapshot(), session1);

		const session2 = createChangeMutationSession();
		const changed = state.setLastMove(makeMoveSnapshot(), session2);

		expect(changed).toBe(false);
		expect(session2.hasMutation({ causes: ['state.change.setLastMove'] })).toBe(false);
	});

	it('setDeferredUIMoveRequest updates state and records mutation cause', () => {
		const state = createChangeState();
		const session = createChangeMutationSession();
		const req = createPendingUIMoveRequest(12 as Square, makeMoveDestination());

		const changed = state.setDeferredUIMoveRequest(req, session);

		expect(changed).toBe(true);
		expect(session.hasMutation({ causes: ['state.change.setDeferredUIMoveRequest'] })).toBe(true);
	});

	it('getSnapshot returns correct structure with deferredUIMoveRequest snapshot', () => {
		const state = createChangeState();
		const session = createChangeMutationSession();
		const req = createPendingUIMoveRequest(12 as Square, makeMoveDestination());
		state.setDeferredUIMoveRequest(req, session);
		state.setLastMove(makeMoveSnapshot(), session);

		const snapshot = state.getSnapshot();

		expect(snapshot.lastMove).not.toBeNull();
		expect(snapshot.deferredUIMoveRequest).not.toBeNull();
		expect(snapshot.deferredUIMoveRequest!.status).toBe('unresolved');
		expect(snapshot.deferredUIMoveRequest!.sourceSquare).toBe(12);
		// Snapshot should have canBeAutoResolved derived field
		expect(typeof snapshot.deferredUIMoveRequest!.canBeAutoResolved).toBe('boolean');
	});

	it('getSnapshot deep-clones lastMove', () => {
		const state = createChangeState();
		const session = createChangeMutationSession();
		state.setLastMove(makeMoveSnapshot(), session);

		const snap1 = state.getSnapshot();
		const snap2 = state.getSnapshot();

		expect(snap1.lastMove).not.toBe(snap2.lastMove);
		expect(snap1.lastMove).toEqual(snap2.lastMove);
	});
});
