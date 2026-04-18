import { Square } from '../state/boardTypes';

/**
 * Dirty layer flags for precise invalidation.
 * Use bitmask to allow combining layers; renderer/scheduler will interpret these.
 */
export enum DirtyLayer {
	Board = 1, // 1 << 0,
	Pieces = 2, // 1 << 1,
	Drag = 4, // 1 << 2,
	All = Board | Pieces | Drag
}

export interface InvalidationStateExtensionInternal {
	layers: number;
	squares: Set<Square>;
}

export interface InvalidationStateExtensionSnapshot {
	readonly layers: number;
	// If squares is empty - full redraw is implied
	readonly squares: ReadonlySet<Square>;
}

/**
 * Invalidation internal payload.
 * - layers: DirtyLayer bitmask
 * - squares: live mutable set of dirty squares
 */
export interface InvalidationStateInternal {
	layers: number;
	squares: Set<Square>;
	extensions: Record<string, InvalidationStateExtensionInternal>;
}

/**
 * Invalidation payload shape emitted by the scheduler to the renderer.
 */
export interface InvalidationStateRenderSnapshot {
	readonly layers: number;
	// If squares is empty - full redraw is implied
	readonly squares: ReadonlySet<Square>;
}

/**
 * Global invalidation payload shape used by runtime/scheduler.
 */
export interface InvalidationStateSnapshot {
	readonly layers: number;
	// If squares is empty - full redraw is implied
	readonly squares: ReadonlySet<Square>;
	readonly extensions: Record<string, InvalidationStateExtensionSnapshot>;
}

/**
 * Write-only handle passed to reducers that need to mark invalidation.
 * Reducers that receive this can signal which layers or squares need re-rendering.
 * Reducers that do not receive this do not directly mark invalidation.
 */
export interface InvalidationWriter {
	markLayer(layerMask: number): void;
	markSquares(layerMask: number, squares: Square | Iterable<Square>): void;
}
