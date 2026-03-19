import { describe, expect, it } from 'vitest';
import type { Square } from '../../../src/core/state/boardTypes';
import {
	createInteractionState,
	getInteractionStateSnapshot
} from '../../../src/core/state/interactionState';

describe('state/interactionState', () => {
	describe('createInteractionState', () => {
		it('creates state with all fields null by default', () => {
			const state = createInteractionState();

			expect(state.selectedSquare).toBeNull();
			expect(state.destinations).toBeNull();
			expect(state.dragSession).toBeNull();
			expect(state.currentTarget).toBeNull();
			expect(state.releaseTargetingActive).toBe(false);
		});

		it('contains exactly the five interaction-owned fields', () => {
			const state = createInteractionState();

			expect('selectedSquare' in state).toBe(true);
			expect('destinations' in state).toBe(true);
			expect('dragSession' in state).toBe(true);
			expect('currentTarget' in state).toBe(true);
			expect('releaseTargetingActive' in state).toBe(true);

			// Does NOT contain board-owned fields
			expect('pieces' in state).toBe(false);
			expect('turn' in state).toBe(false);

			// Does NOT contain view-owned fields
			expect('orientation' in state).toBe(false);
			expect('movability' in state).toBe(false);
		});
	});

	describe('getInteractionStateSnapshot', () => {
		it('snapshot reflects all-null initial state', () => {
			const state = createInteractionState();
			const snap = getInteractionStateSnapshot(state);

			expect(snap.selectedSquare).toBeNull();
			expect(snap.destinations).toBeNull();
			expect(snap.dragSession).toBeNull();
			expect(snap.currentTarget).toBeNull();
			expect(snap.releaseTargetingActive).toBe(false);
		});

		it('snapshot reflects current field values', () => {
			const state = createInteractionState();
			state.selectedSquare = 12 as Square;
			state.destinations = [20, 28] as Square[];
			state.currentTarget = 28 as Square;

			const snap = getInteractionStateSnapshot(state);

			expect(snap.selectedSquare).toBe(12);
			expect(snap.destinations).toEqual([20, 28]);
			expect(snap.currentTarget).toBe(28);
			expect(snap.dragSession).toBeNull();
			expect(snap.releaseTargetingActive).toBe(false);
		});

		it('snapshot reflects drag session', () => {
			const state = createInteractionState();
			state.dragSession = { fromSquare: 12 as Square };

			const snap = getInteractionStateSnapshot(state);

			expect(snap.dragSession).not.toBeNull();
			expect(snap.dragSession!.fromSquare).toBe(12);
		});

		it('snapshot is a separate object from internal state', () => {
			const state = createInteractionState();
			const snap = getInteractionStateSnapshot(state);

			expect(snap).not.toBe(state);
		});
	});
});
