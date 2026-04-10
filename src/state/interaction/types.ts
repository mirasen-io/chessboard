import type { ReadonlyDeep } from 'type-fest';
import type { Square } from '../board/types';
import type { InteractionStateMutationSession } from './mutation';

export interface DragSession {
	fromSquare: Square;
}
export type DragSessionSnapshot = ReadonlyDeep<DragSession>;

// Maps source square to array of destination squares
export type MovabilityDestinationsRecord = Partial<Record<Square, readonly Square[]>>;
// Returns undefined if source is not movable, otherwise array of destinations
export type MovabilityResolver = (source: Square) => readonly Square[] | undefined;
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

export interface InteractionStateInternal {
	selectedSquare: Square | null;
	movability: Movability;
	activeDestinations: ReadonlySet<Square>;
	dragSession: DragSession | null;
	currentTarget: Square | null;
	releaseTargetingActive: boolean;
}

export type InteractionStateSnapshot = ReadonlyDeep<InteractionStateInternal>;

export interface InteractionStateInitOptions {
	movability?: Movability;
}

export interface InteractionState {
	readonly selectedSquare: Square | null;
	setSelectedSquare(sq: Square | null, mutationSession: InteractionStateMutationSession): boolean;
	readonly movability: MovabilitySnapshot;
	setMovability(
		movability: MovabilitySnapshot,
		mutationSession: InteractionStateMutationSession
	): boolean;
	readonly activeDestinations: ReadonlySet<Square>;
	readonly dragSession: DragSessionSnapshot | null;
	setDragSession(
		session: DragSessionSnapshot | null,
		mutationSession: InteractionStateMutationSession
	): boolean;
	readonly currentTarget: Square | null;
	setCurrentTarget(sq: Square | null, mutationSession: InteractionStateMutationSession): boolean;
	readonly releaseTargetingActive: boolean;
	setReleaseTargetingActive(
		active: boolean,
		mutationSession: InteractionStateMutationSession
	): boolean;
	clear(mutationSession: InteractionStateMutationSession): boolean;
	clearActive(mutationSession: InteractionStateMutationSession): boolean;
	getSnapshot(): InteractionStateSnapshot;
}
