import { describe, expect, it } from 'vitest';
import { type Square } from '../../../src/state/board/types/internal.js';
import {
	interactionClear,
	interactionClearActive,
	interactionSetActiveDestinations,
	interactionSetDragSession,
	interactionSetMovability,
	interactionSetSelected,
	interactionUpdateDragSessionCurrentTarget
} from '../../../src/state/interaction/reducers.js';
import {
	MovabilityModeCode,
	type MoveDestinationSnapshot
} from '../../../src/state/interaction/types/internal.js';
import {
	makeDragSessionCoreOwned,
	makeInteractionStateInternal,
	makeSelected
} from '../../test-utils/state/interaction/fixtures.js';

describe('interactionSetSelected', () => {
	it('sets selected and returns true', () => {
		const state = makeInteractionStateInternal();
		const sel = makeSelected();
		expect(interactionSetSelected(state, sel)).toBe(true);
		expect(state.selected).toEqual(sel);
	});

	it('returns false when same selected', () => {
		const sel = makeSelected();
		const state = makeInteractionStateInternal({ selected: sel });
		expect(interactionSetSelected(state, makeSelected())).toBe(false);
	});

	it('null clears selected', () => {
		const state = makeInteractionStateInternal({ selected: makeSelected() });
		expect(interactionSetSelected(state, null)).toBe(true);
		expect(state.selected).toBeNull();
	});
});

describe('interactionSetMovability', () => {
	it('sets movability and returns true', () => {
		const state = makeInteractionStateInternal();
		const free = { mode: MovabilityModeCode.Free as const };
		expect(interactionSetMovability(state, free)).toBe(true);
		expect(state.movability.mode).toBe(MovabilityModeCode.Free);
	});

	it('returns false when same movability', () => {
		const state = makeInteractionStateInternal();
		expect(interactionSetMovability(state, { mode: MovabilityModeCode.Disabled })).toBe(false);
	});
});

describe('interactionSetActiveDestinations', () => {
	it('sets destinations and returns true', () => {
		const state = makeInteractionStateInternal();
		const dests = new Map<Square, MoveDestinationSnapshot>([[28 as Square, { to: 28 as Square }]]);
		expect(interactionSetActiveDestinations(state, dests)).toBe(true);
		expect(state.activeDestinations.size).toBe(1);
	});

	it('returns false when same destinations', () => {
		const dests = new Map<Square, MoveDestinationSnapshot>([[28 as Square, { to: 28 as Square }]]);
		const state = makeInteractionStateInternal({ activeDestinations: dests });
		const sameDests = new Map<Square, MoveDestinationSnapshot>([
			[28 as Square, { to: 28 as Square }]
		]);
		expect(interactionSetActiveDestinations(state, sameDests)).toBe(false);
	});
});

describe('interactionSetDragSession', () => {
	it('sets drag session and returns true', () => {
		const state = makeInteractionStateInternal();
		const session = makeDragSessionCoreOwned({ startButton: 0 });
		expect(interactionSetDragSession(state, session)).toBe(true);
		expect(state.dragSession).not.toBeNull();
	});

	it('returns false when same session fields', () => {
		const session = makeDragSessionCoreOwned({ startButton: 0 });
		const state = makeInteractionStateInternal({ dragSession: { ...session } });
		expect(interactionSetDragSession(state, session)).toBe(false);
	});

	it('null clears drag session', () => {
		const state = makeInteractionStateInternal({
			dragSession: makeDragSessionCoreOwned({ startButton: 0 })
		});
		expect(interactionSetDragSession(state, null)).toBe(true);
		expect(state.dragSession).toBeNull();
	});
});

describe('interactionUpdateDragSessionCurrentTarget', () => {
	it('updates target square', () => {
		const state = makeInteractionStateInternal({
			dragSession: makeDragSessionCoreOwned({ startButton: 0 })
		});
		expect(interactionUpdateDragSessionCurrentTarget(state, 28 as Square)).toBe(true);
		expect(state.dragSession!.targetSquare).toBe(28);
	});

	it('throws when no drag session', () => {
		const state = makeInteractionStateInternal();
		expect(() => interactionUpdateDragSessionCurrentTarget(state, 28 as Square)).toThrow();
	});
});

describe('interactionClear', () => {
	it('clears all fields and returns true', () => {
		const state = makeInteractionStateInternal({
			selected: makeSelected(),
			dragSession: makeDragSessionCoreOwned({ startButton: 0 })
		});
		expect(interactionClear(state)).toBe(true);
		expect(state.selected).toBeNull();
		expect(state.dragSession).toBeNull();
		expect(state.activeDestinations.size).toBe(0);
	});

	it('returns false when already clear', () => {
		const state = makeInteractionStateInternal();
		expect(interactionClear(state)).toBe(false);
	});
});

describe('interactionClearActive', () => {
	it('clears drag session only and returns true', () => {
		const state = makeInteractionStateInternal({
			selected: makeSelected(),
			dragSession: makeDragSessionCoreOwned({ startButton: 0 })
		});
		expect(interactionClearActive(state)).toBe(true);
		expect(state.dragSession).toBeNull();
		// selected should remain
		expect(state.selected).not.toBeNull();
	});

	it('returns false when no drag session', () => {
		const state = makeInteractionStateInternal({ selected: makeSelected() });
		expect(interactionClearActive(state)).toBe(false);
	});
});
