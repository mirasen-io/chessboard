/**
 * Policy contracts (Phase 1 - types only).
 * - Purpose: define how legal destinations are computed and how proposed moves can be gated.
 * - Core remains rule-agnostic; a MovePolicy adapter (e.g., chess.js) supplies rules externally.
 */

import type { BoardStateSnapshot, MoveInput, SquareString } from '../state/boardTypes';

/**
 * DestinationsMap:
 * - For each origin square (algebraic), provide a readonly list of legal target squares (algebraic).
 * - Sparse: only include origins that have at least one destination.
 */
export type DestinationsMap = Partial<Record<SquareString, readonly SquareString[]>>;

/**
 * MovePolicy:
 * - compute(snapshot): returns destinations for UI (e.g., highlight legal targets).
 * - allows?(move, snapshot): optional quick gatekeeper (e.g., prevent illegal drops).
 *   If omitted, the caller may consult `compute()` results or accept any move.
 */
export interface MovePolicy {
	compute(snapshot: BoardStateSnapshot): DestinationsMap;
	allows?(move: MoveInput, snapshot: BoardStateSnapshot): boolean;
}
