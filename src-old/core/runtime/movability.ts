/**
 * Pure movability consultation helpers for runtime.
 * These functions determine move eligibility based on current state and movability policy.
 *
 * Key principles:
 * - Consult state.movability only, NOT state.turn
 * - Return false if movability is disabled
 * - Check occupancy only (no color gating)
 * - For strict mode, consult destinations map
 */

import type { BoardStateInternal, Square } from '../state/boardTypes';
import { isEmpty } from '../state/encode';
import type { MovabilityDestinations, ViewStateInternal } from '../state/viewTypes';

/**
 * Internal helper: normalize destination lookup for a source square.
 * Handles both record and resolver-based destinations.
 *
 * @param destinations - MovabilityDestinations (record or resolver)
 * @param source - Source square to look up
 * @returns Array of destination squares, or undefined if source is not movable
 */
function getDestinationsForSource(
	destinations: MovabilityDestinations,
	source: Square
): readonly Square[] | undefined {
	if (typeof destinations === 'function') {
		return destinations(source);
	}
	return destinations[source];
}

/**
 * Determine if a move can be started from the given square.
 * This answers: "Can I pick up this piece?"
 *
 * Returns true only when:
 * - movability mode is not 'disabled'
 * - source square contains a piece
 * - for strict mode: destinations[from] exists and has length > 0
 * - for free mode: occupancy check is sufficient
 *
 * Does NOT consult state.turn.
 * Does NOT check piece color.
 * Does NOT require a target square.
 */
export function canStartMoveFrom(
	board: BoardStateInternal,
	view: ViewStateInternal,
	from: Square
): boolean {
	const movability = view.movability;
	const pieces = board.pieces;

	// Disabled mode
	if (movability.mode === 'disabled') {
		return false;
	}

	// Source square must contain a piece
	const pieceCode = pieces[from];
	if (isEmpty(pieceCode)) {
		return false;
	}

	// For strict mode, check if destinations exist and have length > 0
	if (movability.mode === 'strict') {
		const dests = getDestinationsForSource(movability.destinations, from);
		return dests !== undefined && dests.length > 0;
	}

	// For free mode, occupancy check is sufficient
	return true;
}

/**
 * Derive the active destinations array for a source square.
 * Pure policy lookup — does NOT check occupancy, color, or piece movability.
 * Selection semantics ("select a square") are separate from movability semantics.
 *
 * - strict mode: returns destinations[from] if non-empty, else null
 * - free mode: returns null (any target is allowed; no pre-computed list is meaningful)
 * - disabled: returns null
 */
export function getActiveDestinations(
	view: ViewStateInternal,
	from: Square
): readonly Square[] | null {
	const movability = view.movability;
	if (movability.mode === 'disabled') return null;
	if (movability.mode === 'free') return null;
	// strict mode: look up the destinations for this square
	const dests = getDestinationsForSource(movability.destinations, from);
	return dests && dests.length > 0 ? dests : null;
}

/**
 * Determine if a move attempt from source to target is allowed.
 * This answers: "Can I move from here to there?"
 *
 * Returns true only when:
 * - movability mode is not 'disabled'
 * - source square contains a piece
 * - for strict mode: destinations[from] includes to
 * - for free mode: target is not same as source
 *
 * Does NOT consult state.turn.
 * Does NOT check piece color.
 * Requires both source and target squares.
 */
export function isMoveAttemptAllowed(
	board: BoardStateInternal,
	view: ViewStateInternal,
	from: Square,
	to: Square
): boolean {
	const movability = view.movability;
	const pieces = board.pieces;

	// Disabled mode
	if (movability.mode === 'disabled') {
		return false;
	}

	// Source square must contain a piece
	const pieceCode = pieces[from];
	if (isEmpty(pieceCode)) {
		return false;
	}

	// For strict mode, check if target is in destinations list
	if (movability.mode === 'strict') {
		const dests = getDestinationsForSource(movability.destinations, from);
		return dests !== undefined && dests.includes(to);
	}

	// Same-square is never a valid move attempt
	if (from === to) {
		return false;
	}

	// For free mode, any destination allowed except same-square
	return true;
}
