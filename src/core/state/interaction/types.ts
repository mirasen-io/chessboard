import type { ReadonlyDeep } from 'type-fest';
import type { Square } from '../board/types';
import type { InteractionMutationSession } from './mutation';

/**
 * Active drag session facts.
 * Captures the origin square of the drag.
 * Piece context is derived from boardState.pieces[fromSquare] when needed.
 * No visual/pointer coordinates — those belong in the input layer.
 */
export interface DragSession {
	fromSquare: Square;
}
export type DragSessionSnapshot = ReadonlyDeep<DragSession>;

/**
 * Internal mutable interaction state owned by the runtime.
 *
 * Owns user interaction facts only:
 * - selectedSquare: the currently selected square (null = nothing selected).
 *   Selected piece context is derived from boardState.pieces[selectedSquare].
 * - destinations: the active destination set for the current selected/drag source square only.
 *   [] means no active destinations. Stored here so consumers read one flat list
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
	destinations: readonly Square[];
	dragSession: DragSession | null;
	currentTarget: Square | null;
	releaseTargetingActive: boolean;
}

/**
 * Read-only snapshot of interaction state for consumers and extensions.
 */
export type InteractionStateSnapshot = ReadonlyDeep<InteractionStateInternal>;

export interface InteractionState {
	getSelectedSquare(): Square | null;
	setSelectedSquare(sq: Square | null, mutationSession: InteractionMutationSession): boolean;
	getDestinations(): readonly Square[];
	setDestinations(
		dests: readonly Square[] | null,
		mutationSession: InteractionMutationSession
	): boolean;
	getDragSession(): DragSessionSnapshot | null;
	setDragSession(
		session: DragSessionSnapshot | null,
		mutationSession: InteractionMutationSession
	): boolean;
	getCurrentTarget(): Square | null;
	setCurrentTarget(sq: Square | null, mutationSession: InteractionMutationSession): boolean;
	getReleaseTargetingActive(): boolean;
	setReleaseTargetingActive(active: boolean, mutationSession: InteractionMutationSession): boolean;
	clear(mutationSession: InteractionMutationSession): boolean;
	clearActive(mutationSession: InteractionMutationSession): boolean;
	getSnapshot(): InteractionStateSnapshot;
}
