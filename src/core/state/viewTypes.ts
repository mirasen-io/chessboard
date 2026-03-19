import { Color, Square } from './boardTypes';

export type Orientation = Color; // For clarity in context where it applies

export type StrictMovability = {
	mode: 'strict';
	destinations: Partial<Record<Square, readonly Square[]>>;
};

export type FreeMovability = {
	mode: 'free';
};

// Disables move interaction only, not all board interaction
export type DisabledMovability = {
	mode: 'disabled';
};

export type Movability = StrictMovability | FreeMovability | DisabledMovability;

/**
 * Internal mutable view/config state used by reducers/runtime.
 * Owns presentation config and interaction policy config.
 * User interaction facts (selection, destinations, drag) live in InteractionStateInternal.
 */
export interface ViewStateInternal {
	orientation: Orientation;
	movability: Movability;
}

/**
 * State snapshot shape exposed to consumers. Contains only view-owned fields; board state is separate.
 * Interaction state is separate.
 */
export interface ViewStateSnapshot {
	readonly orientation: Orientation;
	readonly movability: Movability;
}
