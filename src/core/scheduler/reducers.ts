import { Square } from '../state/boardTypes';
import { assertValidSquare } from '../state/coords';
import { InvalidationStateInternal } from './types';

/**
 * Mark a specific square(s) as dirty (for region-specific invalidation).
 */
export function markDirtySquares(
	state: InvalidationStateInternal,
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
export function markDirtyLayer(state: InvalidationStateInternal, layerMask: number): void {
	state.layers |= layerMask;
	state.squares.clear(); // Clear square-specific dirty flags since whole layer is dirty
}

/**
 * Clear all dirty flags.
 */
export function clearDirty(state: InvalidationStateInternal): void {
	state.squares.clear();
	state.layers = 0;
}
