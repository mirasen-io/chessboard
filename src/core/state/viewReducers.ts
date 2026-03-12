import { DirtyLayer, InvalidationWriter } from '../scheduler/types';
import type { ColorInput, Square, SquareInput, SquareString } from './boardTypes';
import { toValidSquare } from './coords';
import { normalizeColor } from './normalize';
import { Movability, ViewStateInternal } from './viewTypes';

/**
 * Set board orientation (view).
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
 */
export function setMovability(state: ViewStateInternal, m: Movability): boolean {
	if (movabilityEquals(state.movability, m)) return false; // no-op
	state.movability = m;
	return true;
}

/**
 * Local helper for structural movability equality.
 */
function movabilityEquals(a: Movability, b: Movability): boolean {
	if (a === b) return true;
	if (a.mode !== b.mode) return false;

	if (a.mode === 'disabled' && b.mode === 'disabled') return true; // both disabled

	// Both have color (free or strict)
	if (a.mode === 'free' && b.mode === 'free') {
		return a.color === b.color;
	}

	// Both strict - compare color and destinations
	if (a.mode === 'strict' && b.mode === 'strict') {
		if (a.color !== b.color) return false;

		const aDests = a.destinations;
		const bDests = b.destinations;
		const aKeys = Object.keys(aDests).map(Number) as Square[];
		const bKeys = Object.keys(bDests).map(Number) as Square[];

		if (aKeys.length !== bKeys.length) return false;

		// Check if all keys in a exist in b with same values
		for (const sq of aKeys) {
			const aArr = aDests[sq];
			const bArr = bDests[sq];
			if (!aArr || !bArr) return false;
			if (aArr.length !== bArr.length) return false;
			for (let i = 0; i < aArr.length; i++) {
				if (aArr[i] !== bArr[i]) return false;
			}
		}

		return true;
	}

	return false;
}

/**
 * Select a square or clear selection with null.
 * Accepts numeric or algebraic square.
 */
export function select(state: ViewStateInternal, sq: SquareInput | null): boolean {
	const newSel: Square | null = sq === null ? null : toValidSquare(sq as Square | SquareString); // toValidSquare will validate the square input
	if (state.selected === newSel) return false; // no-op
	state.selected = newSel;
	return true;
}
