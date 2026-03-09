/**
 * Input contracts: normalized board-aware events and ephemeral overlay view.
 * - Purpose: translate DOM pointer/mouse/touch into canonical InputEvent,
 *   maintain lightweight OverlayView (drag ghost, hover), and remain
 *   rule-agnostic and renderer-agnostic.
 */

import type { Square } from '../state/types';

/** Mouse/pointer button: left(0), middle(1), right(2) */
export type PointerButton = 0 | 1 | 2;

export interface Modifiers {
	altKey: boolean;
	ctrlKey: boolean;
	shiftKey: boolean;
	metaKey: boolean;
}

export interface ClientPoint {
	x: number;
	y: number;
}

/**
 * Canonical, board-aware input events emitted by the InputController.
 * Notes:
 * `square` is provided when the controller can resolve client coords to a board square.
 * - Drag lifecycle is derived from pointer lifecycle when a threshold is exceeded.
 */
export type InputEvent =
	| {
			kind: 'pointer:start';
			pointerId: number;
			client: ClientPoint;
			button: PointerButton;
			modifiers: Modifiers;
			square?: Square;
	  }
	| {
			kind: 'pointer:move';
			pointerId: number;
			client: ClientPoint;
			square?: Square;
	  }
	| {
			kind: 'pointer:end';
			pointerId: number;
			client: ClientPoint;
			releasedButton?: PointerButton;
			canceled?: boolean;
			square?: Square;
	  }
	| {
			kind: 'drag:start';
			pointerId: number;
			from: Square;
			pieceCode: number;
			client: ClientPoint;
	  }
	| {
			kind: 'drag:move';
			pointerId: number;
			from: Square;
			to?: Square;
			client: ClientPoint;
	  }
	| {
			kind: 'drag:end';
			pointerId: number;
			from: Square;
			to?: Square;
			dropAccepted: boolean;
			client: ClientPoint;
	  }
	| {
			kind: 'click:square';
			square: Square;
			button: PointerButton;
			modifiers: Modifiers;
	  }
	| {
			kind: 'hover:change';
			square: Square | null;
	  };

/**
 * Extension dispatch outcome contract.
 * Extensions may signal to stop propagation of further handlers
 * or request preventing default DOM behavior (when applicable).
 */
export type InputOutcome = {
	stopPropagation?: boolean;
	preventDefault?: boolean;
} | void;

/**
 * Ephemeral overlay view owned by InputController.
 * Renderer uses this to draw drag ghost, hover highlight, etc.
 * This does NOT mutate the board state.
 */
export interface OverlayView {
	hover: Square | null;
	dragging?: {
		from: Square;
		to?: Square;
		pieceCode: number;
		client: ClientPoint;
	};
}

/**
 * Geometry provider used by InputController to map client coordinates
 * to board squares. Provided by the facade/renderer and updated on resize/orientation.
 */
export interface InputGeometry {
	clientToSquare(client: ClientPoint): Square | null;
}
