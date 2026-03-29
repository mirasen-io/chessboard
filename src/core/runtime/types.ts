import {
	BoardStateInitOptions,
	ColorInput,
	Move,
	MoveInput,
	PositionInput,
	Square,
	SquareInput
} from '../state/board/types';
import { BoardRuntimeStateStateInternal } from '../state/types';
import { Movability, ViewStateInitOptions } from '../state/view/types';

export interface BoardRuntimeStateInternalMount {
	container: HTMLElement;
}

export interface BoardRuntimeStateInternal {
	state: BoardRuntimeStateStateInternal;
}

export interface BoardRuntimeInitOptions {
	// renderer: Renderer;
	board?: BoardStateInitOptions;
	view?: ViewStateInitOptions;
	// extensions?: BoardExtensionDefinitionInternal[];
}

/**
 * Public interface for the internal runtime.
 * Orchestrates board state, view state, interaction state, and invalidation.
 * Board/view/interaction reducers own mutation logic; the runtime coordinates scheduling
 * and geometry updates in response to state changes.
 */
export interface BoardRuntime {
	// Lifecycle
	mount(container: HTMLElement): void;
	destroy(): void;
	// Board state
	setPosition(input: PositionInput): boolean;
	setTurn(turn: ColorInput): boolean;
	move(move: MoveInput): Move;
	// View state
	setOrientation(orientation: ColorInput): boolean;
	setMovability(movability: Movability): boolean;
	// Interaction — semantic selection transition
	// Synchronized: sets selectedSquare + derives destinations + clears drag/target.
	// Throws if a drag session is active (use cancelInteraction() first).
	// Does NOT check occupancy, color, or legality — "select a square", not "select a piece".
	select(square: SquareInput | null): boolean;
	// cancelInteraction: clear active interaction mode and currentTarget, preserve selection context.
	// Clears dragSession, currentTarget, and releaseTargetingActive.
	// Keeps selectedSquare + destinations.
	cancelInteraction(): boolean;
	// Helpers
	canStartMoveFrom(from: Square): boolean;
	isMoveAttemptAllowed(from: Square, to: Square): boolean;
}
