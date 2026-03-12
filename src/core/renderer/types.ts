/**
 * Renderer contracts (Phase 1/3).
 * - Purpose: define the minimal public contracts between scheduler/state and renderer.
 * - The renderer interprets DirtyLayer bitmask and (optionally) a set of specific squares.
 */

import type { InvalidationStateSnapshot } from '../scheduler/types';
import type { BoardStateSnapshot, Color, Square } from '../state/boardTypes';

/**
 * Renderer-owned visual configuration.
 * Contains only base board rendering config actually owned by the core renderer.
 */
export interface RenderConfig {
	light: string; // board light square color
	dark: string; // board dark square color
	coords?: {
		light: string; // coordinate text color on dark squares
		dark: string; // coordinate text color on light squares
	};
}

/**
 * Default renderer configuration.
 */
export const DEFAULT_RENDER_CONFIG: RenderConfig = {
	light: '#f0d9b5',
	dark: '#b58863',
	coords: {
		light: '#f0d9b5',
		dark: '#b58863'
	}
};

/**
 * Board geometry computed for a given mount size and orientation.
 * - squareRect returns the top-left pixel position and side length for a given square index (0..63).
 *   Coordinates are in the local SVG space with origin at the top-left corner.
 */
export interface RenderGeometry {
	boardSize: number; // total board side in px
	squareSize: number; // derived: boardSize / 8
	orientation: Color; // 'white' or 'black', affects square indexing and coordinate rendering
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
	render(
		board: BoardStateSnapshot,
		invalidation: InvalidationStateSnapshot,
		geometry: RenderGeometry
	): void;
}
