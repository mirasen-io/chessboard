import type { Square } from './boardTypes';

/**
 * Active drag session facts.
 * Captures the origin square of the drag.
 * Piece context is derived from boardState.pieces[fromSquare] when needed.
 * No visual/pointer coordinates — those belong in the input layer.
 */
export interface DragSession {
	fromSquare: Square;
}

/**
 * Internal mutable interaction state owned by the runtime.
 *
 * Owns user interaction facts only:
 * - selectedSquare: the currently selected square (null = nothing selected).
 *   Selected piece context is derived from boardState.pieces[selectedSquare].
 * - destinations: the active destination set for the current selected/drag source square only.
 *   Null means no active destinations. Stored here so consumers read one flat list
 *   rather than joining the full strict movability map with the active source square.
 * - dragSession: active drag state (null = no drag in progress).
 * - currentTarget: the square currently being targeted during drag or selection (null = none).
 *
 * Does NOT contain:
 * - orientation or movability (those are view/config state)
 * - visual/overlay data (those belong in extensions)
 * - pointer coordinates (those belong in the input layer)
 */
export interface InteractionStateInternal {
	selectedSquare: Square | null;
	destinations: readonly Square[] | null;
	dragSession: DragSession | null;
	currentTarget: Square | null;
	releaseTargetingActive: boolean;
}

/**
 * Read-only snapshot of interaction state for consumers and extensions.
 */
export interface InteractionStateSnapshot {
	readonly selectedSquare: Square | null;
	readonly destinations: readonly Square[] | null;
	readonly dragSession: DragSession | null;
	readonly currentTarget: Square | null;
	readonly releaseTargetingActive: boolean;
}
