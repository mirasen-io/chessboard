/**
 * Renderer contracts (Phase 1/3).
 * - Purpose: define the minimal public contracts between scheduler/state and renderer.
 * - The renderer interprets DirtyLayer bitmask and (optionally) a set of specific squares.
 */

import type { Square, StateSnapshot } from '../state/types';

/**
 * Invalidation payload:
 * - layers: DirtyLayer bitmask (number) indicating which visual layers need redraw.
 * - squares: optional set of affected squares for region-specific updates (e.g., piece moves, highlights).
 *
 * Note: `layers` uses the DirtyLayer enum defined in ../state/types; we keep it as `number` here
 * to allow OR-combination without importing the enum in this file.
 */
export interface Invalidation {
	layers: number;
	squares?: Set<Square>;
}

/**
 * Board geometry computed for a given mount size and orientation.
 * - squareRect returns the top-left pixel position and side length for a given square index (0..63).
 *   Coordinates are in the local SVG space with origin at the top-left corner.
 */
export interface RenderGeometry {
	boardSize: number; // total board side in px
	squareSize: number; // derived: boardSize / 8
	squareRect(sq: Square): { x: number; y: number; size: number };
}

/**
 * Minimal renderer interface understood by the scheduler.
 * - mount/unmount attach/detach DOM.
 * - render applies updates according to invalidation.
 */
export interface Renderer {
	mount(container: HTMLElement): void;
	unmount(): void;
	render(state: StateSnapshot, geometry: RenderGeometry, invalidation: Invalidation): void;
}
