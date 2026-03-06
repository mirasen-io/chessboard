/**
 * Invalidation derivation from internal dirty flags.
 * Pure function: reads InternalState dirty fields and returns an Invalidation payload.
 */

import type { Invalidation } from '../renderer/types';
import type { InternalState } from '../state/boardState';

/**
 * Compute invalidation payload from state's accumulated dirty flags.
 * - layers: DirtyLayer bitmask
 * - squares: a shallow copy of dirtySquares (if non-empty)
 *
 * Note: This function is side-effect free; clearing of dirty flags is done by the scheduler
 * after the renderer completes a frame.
 */
export function computeInvalidation(state: InternalState): Invalidation {
	const layers = state.dirtyLayers;
	const hasSquares = state.dirtySquares.size > 0;
	return {
		layers,
		squares: hasSquares ? new Set(state.dirtySquares) : undefined
	};
}
