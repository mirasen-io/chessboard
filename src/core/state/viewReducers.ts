import { movabilitiesEqual } from '../helpers/movability';
import { DirtyLayer, InvalidationWriter } from '../scheduler/types';
import type { ColorInput } from './boardTypes';
import { normalizeColor } from './normalize';
import type { Movability, ViewStateInternal } from './viewTypes';

/**
 * Set board orientation (view).
 * Takes an InvalidationWriter and marks DirtyLayer.All on change,
 * so the runtime can schedule a full re-render.
 */
export function setOrientation(
	state: ViewStateInternal,
	invalidation: InvalidationWriter,
	c: ColorInput
): boolean {
	const newOrient = normalizeColor(c);
	if (state.orientation === newOrient) return false; // no-op
	state.orientation = newOrient;
	invalidation.markLayer(DirtyLayer.All);
	return true;
}

/**
 * Set movability (externally-provided interaction policy).
 * No-op if movability is structurally equal to current value.
 * Does not take an InvalidationWriter and does not directly mark invalidation.
 */
export function setMovability(state: ViewStateInternal, m: Movability): boolean {
	if (movabilitiesEqual(state.movability, m)) return false; // no-op
	state.movability = m;
	return true;
}
