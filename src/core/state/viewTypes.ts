import { Color, Square } from './boardTypes';

export type Orientation = Color; // For clarity in context where it applies

// Movability types for externally-provided interaction policy
export type MovableColor = 'white' | 'black' | 'both';

export type StrictMovability = {
	mode: 'strict';
	color: MovableColor;
	destinations: Partial<Record<Square, readonly Square[]>>;
};

export type FreeMovability = {
	mode: 'free';
	color: MovableColor;
};

// Disables move interaction only, not all board interaction
export type DisabledMovability = {
	mode: 'disabled';
};

export type Movability = StrictMovability | FreeMovability | DisabledMovability;

/**
 * Internal mutable view state used by reducers/runtime.
 * Not intended as a renderer- or consumer-facing contract.
 */
export interface ViewStateInternal {
	orientation: Orientation;
	selected: Square | null;
	movability: Movability;
}

/**
 * State snapshot shape exposed to consumers.
 */
export interface ViewStateSnapshot {
	readonly orientation: Orientation;
	readonly selected: Square | null;
	readonly movability: Movability;
}
