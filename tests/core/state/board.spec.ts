import { describe, expect, it } from 'vitest';
import { createBoardState } from '../../../src/core/state/board/factory';
import type { BoardStateMutationPayloadByCause } from '../../../src/core/state/board/mutation';
import type { Square } from '../../../src/core/state/board/types';
import { createMutationSession } from '../../../src/core/state/mutation/session';

describe('core/state/board', () => {
	describe('BoardState', () => {
		describe('setTurn', () => {
			it('with different turn value reports changed', () => {
				const state = createBoardState({ position: 'start', turn: 'white' });
				const session = createMutationSession<BoardStateMutationPayloadByCause>();

				const result = state.setTurn('black', session);

				expect(result).toBe(true);
				expect(session.hasMutation('board.state.setTurn')).toBe(true);
			});

			it('with same turn value reports no-op', () => {
				const state = createBoardState({ position: 'start', turn: 'white' });
				const session = createMutationSession<BoardStateMutationPayloadByCause>();

				const result = state.setTurn('white', session);

				expect(result).toBe(false);
				expect(session.hasMutation('board.state.setTurn')).toBe(false);
			});

			it('does not bump positionEpoch', () => {
				const state = createBoardState({ position: 'start', turn: 'white' });
				const session = createMutationSession<BoardStateMutationPayloadByCause>();

				const beforeEpoch = state.getSnapshot().positionEpoch;
				state.setTurn('black', session);
				const afterEpoch = state.getSnapshot().positionEpoch;

				expect(afterEpoch).toBe(beforeEpoch);
			});

			it('records mutation cause board.state.setTurn when changed', () => {
				const state = createBoardState({ position: 'start', turn: 'white' });
				const session = createMutationSession<BoardStateMutationPayloadByCause>();

				state.setTurn('black', session);

				expect(session.hasMutation('board.state.setTurn')).toBe(true);
			});
		});

		describe('setPosition', () => {
			it('updates position and bumps positionEpoch', () => {
				const state = createBoardState({ position: 'start' });
				const session = createMutationSession<BoardStateMutationPayloadByCause>();

				const beforeEpoch = state.getSnapshot().positionEpoch;
				const result = state.setPosition('8/8/8/8/8/8/8/8 w - - 0 1', session);
				const afterEpoch = state.getSnapshot().positionEpoch;

				expect(result).toBe(true);
				expect(afterEpoch).toBe(beforeEpoch + 1);
			});

			it('records mutation cause board.state.setPosition when changed', () => {
				const state = createBoardState({ position: 'start' });
				const session = createMutationSession<BoardStateMutationPayloadByCause>();

				state.setPosition('8/8/8/8/8/8/8/8 w - - 0 1', session);

				expect(session.hasMutation('board.state.setPosition')).toBe(true);
			});

			it('accepts position map input', () => {
				const state = createBoardState();
				const session = createMutationSession<BoardStateMutationPayloadByCause>();

				const result = state.setPosition({ e4: { color: 'white', role: 'pawn' } }, session);

				expect(result).toBe(true);
				expect(session.hasMutation('board.state.setPosition')).toBe(true);
			});
		});

		describe('move', () => {
			it('updates board state and bumps positionEpoch', () => {
				const state = createBoardState({ position: 'start' });
				const session = createMutationSession<BoardStateMutationPayloadByCause>();

				const beforeEpoch = state.getSnapshot().positionEpoch;
				state.move({ from: 'e2', to: 'e4' }, session);
				const afterEpoch = state.getSnapshot().positionEpoch;

				expect(afterEpoch).toBe(beforeEpoch + 1);
			});

			it('records mutation cause board.state.move with payload containing move details', () => {
				const state = createBoardState({ position: 'start' });
				const session = createMutationSession<BoardStateMutationPayloadByCause>();

				const moveResult = state.move({ from: 'e2', to: 'e4' }, session);

				expect(session.hasMutation('board.state.move')).toBe(true);
				const payload = session.getPayload('board.state.move');
				expect(payload).toBeDefined();
				expect(payload?.from).toBe(moveResult.from);
				expect(payload?.to).toBe(moveResult.to);
				expect(payload?.moved).toEqual(moveResult.moved);
			});

			it('accepts numeric square inputs', () => {
				const state = createBoardState({ position: 'start' });
				const session = createMutationSession<BoardStateMutationPayloadByCause>();

				// e2 = 12, e4 = 28
				const moveResult = state.move({ from: 12 as Square, to: 28 as Square }, session);

				expect(moveResult.from).toBe(12);
				expect(moveResult.to).toBe(28);
			});

			it('throws with invalid square string', () => {
				const state = createBoardState({ position: 'start' });
				const session = createMutationSession<BoardStateMutationPayloadByCause>();

				expect(() => {
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					state.move({ from: 'e2', to: 'z9' as any }, session);
				}).toThrow();
			});
		});

		describe('getPieceCodeAt', () => {
			it('returns correct encoded piece value', () => {
				const state = createBoardState({ position: 'start' });

				// a1 has white rook in start position
				const code = state.getPieceCodeAt(0 as Square);

				expect(code).toBeGreaterThan(0);
			});

			it('returns 0 for empty square', () => {
				const state = createBoardState({ position: '8/8/8/8/8/8/8/8 w - - 0 1' });

				const code = state.getPieceCodeAt(0 as Square);

				expect(code).toBe(0);
			});
		});

		describe('getSnapshot', () => {
			it('returns safe owned copy', () => {
				const state = createBoardState({ position: 'start' });

				const snapshot = state.getSnapshot();

				expect(snapshot.pieces).toBeInstanceOf(Uint8Array);
				expect(snapshot.turn).toBe('white');
				expect(snapshot.positionEpoch).toBe(0);
			});

			it('mutating snapshot does not affect internal state', () => {
				const state = createBoardState({ position: 'start' });
				const snapshot = state.getSnapshot();
				const originalPieceValue = snapshot.pieces[0];

				// Mutate snapshot
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				(snapshot as any).pieces[0] = 99;
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				(snapshot as any).turn = 'black';

				// Get fresh snapshot
				const newSnapshot = state.getSnapshot();
				expect(newSnapshot.pieces[0]).toBe(originalPieceValue);
				expect(newSnapshot.turn).toBe('white');
			});
		});

		describe('move legality', () => {
			it('does not enforce move legality', () => {
				const state = createBoardState({ position: 'start' });
				const session = createMutationSession<BoardStateMutationPayloadByCause>();

				// Invalid chess move: move pawn backwards
				const moveResult = state.move({ from: 'e2', to: 'e1' }, session);

				expect(moveResult).toBeDefined();
				expect(session.hasMutation('board.state.move')).toBe(true);
			});
		});
	});
});
