import { describe, expect, it } from 'vitest';
import type { Move, Square } from '../../../src/core/state/board/types';
import { createChangeState } from '../../../src/core/state/change/factory';
import type { ChangeStateMutationPayloadByCause } from '../../../src/core/state/change/mutation';
import { createMutationSession } from '../../../src/core/state/mutation/session';

describe('core/state/change', () => {
	describe('ChangeState', () => {
		describe('getLastMove', () => {
			it('returns safe owned copy or null', () => {
				const state = createChangeState();

				expect(state.getLastMove()).toBeNull();

				const session = createMutationSession<ChangeStateMutationPayloadByCause>();
				const move: Move = {
					from: 12 as Square,
					to: 28 as Square,
					moved: { color: 'white', role: 'pawn' }
				};
				state.setLastMove(move, session);

				const lastMove = state.getLastMove();
				expect(lastMove).not.toBeNull();
				expect(lastMove?.from).toBe(12);
				expect(lastMove?.to).toBe(28);
			});

			it('mutating getLastMove return does not affect internal state', () => {
				const state = createChangeState();
				const session = createMutationSession<ChangeStateMutationPayloadByCause>();

				const move: Move = {
					from: 12 as Square,
					to: 28 as Square,
					moved: { color: 'white', role: 'pawn' }
				};
				state.setLastMove(move, session);

				const lastMove = state.getLastMove();
				if (lastMove) {
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					(lastMove as any).from = 99;
				}

				const newLastMove = state.getLastMove();
				expect(newLastMove?.from).toBe(12);
			});
		});

		describe('setLastMove', () => {
			it('stores safe owned copy of last move data', () => {
				const state = createChangeState();
				const session = createMutationSession<ChangeStateMutationPayloadByCause>();

				const move: Move = {
					from: 12 as Square,
					to: 28 as Square,
					moved: { color: 'white', role: 'pawn' }
				};
				state.setLastMove(move, session);

				// Mutate original
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				(move as any).from = 99;

				const lastMove = state.getLastMove();
				expect(lastMove?.from).toBe(12);
			});

			it('changed vs no-op detection: null to value', () => {
				const state = createChangeState();
				const session = createMutationSession<ChangeStateMutationPayloadByCause>();

				const move: Move = {
					from: 12 as Square,
					to: 28 as Square,
					moved: { color: 'white', role: 'pawn' }
				};
				const result = state.setLastMove(move, session);

				expect(result).toBe(true);
			});

			it('changed vs no-op detection: value to different value', () => {
				const state = createChangeState();
				const session1 = createMutationSession<ChangeStateMutationPayloadByCause>();
				const session2 = createMutationSession<ChangeStateMutationPayloadByCause>();

				const move1: Move = {
					from: 12 as Square,
					to: 28 as Square,
					moved: { color: 'white', role: 'pawn' }
				};
				state.setLastMove(move1, session1);

				const move2: Move = {
					from: 28 as Square,
					to: 36 as Square,
					moved: { color: 'white', role: 'pawn' }
				};
				const result = state.setLastMove(move2, session2);

				expect(result).toBe(true);
			});

			it('changed vs no-op detection: value to same value', () => {
				const state = createChangeState();
				const session1 = createMutationSession<ChangeStateMutationPayloadByCause>();
				const session2 = createMutationSession<ChangeStateMutationPayloadByCause>();

				const move: Move = {
					from: 12 as Square,
					to: 28 as Square,
					moved: { color: 'white', role: 'pawn' }
				};
				state.setLastMove(move, session1);

				const sameMoveValue: Move = {
					from: 12 as Square,
					to: 28 as Square,
					moved: { color: 'white', role: 'pawn' }
				};
				const result = state.setLastMove(sameMoveValue, session2);

				expect(result).toBe(false);
			});

			it('records mutation cause change.state.setLastMove when changed', () => {
				const state = createChangeState();
				const session = createMutationSession<ChangeStateMutationPayloadByCause>();

				const move: Move = {
					from: 12 as Square,
					to: 28 as Square,
					moved: { color: 'white', role: 'pawn' }
				};
				state.setLastMove(move, session);

				expect(session.hasMutation('change.state.setLastMove')).toBe(true);
			});

			it('can clear last move by setting null', () => {
				const state = createChangeState();
				const session1 = createMutationSession<ChangeStateMutationPayloadByCause>();
				const session2 = createMutationSession<ChangeStateMutationPayloadByCause>();

				const move: Move = {
					from: 12 as Square,
					to: 28 as Square,
					moved: { color: 'white', role: 'pawn' }
				};
				state.setLastMove(move, session1);

				const result = state.setLastMove(null, session2);

				expect(result).toBe(true);
				expect(state.getLastMove()).toBeNull();
			});
		});

		describe('getSnapshot', () => {
			it('returns safe owned copies', () => {
				const state = createChangeState();
				const session = createMutationSession<ChangeStateMutationPayloadByCause>();

				const move: Move = {
					from: 12 as Square,
					to: 28 as Square,
					moved: { color: 'white', role: 'pawn' }
				};
				state.setLastMove(move, session);

				const snapshot = state.getSnapshot();

				expect(snapshot.lastMove).not.toBeNull();
				expect(snapshot.lastMove?.from).toBe(12);
			});

			it('getSnapshot().lastMove is safe owned copy', () => {
				const state = createChangeState();
				const session = createMutationSession<ChangeStateMutationPayloadByCause>();

				const move: Move = {
					from: 12 as Square,
					to: 28 as Square,
					moved: { color: 'white', role: 'pawn' }
				};
				state.setLastMove(move, session);

				const snapshot = state.getSnapshot();
				if (snapshot.lastMove) {
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					(snapshot.lastMove as any).from = 99;
				}

				const newSnapshot = state.getSnapshot();
				expect(newSnapshot.lastMove?.from).toBe(12);
			});
		});
	});
});
