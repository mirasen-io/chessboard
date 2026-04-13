import type { ReadonlyDeep } from 'type-fest';
import type { MoveDestination, MoveDestinationInput, Square, SquareInput } from '../board/types';
import type { InteractionStateMutationSession } from './mutation';

export interface DragSession {
	type: 'lifted-piece-drag' | 'release-targeting';
	sourceSquare: Square;
	sourcePieceCode: number;
	targetSquare: Square | null;
}
export type DragSessionSnapshot = ReadonlyDeep<DragSession>;

// Maps source square to array of destination squares
export type MovabilityDestinationsRecord = Partial<
	Record<SquareInput, readonly MoveDestinationInput[]>
>;
// Returns undefined if source is not movable, otherwise array of destinations
export type MovabilityResolver = (
	source: SquareInput
) => readonly MoveDestinationInput[] | undefined;
export type MovabilityDestinations = MovabilityDestinationsRecord | MovabilityResolver;

export type StrictMovability = {
	mode: 'strict';
	destinations: MovabilityDestinations;
};

export type FreeMovability = {
	mode: 'free';
};

// Disables move interaction only, not all board interaction
export type DisabledMovability = {
	mode: 'disabled';
};

export type Movability = StrictMovability | FreeMovability | DisabledMovability;
export type MovabilitySnapshot = ReadonlyDeep<Movability>;

export interface InteractionStateSelected {
	square: Square;
	pieceCode: number;
}

export interface InteractionStateInternal {
	selected: InteractionStateSelected | null;
	movability: Movability;
	activeDestinations: ReadonlyMap<Square, ReadonlyDeep<MoveDestination>>;
	dragSession: DragSession | null;
}

export type InteractionStateSnapshot = ReadonlyDeep<InteractionStateInternal>;

export interface InteractionStateInitOptions {
	movability?: Movability;
}

export interface InteractionState {
	readonly selected: InteractionStateSelected | null;
	setSelected(
		selected: InteractionStateSelected | null,
		mutationSession: InteractionStateMutationSession
	): boolean;
	readonly movability: MovabilitySnapshot;
	setMovability(
		movability: MovabilitySnapshot,
		mutationSession: InteractionStateMutationSession
	): boolean;
	readonly activeDestinations: ReadonlyMap<Square, ReadonlyDeep<MoveDestination>>;
	updateActiveDestinations(mutationSession: InteractionStateMutationSession): boolean;
	readonly dragSession: DragSessionSnapshot | null;
	setDragSession(
		session: DragSessionSnapshot | null,
		mutationSession: InteractionStateMutationSession
	): boolean;
	updateDragSessionCurrentTarget(
		sq: Square | null,
		mutationSession: InteractionStateMutationSession
	): boolean;
	clear(mutationSession: InteractionStateMutationSession): boolean;
	clearActive(mutationSession: InteractionStateMutationSession): boolean;
	getSnapshot(): InteractionStateSnapshot;
}
