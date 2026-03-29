import { describe, expect, it } from 'vitest';
import type { Square } from '../../../src/core/state/board/types';
import { createInteractionState } from '../../../src/core/state/interaction/factory';
import type { InteractionStateMutationPayloadByCause } from '../../../src/core/state/interaction/mutation';
import { createMutationSession } from '../../../src/core/state/mutation/session';

describe('core/state/interaction', () => {
	describe('InteractionState', () => {
		describe('setDestinations', () => {
			it('with null input normalizes to [] internally', () => {
				const state = createInteractionState();
				const session = createMutationSession<InteractionStateMutationPayloadByCause>();

				state.setDestinations(null, session);

				const destinations = state.getDestinations();
				expect(destinations).toEqual([]);
				expect(Array.isArray(destinations)).toBe(true);
			});

			it('with array input stores normalized form internally', () => {
				const state = createInteractionState();
				const session = createMutationSession<InteractionStateMutationPayloadByCause>();

				state.setDestinations([10, 20, 30] as Square[], session);

				const destinations = state.getDestinations();
				expect(destinations).toEqual([10, 20, 30]);
			});

			it('getDestinations returns normalized array copy', () => {
				const state = createInteractionState();
				const session = createMutationSession<InteractionStateMutationPayloadByCause>();

				state.setDestinations([10, 20] as Square[], session);

				const destinations = state.getDestinations();
				expect(Array.isArray(destinations)).toBe(true);
				expect(destinations).toEqual([10, 20]);
			});

			it('getSnapshot().destinations is normalized array', () => {
				const state = createInteractionState();
				const session = createMutationSession<InteractionStateMutationPayloadByCause>();

				state.setDestinations([10, 20] as Square[], session);

				const snapshot = state.getSnapshot();
				expect(Array.isArray(snapshot.destinations)).toBe(true);
				expect(snapshot.destinations).toEqual([10, 20]);
			});

			it('changed vs no-op behavior', () => {
				const state = createInteractionState();
				const session1 = createMutationSession<InteractionStateMutationPayloadByCause>();
				const session2 = createMutationSession<InteractionStateMutationPayloadByCause>();

				const result1 = state.setDestinations([10, 20] as Square[], session1);
				const result2 = state.setDestinations([10, 20] as Square[], session2);

				expect(result1).toBe(true);
				expect(result2).toBe(false);
			});

			it('records mutation cause interaction.state.setDestinations when changed', () => {
				const state = createInteractionState();
				const session = createMutationSession<InteractionStateMutationPayloadByCause>();

				state.setDestinations([10, 20] as Square[], session);

				expect(session.hasMutation('interaction.state.setDestinations')).toBe(true);
			});
		});

		describe('setSelectedSquare', () => {
			it('getSelectedSquare returns current selected square or null', () => {
				const state = createInteractionState();
				const session = createMutationSession<InteractionStateMutationPayloadByCause>();

				expect(state.getSelectedSquare()).toBeNull();

				state.setSelectedSquare(12 as Square, session);
				expect(state.getSelectedSquare()).toBe(12);
			});

			it('changed vs no-op detection', () => {
				const state = createInteractionState();
				const session1 = createMutationSession<InteractionStateMutationPayloadByCause>();
				const session2 = createMutationSession<InteractionStateMutationPayloadByCause>();

				const result1 = state.setSelectedSquare(12 as Square, session1);
				const result2 = state.setSelectedSquare(12 as Square, session2);

				expect(result1).toBe(true);
				expect(result2).toBe(false);
			});

			it('records mutation cause interaction.state.setSelectedSquare when changed', () => {
				const state = createInteractionState();
				const session = createMutationSession<InteractionStateMutationPayloadByCause>();

				state.setSelectedSquare(12 as Square, session);

				expect(session.hasMutation('interaction.state.setSelectedSquare')).toBe(true);
			});
		});

		describe('setDragSession', () => {
			it('getDragSession returns safe owned copy or null', () => {
				const state = createInteractionState();
				const session = createMutationSession<InteractionStateMutationPayloadByCause>();

				expect(state.getDragSession()).toBeNull();

				state.setDragSession({ fromSquare: 12 as Square }, session);
				const dragSession = state.getDragSession();

				expect(dragSession).not.toBeNull();
				expect(dragSession?.fromSquare).toBe(12);
			});

			it('changed vs no-op detection', () => {
				const state = createInteractionState();
				const session1 = createMutationSession<InteractionStateMutationPayloadByCause>();
				const session2 = createMutationSession<InteractionStateMutationPayloadByCause>();

				const result1 = state.setDragSession({ fromSquare: 12 as Square }, session1);
				const result2 = state.setDragSession({ fromSquare: 12 as Square }, session2);

				expect(result1).toBe(true);
				expect(result2).toBe(false);
			});

			it('records mutation cause interaction.state.setDragSession when changed', () => {
				const state = createInteractionState();
				const session = createMutationSession<InteractionStateMutationPayloadByCause>();

				state.setDragSession({ fromSquare: 12 as Square }, session);

				expect(session.hasMutation('interaction.state.setDragSession')).toBe(true);
			});
		});

		describe('setCurrentTarget', () => {
			it('getCurrentTarget returns current target or null', () => {
				const state = createInteractionState();
				const session = createMutationSession<InteractionStateMutationPayloadByCause>();

				expect(state.getCurrentTarget()).toBeNull();

				state.setCurrentTarget(28 as Square, session);
				expect(state.getCurrentTarget()).toBe(28);
			});

			it('changed vs no-op detection', () => {
				const state = createInteractionState();
				const session1 = createMutationSession<InteractionStateMutationPayloadByCause>();
				const session2 = createMutationSession<InteractionStateMutationPayloadByCause>();

				const result1 = state.setCurrentTarget(28 as Square, session1);
				const result2 = state.setCurrentTarget(28 as Square, session2);

				expect(result1).toBe(true);
				expect(result2).toBe(false);
			});

			it('records mutation cause interaction.state.setCurrentTarget when changed', () => {
				const state = createInteractionState();
				const session = createMutationSession<InteractionStateMutationPayloadByCause>();

				state.setCurrentTarget(28 as Square, session);

				expect(session.hasMutation('interaction.state.setCurrentTarget')).toBe(true);
			});
		});

		describe('setReleaseTargetingActive', () => {
			it('getReleaseTargetingActive returns current boolean state', () => {
				const state = createInteractionState();
				const session = createMutationSession<InteractionStateMutationPayloadByCause>();

				expect(state.getReleaseTargetingActive()).toBe(false);

				state.setReleaseTargetingActive(true, session);
				expect(state.getReleaseTargetingActive()).toBe(true);
			});

			it('changed vs no-op detection', () => {
				const state = createInteractionState();
				const session1 = createMutationSession<InteractionStateMutationPayloadByCause>();
				const session2 = createMutationSession<InteractionStateMutationPayloadByCause>();

				const result1 = state.setReleaseTargetingActive(true, session1);
				const result2 = state.setReleaseTargetingActive(true, session2);

				expect(result1).toBe(true);
				expect(result2).toBe(false);
			});

			it('records mutation cause interaction.state.setReleaseTargetingActive when changed', () => {
				const state = createInteractionState();
				const session = createMutationSession<InteractionStateMutationPayloadByCause>();

				state.setReleaseTargetingActive(true, session);

				expect(session.hasMutation('interaction.state.setReleaseTargetingActive')).toBe(true);
			});
		});

		describe('clear', () => {
			it('resets all five fields: selectedSquare, destinations, dragSession, currentTarget, releaseTargetingActive', () => {
				const state = createInteractionState();
				const setupSession = createMutationSession<InteractionStateMutationPayloadByCause>();

				// Set all fields
				state.setSelectedSquare(12 as Square, setupSession);
				state.setDestinations([20, 28] as Square[], setupSession);
				state.setDragSession({ fromSquare: 12 as Square }, setupSession);
				state.setCurrentTarget(28 as Square, setupSession);
				state.setReleaseTargetingActive(true, setupSession);

				const clearSession = createMutationSession<InteractionStateMutationPayloadByCause>();
				state.clear(clearSession);

				expect(state.getSelectedSquare()).toBeNull();
				expect(state.getDestinations()).toEqual([]);
				expect(state.getDragSession()).toBeNull();
				expect(state.getCurrentTarget()).toBeNull();
				expect(state.getReleaseTargetingActive()).toBe(false);
			});

			it('records mutation cause interaction.state.clear when any field was non-null/non-false', () => {
				const state = createInteractionState();
				const setupSession = createMutationSession<InteractionStateMutationPayloadByCause>();

				state.setSelectedSquare(12 as Square, setupSession);

				const clearSession = createMutationSession<InteractionStateMutationPayloadByCause>();
				state.clear(clearSession);

				expect(clearSession.hasMutation('interaction.state.clear')).toBe(true);
			});

			it('reports no-op when all fields already null/false', () => {
				const state = createInteractionState();
				const clearSession = createMutationSession<InteractionStateMutationPayloadByCause>();

				const result = state.clear(clearSession);

				expect(result).toBe(false);
				expect(clearSession.hasMutation('interaction.state.clear')).toBe(false);
			});
		});

		describe('clearActive', () => {
			it('resets only dragSession, currentTarget, releaseTargetingActive', () => {
				const state = createInteractionState();
				const setupSession = createMutationSession<InteractionStateMutationPayloadByCause>();

				// Set all fields
				state.setSelectedSquare(12 as Square, setupSession);
				state.setDestinations([20, 28] as Square[], setupSession);
				state.setDragSession({ fromSquare: 12 as Square }, setupSession);
				state.setCurrentTarget(28 as Square, setupSession);
				state.setReleaseTargetingActive(true, setupSession);

				const clearActiveSession = createMutationSession<InteractionStateMutationPayloadByCause>();
				state.clearActive(clearActiveSession);

				// Active fields cleared
				expect(state.getDragSession()).toBeNull();
				expect(state.getCurrentTarget()).toBeNull();
				expect(state.getReleaseTargetingActive()).toBe(false);

				// Non-active fields preserved
				expect(state.getSelectedSquare()).toBe(12);
				expect(state.getDestinations()).toEqual([20, 28]);
			});

			it('preserves selectedSquare and destinations', () => {
				const state = createInteractionState();
				const setupSession = createMutationSession<InteractionStateMutationPayloadByCause>();

				state.setSelectedSquare(12 as Square, setupSession);
				state.setDestinations([20, 28] as Square[], setupSession);
				state.setDragSession({ fromSquare: 12 as Square }, setupSession);

				const clearActiveSession = createMutationSession<InteractionStateMutationPayloadByCause>();
				state.clearActive(clearActiveSession);

				expect(state.getSelectedSquare()).toBe(12);
				expect(state.getDestinations()).toEqual([20, 28]);
			});

			it('records mutation cause interaction.state.clearActive when any active field was set', () => {
				const state = createInteractionState();
				const setupSession = createMutationSession<InteractionStateMutationPayloadByCause>();

				state.setDragSession({ fromSquare: 12 as Square }, setupSession);

				const clearActiveSession = createMutationSession<InteractionStateMutationPayloadByCause>();
				state.clearActive(clearActiveSession);

				expect(clearActiveSession.hasMutation('interaction.state.clearActive')).toBe(true);
			});

			it('reports no-op when no active fields set', () => {
				const state = createInteractionState();
				const setupSession = createMutationSession<InteractionStateMutationPayloadByCause>();

				state.setSelectedSquare(12 as Square, setupSession);

				const clearActiveSession = createMutationSession<InteractionStateMutationPayloadByCause>();
				const result = state.clearActive(clearActiveSession);

				expect(result).toBe(false);
				expect(clearActiveSession.hasMutation('interaction.state.clearActive')).toBe(false);
			});
		});

		describe('getSnapshot', () => {
			it('returns safe owned copies', () => {
				const state = createInteractionState();
				const session = createMutationSession<InteractionStateMutationPayloadByCause>();

				state.setSelectedSquare(12 as Square, session);
				state.setDestinations([20, 28] as Square[], session);

				const snapshot = state.getSnapshot();

				expect(snapshot.selectedSquare).toBe(12);
				expect(snapshot.destinations).toEqual([20, 28]);
			});

			it('mutating snapshot does not affect internal state', () => {
				const state = createInteractionState();
				const session = createMutationSession<InteractionStateMutationPayloadByCause>();

				state.setDestinations([20, 28] as Square[], session);

				const snapshot = state.getSnapshot();
				// Mutate the destinations array itself
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				(snapshot.destinations as any).push(99);
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				(snapshot.destinations as any)[0] = 99;

				const newSnapshot = state.getSnapshot();
				expect(newSnapshot.destinations).toEqual([20, 28]);
			});
		});
	});
});
