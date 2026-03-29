import { cloneDeep } from 'lodash-es';
import { normalizeColor } from '../board/normalize';
import type { ColorInput } from '../board/types';
import { movabilitiesEqual } from './helper';
import type { MovabilitySnapshot, ViewStateInternal } from './types';

/**
 * Set board orientation (view).
 * Takes an InvalidationWriter and marks DirtyLayer.All on change,
 * so the runtime can schedule a full re-render.
 */
export function viewSetOrientation(state: ViewStateInternal, c: ColorInput): boolean {
	const newOrient = normalizeColor(c);
	if (state.orientation === newOrient) return false; // no-op
	state.orientation = newOrient;
	return true;
}

/**
 * Set movability (externally-provided interaction policy).
 * No-op if movability is structurally equal to current value.
 * Does not take an InvalidationWriter and does not directly mark invalidation.
 */
export function viewSetMovability(state: ViewStateInternal, m: MovabilitySnapshot): boolean {
	if (movabilitiesEqual(state.movability, m)) return false; // no-op
	state.movability = cloneDeep(m);
	return true;
}
