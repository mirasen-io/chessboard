import { ReadonlyDeep } from 'type-fest';
import { NonEmptyPieceCode, Square } from '../../board/types/internal.js';
import { InteractionStateMutationSession } from '../mutation.js';
import { MovabilityInput } from './input.js';
import {
	DragSession,
	DragSessionSnapshot,
	Movability,
	MovabilitySnapshot,
	MoveDestinationSnapshot
} from './internal.js';

export interface InteractionStateSelected {
	square: Square;
	pieceCode: NonEmptyPieceCode;
}

export interface InteractionStateInternal {
	selected: InteractionStateSelected | null;
	movability: Movability;
	activeDestinations: ReadonlyMap<Square, MoveDestinationSnapshot>;
	dragSession: DragSession | null;
}

export type InteractionStateSnapshot = ReadonlyDeep<InteractionStateInternal>;

export interface InteractionStateInitOptions {
	movability?: MovabilityInput;
}

export interface InteractionState {
	readonly selected: InteractionStateSelected | null;
	setSelected(
		selected: InteractionStateSelected | null,
		mutationSession: InteractionStateMutationSession
	): boolean;
	readonly movability: MovabilitySnapshot;
	setMovability(
		movability: MovabilityInput,
		mutationSession: InteractionStateMutationSession
	): boolean;
	readonly activeDestinations: ReadonlyMap<Square, MoveDestinationSnapshot>;
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
