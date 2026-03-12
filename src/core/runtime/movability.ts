/**
 * Pure movability consultation helpers for runtime.
 * These functions determine move eligibility based on current state and movability policy.
 *
 * Key principles:
 * - Consult state.movability only, NOT state.turn
 * - Return false if movability is null or disabled
 * - Check piece color against movability color policy
 * - For strict mode, consult destinations map
 */

import type { BoardStateInternal, Square } from '../state/boardTypes';
import { isBlackCode, isEmpty, isWhiteCode } from '../state/encode';
import type { MovableColor, ViewStateInternal } from '../state/viewTypes';

/**
 * Check if a piece color matches the movability color policy.
 */
function isPieceColorAllowed(pieceCode: number, movabilityColor: MovableColor): boolean {
	if (movabilityColor === 'both') return true;
	if (movabilityColor === 'white') return isWhiteCode(pieceCode);
	if (movabilityColor === 'black') return isBlackCode(pieceCode);
	return false;
}

/**
 * Determine if a move can be started from the given square.
 * This answers: "Can I pick up this piece?"
 *
 * Returns true only when:
 * - movability is not null
 * - movability mode is not 'disabled'
 * - source square contains a piece
 * - piece color matches movability color policy
 * - for strict mode: destinations[from] exists and has length > 0
 * - for free mode: color match is sufficient
 *
 * Does NOT consult state.turn.
 * Does NOT require a target square.
 */
export function canStartMoveFrom(
	board: BoardStateInternal,
	view: ViewStateInternal,
	from: Square
): boolean {
	const movability = view.movability;
	const pieces = board.pieces;

	// No movability policy or disabled
	if (movability.mode === 'disabled') {
		return false;
	}

	// Source square must contain a piece
	const pieceCode = pieces[from];
	if (isEmpty(pieceCode)) {
		return false;
	}

	// Piece color must match movability color policy
	if (!isPieceColorAllowed(pieceCode, movability.color)) {
		return false;
	}

	// For strict mode, check if destinations exist and have length > 0
	if (movability.mode === 'strict') {
		const dests = movability.destinations[from];
		return dests !== undefined && dests.length > 0;
	}

	// For free mode, color match is sufficient
	return true;
}

/**
 * Determine if a move attempt from source to target is allowed.
 * This answers: "Can I move from here to there?"
 *
 * Returns true only when:
 * - movability is not null
 * - movability mode is not 'disabled'
 * - source square contains a piece
 * - piece color matches movability color policy
 * - for strict mode: destinations[from] includes to
 * - for free mode: color match is sufficient (any destination)
 *
 * Does NOT consult state.turn.
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

	// No movability policy or disabled
	if (movability.mode === 'disabled') {
		return false;
	}

	// Source square must contain a piece
	const pieceCode = pieces[from];
	if (isEmpty(pieceCode)) {
		return false;
	}

	// Piece color must match movability color policy
	if (!isPieceColorAllowed(pieceCode, movability.color)) {
		return false;
	}

	// For strict mode, check if target is in destinations list
	if (movability.mode === 'strict') {
		const dests = movability.destinations[from];
		return dests !== undefined && dests.includes(to);
	}

	// For free mode, color match is sufficient (any destination allowed)
	return true;
}
