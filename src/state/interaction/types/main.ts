import type { ReadonlyDeep } from 'type-fest';
import type { NonEmptyPieceCode, Square } from '../../board/types/internal.js';
import type { InteractionStateMutationSession } from '../mutation.js';
import type { InteractionConfig } from './config.js';
import type { InteractionConfigInput, MovabilityInput } from './input.js';
import type {
	DragSession,
	DragSessionSnapshot,
	InteractionConfigSnapshot,
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
	config: InteractionConfig;
}

export type InteractionStateSnapshot = ReadonlyDeep<InteractionStateInternal>;

export interface InteractionStateInitOptions {
	movability?: MovabilityInput;
	config?: InteractionConfigInput;
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
	setConfig(
		config: InteractionConfigInput,
		mutationSession: InteractionStateMutationSession
	): boolean;
	getConfig(): InteractionConfigSnapshot;
	getSnapshot(): InteractionStateSnapshot;
}
