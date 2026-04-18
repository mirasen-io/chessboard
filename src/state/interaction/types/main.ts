import { ReadonlyDeep } from 'type-fest';
import { NonEmptyPieceCode, Square } from '../../board/types/internal';
import { InteractionStateMutationSession } from '../mutation';
import { MovabilityInput } from './input';
import {
	DragSession,
	DragSessionSnapshot,
	Movability,
	MovabilitySnapshot,
	MoveDestinationSnapshot
} from './internal';

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
