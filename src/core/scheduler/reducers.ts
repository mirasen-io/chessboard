import { Square } from '../state/boardTypes';
import { assertValidSquare } from '../state/coords';
import { InvalidationStateExtensionInternal, InvalidationStateInternal } from './types';

/**
 * Mark a specific square(s) as dirty (for region-specific invalidation).
 */
export function markDirtySquares(
	state: InvalidationStateInternal | InvalidationStateExtensionInternal,
	layerMask: number,
	sq: Square | Iterable<Square>
): void {
	state.layers |= layerMask;
	const squares = typeof sq === 'number' ? [sq] : sq;
	for (const s of squares) {
		assertValidSquare(s);
		state.squares.add(s);
	}
}

/**
 * Mark one or more layers dirty (bitmask).
 */
export function markDirtyLayer(
	state: InvalidationStateInternal | InvalidationStateExtensionInternal,
	layerMask: number
): void {
	state.layers |= layerMask;
	state.squares.clear(); // clearing targeted square scope because the dirty layer is now full-scope
}

/**
 * Clear all dirty flags.
 */
export function clearDirty(
	state: InvalidationStateInternal | InvalidationStateExtensionInternal
): void {
	state.squares.clear();
	state.layers = 0;
}

export function clearDirtyAll(state: InvalidationStateInternal): void {
	clearDirty(state);
	// clear extensions too
	for (const extState of Object.values(state.extensions)) {
		clearDirty(extState);
	}
}
