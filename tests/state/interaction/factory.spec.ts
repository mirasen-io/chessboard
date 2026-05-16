import { describe, expect, it } from 'vitest';
import { createMutationSession } from '../../../src/mutation/session.js';
import {
	PieceCode,
	type NonEmptyPieceCode,
	type Square
} from '../../../src/state/board/types/internal.js';
import { createInteractionState } from '../../../src/state/interaction/factory.js';
import type { InteractionStateMutationPayloadByCause } from '../../../src/state/interaction/mutation.js';
import { MovabilityModeCode } from '../../../src/state/interaction/types/internal.js';
import {
	makeDragSessionCoreOwned,
	makeSelected
} from '../../test-utils/state/interaction/fixtures.js';

function createInteractionMutationSession() {
	return createMutationSession<InteractionStateMutationPayloadByCause>();
}

describe('createInteractionState', () => {
	it('defaults to movability disabled, selected null, empty activeDestinations, dragSession null', () => {
		const state = createInteractionState({});
		expect(state.selected).toBeNull();
		expect(state.movability.mode).toBe(MovabilityModeCode.Disabled);
		expect(state.activeDestinations.size).toBe(0);
		expect(state.dragSession).toBeNull();
	});

	it('initializes with movability option', () => {
		const state = createInteractionState({ movability: { mode: 'free' } });
		expect(state.movability.mode).toBe(MovabilityModeCode.Free);
	});

	it('setSelected updates selected and cascades updateActiveDestinations', () => {
		const state = createInteractionState({
			movability: {
				mode: 'strict',
				destinations: { e2: [{ to: 'e4' }] }
			}
		});
		const session = createInteractionMutationSession();
		const sel = makeSelected(12 as Square, PieceCode.WhitePawn as NonEmptyPieceCode);

		const changed = state.setSelected(sel, session);

		expect(changed).toBe(true);
		expect(session.hasMutation({ causes: ['state.interaction.setSelectedSquare'] })).toBe(true);
		expect(session.hasMutation({ causes: ['state.interaction.updateActiveDestinations'] })).toBe(
			true
		);
		expect(state.activeDestinations.size).toBe(1);
		expect(state.activeDestinations.has(28 as Square)).toBe(true);
	});

	it('setSelected no-op returns false', () => {
		const state = createInteractionState({});
		const session = createInteractionMutationSession();
		state.setSelected(null, session);
		const session2 = createInteractionMutationSession();
		expect(state.setSelected(null, session2)).toBe(false);
	});

	it('setMovability normalizes input and records mutation', () => {
		const state = createInteractionState({});
		const session = createInteractionMutationSession();

		const changed = state.setMovability({ mode: 'free' }, session);

		expect(changed).toBe(true);
		expect(session.hasMutation({ causes: ['state.interaction.setMovability'] })).toBe(true);
		expect(state.movability.mode).toBe(MovabilityModeCode.Free);
	});

	it('setDragSession sets core lifted-piece-drag when selected matches', () => {
		const state = createInteractionState({});
		const session = createInteractionMutationSession();
		state.setSelected(makeSelected(), session);

		const session2 = createInteractionMutationSession();
		const drag = makeDragSessionCoreOwned({ startButton: 0 });
		const changed = state.setDragSession(drag, session2);

		expect(changed).toBe(true);
		expect(session2.hasMutation({ causes: ['state.interaction.setDragSession'] })).toBe(true);
		expect(state.dragSession).not.toBeNull();
	});

	it('setDragSession asserts when no selected piece for core session', () => {
		const state = createInteractionState({});
		const session = createInteractionMutationSession();
		const drag = makeDragSessionCoreOwned({ startButton: 0 });

		expect(() => state.setDragSession(drag, session)).toThrow();
	});

	it('setDragSession asserts when another session already active', () => {
		const state = createInteractionState({});
		const session = createInteractionMutationSession();
		state.setSelected(makeSelected(), session);
		state.setDragSession(makeDragSessionCoreOwned({ startButton: 0 }), session);

		const session2 = createInteractionMutationSession();
		expect(() =>
			state.setDragSession(makeDragSessionCoreOwned({ startButton: 0 }), session2)
		).toThrow();
	});

	it('setDragSession(null) clears drag session', () => {
		const state = createInteractionState({});
		const session = createInteractionMutationSession();
		state.setSelected(makeSelected(), session);
		state.setDragSession(makeDragSessionCoreOwned({ startButton: 0 }), session);

		const session2 = createInteractionMutationSession();
		const changed = state.setDragSession(null, session2);

		expect(changed).toBe(true);
		expect(state.dragSession).toBeNull();
	});

	it('updateDragSessionCurrentTarget asserts when no session', () => {
		const state = createInteractionState({});
		const session = createInteractionMutationSession();

		expect(() => state.updateDragSessionCurrentTarget(28 as Square, session)).toThrow();
	});

	it('clear clears all and cascades updateActiveDestinations', () => {
		const state = createInteractionState({
			movability: { mode: 'strict', destinations: { e2: [{ to: 'e4' }] } }
		});
		const session = createInteractionMutationSession();
		state.setSelected(makeSelected(), session);
		expect(state.activeDestinations.size).toBeGreaterThan(0);

		const session2 = createInteractionMutationSession();
		const changed = state.clear(session2);

		expect(changed).toBe(true);
		expect(session2.hasMutation({ causes: ['state.interaction.clear'] })).toBe(true);
		expect(state.selected).toBeNull();
		expect(state.activeDestinations.size).toBe(0);
	});

	it('getSnapshot returns isolated clone that does not affect internal state', () => {
		const state = createInteractionState({});
		const session = createInteractionMutationSession();
		state.setSelected(makeSelected(), session);
		state.setDragSession(makeDragSessionCoreOwned({ startButton: 0 }), session);

		const snapshot = state.getSnapshot();

		// Mutate the returned snapshot
		(snapshot as { selected: null }).selected = null;

		// Internal state should be unaffected
		const freshSnapshot = state.getSnapshot();
		expect(freshSnapshot.selected).not.toBeNull();
		expect(freshSnapshot.selected!.square).toBe(12);
		expect(freshSnapshot.dragSession).not.toBeNull();
	});

	it('clearActive clears drag session but not selected, and records mutation', () => {
		const state = createInteractionState({});
		const session = createInteractionMutationSession();
		state.setSelected(makeSelected(), session);
		state.setDragSession(makeDragSessionCoreOwned({ startButton: 0 }), session);

		const session2 = createInteractionMutationSession();
		const changed = state.clearActive(session2);

		expect(changed).toBe(true);
		expect(session2.hasMutation({ causes: ['state.interaction.clearActive'] })).toBe(true);
		expect(state.dragSession).toBeNull();
		expect(state.selected).not.toBeNull();
		expect(state.selected!.square).toBe(12);
	});
});
