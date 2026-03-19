import { describe, expect, it } from 'vitest';
import type { Square } from '../../../src/core/state/boardTypes';
import {
	clearInteraction,
	setCurrentTarget,
	setDestinations,
	setDragSession,
	setReleaseTargetingActive,
	setSelectedSquare
} from '../../../src/core/state/interactionReducers';
import { createInteractionState } from '../../../src/core/state/interactionState';
import type { DragSession } from '../../../src/core/state/interactionTypes';

describe('state/interactionReducers', () => {
	describe('setSelectedSquare', () => {
		it('sets selected square and returns true when changed', () => {
			const state = createInteractionState();

			const changed = setSelectedSquare(state, 12 as Square);

			expect(changed).toBe(true);
			expect(state.selectedSquare).toBe(12);
		});

		it('clears selection with null and returns true when changed', () => {
			const state = createInteractionState();
			state.selectedSquare = 12 as Square;

			const changed = setSelectedSquare(state, null);

			expect(changed).toBe(true);
			expect(state.selectedSquare).toBeNull();
		});

		it('is a no-op and returns false when square is unchanged', () => {
			const state = createInteractionState();
			state.selectedSquare = 12 as Square;

			const changed = setSelectedSquare(state, 12 as Square);

			expect(changed).toBe(false);
			expect(state.selectedSquare).toBe(12);
		});

		it('is a no-op when clearing already-null selection', () => {
			const state = createInteractionState(); // selectedSquare = null

			const changed = setSelectedSquare(state, null);

			expect(changed).toBe(false);
		});

		it('accepts algebraic square string', () => {
			const state = createInteractionState();

			const changed = setSelectedSquare(state, 'e4');

			expect(changed).toBe(true);
			expect(state.selectedSquare).toBe(28); // e4 = 28
		});

		it('does not take an InvalidationWriter (no dirty side-effects)', () => {
			const state = createInteractionState();
			expect(() => setSelectedSquare(state, 12 as Square)).not.toThrow();
		});
	});

	describe('setDestinations', () => {
		it('sets destinations and returns true when changed', () => {
			const state = createInteractionState();
			const dests = [20, 28] as Square[];

			const changed = setDestinations(state, dests);

			expect(changed).toBe(true);
			expect(state.destinations).toBe(dests);
		});

		it('clears destinations with null and returns true when changed', () => {
			const state = createInteractionState();
			state.destinations = [20, 28] as Square[];

			const changed = setDestinations(state, null);

			expect(changed).toBe(true);
			expect(state.destinations).toBeNull();
		});

		it('is a no-op when same reference is set again', () => {
			const state = createInteractionState();
			const dests = [20, 28] as Square[];
			state.destinations = dests;

			const changed = setDestinations(state, dests);

			expect(changed).toBe(false);
		});

		it('is a no-op when clearing already-null destinations', () => {
			const state = createInteractionState(); // destinations = null

			const changed = setDestinations(state, null);

			expect(changed).toBe(false);
		});

		it('treats different array references as changed even if contents are equal', () => {
			const state = createInteractionState();
			state.destinations = [20, 28] as Square[];

			// Different reference, same contents
			const changed = setDestinations(state, [20, 28] as Square[]);

			expect(changed).toBe(true);
		});
	});

	describe('setDragSession', () => {
		it('sets drag session and returns true when changed', () => {
			const state = createInteractionState();
			const session: DragSession = { fromSquare: 12 as Square };

			const changed = setDragSession(state, session);

			expect(changed).toBe(true);
			expect(state.dragSession).toBe(session);
			expect(state.dragSession!.fromSquare).toBe(12);
		});

		it('clears drag session with null and returns true when changed', () => {
			const state = createInteractionState();
			state.dragSession = { fromSquare: 12 as Square };

			const changed = setDragSession(state, null);

			expect(changed).toBe(true);
			expect(state.dragSession).toBeNull();
		});

		it('is a no-op when same reference is set again', () => {
			const state = createInteractionState();
			const session: DragSession = { fromSquare: 12 as Square };
			state.dragSession = session;

			const changed = setDragSession(state, session);

			expect(changed).toBe(false);
		});

		it('is a no-op when clearing already-null drag session', () => {
			const state = createInteractionState(); // dragSession = null

			const changed = setDragSession(state, null);

			expect(changed).toBe(false);
		});
	});

	describe('setCurrentTarget', () => {
		it('sets current target and returns true when changed', () => {
			const state = createInteractionState();

			const changed = setCurrentTarget(state, 28 as Square);

			expect(changed).toBe(true);
			expect(state.currentTarget).toBe(28);
		});

		it('clears current target with null and returns true when changed', () => {
			const state = createInteractionState();
			state.currentTarget = 28 as Square;

			const changed = setCurrentTarget(state, null);

			expect(changed).toBe(true);
			expect(state.currentTarget).toBeNull();
		});

		it('is a no-op and returns false when target is unchanged', () => {
			const state = createInteractionState();
			state.currentTarget = 28 as Square;

			const changed = setCurrentTarget(state, 28 as Square);

			expect(changed).toBe(false);
		});

		it('is a no-op when clearing already-null target', () => {
			const state = createInteractionState(); // currentTarget = null

			const changed = setCurrentTarget(state, null);

			expect(changed).toBe(false);
		});

		it('accepts algebraic square string', () => {
			const state = createInteractionState();

			const changed = setCurrentTarget(state, 'e4');

			expect(changed).toBe(true);
			expect(state.currentTarget).toBe(28); // e4 = 28
		});
	});

	describe('setReleaseTargetingActive', () => {
		it('sets releaseTargetingActive to true and returns true when changed', () => {
			const state = createInteractionState();

			const changed = setReleaseTargetingActive(state, true);

			expect(changed).toBe(true);
			expect(state.releaseTargetingActive).toBe(true);
		});

		it('clears releaseTargetingActive to false and returns true when changed', () => {
			const state = createInteractionState();
			state.releaseTargetingActive = true;

			const changed = setReleaseTargetingActive(state, false);

			expect(changed).toBe(true);
			expect(state.releaseTargetingActive).toBe(false);
		});

		it('is a no-op and returns false when value is unchanged', () => {
			const state = createInteractionState();
			state.releaseTargetingActive = true;

			const changed = setReleaseTargetingActive(state, true);

			expect(changed).toBe(false);
			expect(state.releaseTargetingActive).toBe(true);
		});

		it('is a no-op when setting false when already false', () => {
			const state = createInteractionState(); // releaseTargetingActive = false

			const changed = setReleaseTargetingActive(state, false);

			expect(changed).toBe(false);
		});
	});

	describe('clearInteraction', () => {
		it('clears all fields and returns true when any field was set', () => {
			const state = createInteractionState();
			state.selectedSquare = 12 as Square;
			state.destinations = [20, 28] as Square[];
			state.dragSession = { fromSquare: 12 as Square };
			state.currentTarget = 28 as Square;
			state.releaseTargetingActive = true;

			const changed = clearInteraction(state);

			expect(changed).toBe(true);
			expect(state.selectedSquare).toBeNull();
			expect(state.destinations).toBeNull();
			expect(state.dragSession).toBeNull();
			expect(state.currentTarget).toBeNull();
			expect(state.releaseTargetingActive).toBe(false);
		});

		it('returns true when only one field was set', () => {
			const state = createInteractionState();
			state.selectedSquare = 12 as Square;

			const changed = clearInteraction(state);

			expect(changed).toBe(true);
			expect(state.selectedSquare).toBeNull();
		});

		it('is a no-op and returns false when all fields are already null', () => {
			const state = createInteractionState(); // all null

			const changed = clearInteraction(state);

			expect(changed).toBe(false);
		});

		it('leaves all fields null after clearing', () => {
			const state = createInteractionState();
			state.selectedSquare = 12 as Square;
			state.destinations = [20] as Square[];

			clearInteraction(state);

			expect(state.selectedSquare).toBeNull();
			expect(state.destinations).toBeNull();
			expect(state.dragSession).toBeNull();
			expect(state.currentTarget).toBeNull();
			expect(state.releaseTargetingActive).toBe(false);
		});
	});
});
