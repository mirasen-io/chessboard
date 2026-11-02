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

	describe('activatePendingLiftedDragSession', () => {
		it('transitions a pending core-owned lifted-piece session to active, preserving identity and dropping pending-only fields', () => {
			const state = createInteractionState({});
			const session = createInteractionMutationSession();
			state.setSelected(makeSelected(), session);
			const pending = makeDragSessionCoreOwned({
				phase: 'pending',
				sourceSquare: 12 as Square,
				sourcePieceCode: PieceCode.WhitePawn,
				targetSquare: 12 as Square,
				startButton: 0,
				startPoint: { x: 1, y: 2 },
				thresholdPx: 4
			});
			state.setDragSession(pending, session);

			const session2 = createInteractionMutationSession();
			const changed = state.activatePendingLiftedDragSession(28 as Square, session2);

			expect(changed).toBe(true);
			expect(
				session2.hasMutation({
					causes: ['state.interaction.activatePendingLiftedDragSession']
				})
			).toBe(true);
			const drag = state.dragSession!;
			expect(drag.owner).toBe('core');
			expect(drag.type).toBe('lifted-piece-drag');
			if (drag.type !== 'lifted-piece-drag' || drag.owner !== 'core') {
				throw new Error('expected core-owned lifted-piece-drag');
			}
			expect(drag.phase).toBe('active');
			expect(drag.sourceSquare).toBe(12);
			expect(drag.sourcePieceCode).toBe(PieceCode.WhitePawn);
			expect(drag.targetSquare).toBe(28);
			expect(drag.startButton).toBe(0);
			expect((drag as unknown as { startPoint?: unknown }).startPoint).toBeUndefined();
			expect((drag as unknown as { thresholdPx?: unknown }).thresholdPx).toBeUndefined();
		});

		it('asserts when current dragSession is null', () => {
			const state = createInteractionState({});
			const session = createInteractionMutationSession();
			expect(() => state.activatePendingLiftedDragSession(28 as Square, session)).toThrow();
		});

		it('asserts when current dragSession is release-targeting', () => {
			const state = createInteractionState({});
			const session = createInteractionMutationSession();
			state.setSelected(makeSelected(), session);
			state.setDragSession(
				makeDragSessionCoreOwned({ type: 'release-targeting', startButton: 0 }),
				session
			);

			const session2 = createInteractionMutationSession();
			expect(() => state.activatePendingLiftedDragSession(28 as Square, session2)).toThrow();
		});

		it('transitions an extension-owned pending lifted-piece session to active, preserving owner', () => {
			const state = createInteractionState({});
			const session = createInteractionMutationSession();
			state.setDragSession(
				{
					owner: 'my-ext',
					type: 'lifted-piece-drag',
					phase: 'pending',
					sourceSquare: 12 as Square,
					sourcePieceCode: PieceCode.WhitePawn,
					targetSquare: 12 as Square,
					startButton: 0,
					startPoint: { x: 0, y: 0 },
					thresholdPx: 4
				},
				session
			);

			const session2 = createInteractionMutationSession();
			const changed = state.activatePendingLiftedDragSession(28 as Square, session2);

			expect(changed).toBe(true);
			expect(
				session2.hasMutation({
					causes: ['state.interaction.activatePendingLiftedDragSession']
				})
			).toBe(true);
			const drag = state.dragSession!;
			expect(drag.owner).toBe('my-ext');
			expect(drag.type).toBe('lifted-piece-drag');
			if (drag.type !== 'lifted-piece-drag') {
				throw new Error('expected lifted-piece-drag');
			}
			expect(drag.phase).toBe('active');
			expect(drag.sourceSquare).toBe(12);
			expect(drag.sourcePieceCode).toBe(PieceCode.WhitePawn);
			expect(drag.targetSquare).toBe(28);
			expect(drag.startButton).toBe(0);
			expect((drag as unknown as { startPoint?: unknown }).startPoint).toBeUndefined();
			expect((drag as unknown as { thresholdPx?: unknown }).thresholdPx).toBeUndefined();
		});

		it('asserts when current dragSession is already an active lifted-piece session', () => {
			const state = createInteractionState({});
			const session = createInteractionMutationSession();
			state.setSelected(makeSelected(), session);
			state.setDragSession(makeDragSessionCoreOwned({ phase: 'active', startButton: 0 }), session);

			const session2 = createInteractionMutationSession();
			expect(() => state.activatePendingLiftedDragSession(28 as Square, session2)).toThrow();
		});
	});
});
