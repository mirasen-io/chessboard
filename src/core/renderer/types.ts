/**
 * Renderer contracts.
 * - Purpose: define the minimal public contracts between runtime/state and renderer.
 * - The renderer interprets DirtyLayer bitmask and (optionally) a set of specific squares.
 */

import type { AnimationSession } from '../animation/types';
import { ExtensionSlotName } from '../extensions/types';
import type { InvalidationStateRenderSnapshot } from '../scheduler/types';
import type { BoardStateSnapshot, Color, Square } from '../state/boardTypes';
import type { InteractionStateSnapshot } from '../state/interactionTypes';

/**
 * Board-local pointer coordinates for drag visual positioning.
 */
export interface BoardPoint {
	x: number;
	y: number;
}

/**
 * Runtime-owned transient visual state passed to renderer.
 */
export interface TransientVisualState {
	/** Board-local pointer coordinates for drag visual positioning. Null when no drag is active. */
	dragPointer: BoardPoint | null;
	/** One-shot flag: skip committed move animation for the next render cycle. Runtime-owned. */
	skipNextCommittedAnimation?: boolean;
}

export type TransientVisualsMutationCause =
	| 'transientVisuals.setDragPointer'
	| 'transientVisuals.setSkipNextCommittedAnimation';

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
 * Pass-specific render context types for the split renderer API.
 * Phase 3.10: Symmetric contexts for board/animation/drag rendering passes.
 */

/**
 * Context for renderBoard pass: baseline board presentation with suppression.
 */
export interface BoardRenderContext {
	board: BoardStateSnapshot;
	geometry: RenderGeometry;
	invalidation: InvalidationStateRenderSnapshot;
	suppressedPieceIds: ReadonlySet<number>;
}

/**
 * Context for renderAnimations pass: committed animation overlay.
 */
export interface AnimationRenderContext {
	session: AnimationSession | null;
	board: BoardStateSnapshot;
	geometry: RenderGeometry;
}

/**
 * Context for renderDrag pass: live interaction transient visuals.
 */
export interface DragRenderContext {
	interaction: InteractionStateSnapshot;
	transientVisuals: TransientVisualState;
	board: BoardStateSnapshot;
	geometry: RenderGeometry;
}

/**
 * Minimal renderer interface called by the runtime via the scheduler render callback.
 * Phase 3.10: Split into three explicit rendering passes.
 * Phase 4.2a: Extension slot allocation methods.
 * - mount/unmount attach/detach DOM.
 * - renderBoard: baseline board presentation with suppression.
 * - renderAnimations: committed animation overlay (or cleanup if session is null).
 * - renderDrag: live interaction transient visuals.
 * - allocateExtensionSlots: allocate slot roots for an extension (returns partial record matching requested slots).
 * - removeExtensionSlots: clean up slot roots for an extension.
 */
export interface Renderer {
	mount(container: HTMLElement): void;
	unmount(): void;
	renderBoard(ctx: BoardRenderContext): void;
	renderAnimations(ctx: AnimationRenderContext): void;
	renderDrag(ctx: DragRenderContext): void;
	allocateExtensionSlots(
		extensionId: string,
		slotNames: readonly ExtensionSlotName[]
	): Partial<Record<ExtensionSlotName, SVGGElement>>;
	removeExtensionSlots(extensionId: string): void;
}
