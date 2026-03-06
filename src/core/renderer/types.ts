/**
 * Renderer contracts (Phase 1 - types only).
 * - Purpose: carry precise invalidation signals from the scheduler/state to the renderer.
 * - The renderer interprets DirtyLayer bitmask and (optionally) a set of specific squares.
 */

import type { Square } from '../state/types';

/**
 * Invalidation payload:
 * - layers: DirtyLayer bitmask (number) indicating which visual layers need redraw.
 * - squares: optional set of affected squares for region-specific updates (e.g., piece moves, highlights).
 *
 * Note: `layers` uses the DirtyLayer enum defined in ../state/types; we keep it as `number` here
 * to avoid coupling and allow OR-combination without importing the enum.
 */
export interface Invalidation {
	layers: number;
	squares?: Set<Square>;
}
