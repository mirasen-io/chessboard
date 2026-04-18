/**
 * VERY IMPORTANT CONTROLLER/RUNTIME BOUNDARY:
 *
 * The controller may interpret branches, inspect snapshots, use board helpers,
 * and call read-only runtime policy methods.
 *
 * But when a branch requires a state-changing interaction transition,
 * the controller should invoke exactly one atomic runtime mutator.
 *
 * Do not reintroduce split mutating controller choreography, for example:
 * - setCurrentTarget(...)
 * - then dragStart(...)
 * - then other state synchronization calls
 *
 * The controller chooses the branch.
 * The runtime owns the atomic transition.
 */

/**
 * Interaction controller — Phase 3.2 pointer lifecycle orchestrator.
 *
 * Translates raw pointer events (already resolved to board squares by the input adapter)
 * into runtime lifecycle calls. Owns no semantic state — all state lives in the runtime.
 *
 * ── Three-layer boundary ──────────────────────────────────────────────────────
 *
 *   Raw UI / input adapter (above this layer):
 *     - raw pointer events (x, y, pointerId)
 *     - hit-testing: square under pointer
 *     - transient visual tracking (ghost piece position, etc.)
 *     - calls controller methods with resolved squares
 *     - NOTE: no drag threshold in Phase 3.2 — immediate lift on pointer-down
 *       when the square is drag-capable (chess.com / lichess style)
 *
 *   Controller (this layer):
 *     - board-interpreted pointer lifecycle
 *     - decides whether to enter lifted-piece mode or non-lifted targeting path
 *     - reads interaction state via getInteractionSnapshot() — no ad-hoc parameters
 *     - gates lifted-piece entry via canStartMoveFrom() — selection remains broad
 *     - active targeting derived from runtime facts: dragSession !== null OR releaseTargetingActive === true
 *
 *   Runtime (below this layer):
 *     - owns all semantic interaction state transitions
 *     - owns synchronization rules and invariants
 *     - owns mode-specific illegal-completion outcomes
 *
 * ── Two interaction modes ─────────────────────────────────────────────────────
 *
 *   Lifted-piece mode (dragSession !== null):
 *     Entered by pointer-down when no interaction is active and pressed square is drag-capable.
 *     The piece is visually "in hand" (Phase 3.3 rendering concern).
 *     Illegal completion: no move, snap back, selection stays active.
 *
 *   Release-targeting mode (selectedSquare !== null, dragSession === null):
 *     Entered when pressing an empty square, or a legal opposite-color target, or after
 *     an illegal lifted-piece drop (selection kept, drag cleared).
 *     The user chooses a destination by releasing on it.
 *     Illegal completion outcome is runtime-owned and mode-specific.
 *
 * ── Pointer-down paths ────────────────────────────────────────────────────────
 *
 *   Path A — No active interaction (selectedSquare === null):
 *     beginSourceInteraction(sq) → atomic source-entry transition.
 *     May enter lifted-piece mode if canStartMoveFrom(sq), otherwise selection only.
 *
 *   Path B — Existing selection, no active mode:
 *     Same square: beginSourceInteraction(sq) → continue from selected source.
 *     Empty square: startReleaseTargeting(sq) → begin release-targeting on pressed square.
 *     Same-color piece: beginSourceInteraction(sq) → reselect that square.
 *     Opposite-color legal target: startReleaseTargeting(sq) → begin release-targeting.
 *     Opposite-color illegal target: beginSourceInteraction(sq) → reselect that square.
 *
 *   Path C — Active mode already in progress [defensive guard]:
 *     Pointer-down is rejected while dragSession !== null OR releaseTargetingActive === true.
 *     This prevents double-entry; normal flow uses pointer-up to complete before new pointer-down.
 *
 * ── Invalid completion outcomes ───────────────────────────────────────────────
 *
 *   Runtime owns mode-specific illegal-completion behavior:
 *     - Drag invalid → preserve selection
 *     - Release-targeting invalid + target equals selected source → preserve selection
 *     - Release-targeting invalid + other invalid target → clear selection
 *
 * ── onPointerMove narrowness ──────────────────────────────────────────────────
 *
 *   onPointerMove updates currentTarget ONLY while an active targeting mode exists
 *   (dragSession !== null OR releaseTargetingActive === true).
 *   Plain pointer movement after a selection, without an active mode, does NOT
 *   update currentTarget. This prevents generic global hover tracking.
 */

import assert from '@ktarmyshov/assert';
import { getPieceAt, isOccupied } from '../helpers/board';
import { isInteractionTargetingActive } from '../helpers/interaction';
import type { BoardPoint } from '../renderer/types';
import type { InteractionSnapshot } from '../runtime/boardRuntime';
import type { BoardStateSnapshot, Move, Square } from '../state/boardTypes';

/**
 * Minimal runtime surface the controller needs.
 * Subset of BoardRuntime — allows easy testing with partial mocks.
 */
export interface InteractionRuntimeSurface {
	getBoardSnapshot(): BoardStateSnapshot;
	getInteractionSnapshot(): InteractionSnapshot;
	/**
	 * Returns true if the given square is a valid drag-capable source under the
	 * current movability policy. Used to gate lifted-piece entry on pointer-down.
	 * Selection itself is NOT gated by this — only dragStart is.
	 */
	canStartMoveFrom(from: Square): boolean;
	/**
	 * Returns true if the given move attempt is allowed under the current movability policy.
	 */
	isMoveAttemptAllowed(from: Square, to: Square): boolean;
	/**
	 * Notify runtime of drag pointer movement for visual updates.
	 * Called by controller when a drag session is active.
	 */
	notifyDragMove(target: Square | null, point: BoardPoint | null): void;
	/**
	 * Notify runtime of release-targeting pointer movement for visual updates.
	 * Called by controller when release-targeting mode is active.
	 */
	notifyReleaseTargetingMove(target: Square | null, point: BoardPoint | null): void;
	select(sq: Square | null): boolean;
	beginSourceInteraction(from: Square, point: BoardPoint): boolean;
	startReleaseTargeting(target: Square, point: BoardPoint | null): boolean;
	commitTo(to: Square | null): Move | null;
	cancelInteraction(): boolean;
}

/**
 * Interaction controller interface.
 *
 * All methods work in board-square terms only.
 * No pointer coordinates, no visual state.
 */
export interface InteractionController {
	/**
	 * Called when the pointer goes down on a square (or off-board).
	 *
	 * target === null: off-board pointer-down → no-op.
	 *
	 */
	onPointerDown(target: Square | null, point: BoardPoint): void;

	/**
	 * Called when the pointer moves to a new square (or off-board).
	 *
	 * Updates currentTarget ONLY while an active targeting mode exists.
	 * If a drag session is active, also updates drag visual position.
	 * No-op if no active mode.
	 *
	 * @param target - The semantic target square (null if off-board or outside grid)
	 * @param point - Board-local pointer coordinates (null only if geometry unavailable)
	 */
	onPointerMove(target: Square | null, point: BoardPoint | null): void;

	/**
	 * Called when the pointer is released.
	 *
	 * Lifted-piece mode: calls runtime.commitTo(sq). Returns Move | null.
	 * Release-targeting mode: calls runtime.commitTo(sq). Returns Move | null.
	 * No active interaction: returns null.
	 */
	onPointerUp(target: Square | null): Move | null;

	/**
	 * Called when the pointer interaction is aborted (pointer cancel, escape key, etc.).
	 * Routes to runtime.cancelInteraction().
	 */
	onPointerCancel(): void;
}

/**
 * Create an interaction controller bound to a runtime surface.
 *
 * @param runtime - The runtime surface (BoardRuntime or compatible mock).
 * @returns InteractionController
 */
export function createInteractionController(
	runtime: InteractionRuntimeSurface
): InteractionController {
	return {
		onPointerDown(target: Square | null, point: BoardPoint): void {
			if (target === null) return; // off-board pointer-down: no-op

			const snap = runtime.getInteractionSnapshot();
			const boardSnapshot = runtime.getBoardSnapshot();

			// Defensive guard: ignore pointer-down while an active interaction mode is already in progress.
			if (snap.interaction.dragSession !== null || snap.interaction.releaseTargetingActive) {
				return;
			}

			// Branch A — No existing selection
			const selectedSq = snap.interaction.selectedSquare;
			if (selectedSq === null) {
				// Case A1 — Pressed square is empty
				if (!isOccupied(boardSnapshot, target)) {
					// A1: empty - no-op
					return;
				}

				// Case A2 — Pressed square contains a piece
				runtime.beginSourceInteraction(target, point);
				return;
			}

			// Branch B — Existing selection present

			// Case B1 — Pressed square is the same as `selectedSquare`: continue interaction from the already selected source
			if (target === selectedSq) {
				runtime.beginSourceInteraction(target, point);
				return;
			}

			// Case B2 — Pressed square is empty: start release targeting on the pressed square
			if (!isOccupied(boardSnapshot, target)) {
				runtime.startReleaseTargeting(target, point);
				return;
			}

			// Case B3 — Pressed square contains a piece of the same color as `selectedSquare`: reselect that square
			const pressedPiece = getPieceAt(boardSnapshot, target);
			assert(pressedPiece !== null, 'Expected occupied square to contain a piece');

			const selectedPiece = getPieceAt(boardSnapshot, selectedSq);
			assert(selectedPiece !== null, 'Expected selected square to contain a piece');

			if (pressedPiece.color === selectedPiece.color) {
				runtime.beginSourceInteraction(target, point);
				return;
			}

			// Case B4 — Pressed square contains an opposite-color piece

			// Case B4.1 — The pressed square is a legal target for the selected source: start release targeting on the pressed square
			if (runtime.isMoveAttemptAllowed(selectedSq, target)) {
				runtime.startReleaseTargeting(target, point);
				return;
			}

			// Case B4.2 — The pressed square is an illegal target for the selected source: reselect that square
			runtime.beginSourceInteraction(target, point);
		},

		onPointerMove(target: Square | null, point: BoardPoint | null): void {
			const snap = runtime.getInteractionSnapshot();
			const targeting = isInteractionTargetingActive(snap.interaction);

			if (!targeting) return;

			if (snap.interaction.dragSession !== null) {
				runtime.notifyDragMove(target, point);
			} else if (snap.interaction.releaseTargetingActive) {
				runtime.notifyReleaseTargetingMove(target, point);
			}
		},

		onPointerUp(target: Square | null): Move | null {
			const snap = runtime.getInteractionSnapshot();

			if (isInteractionTargetingActive(snap.interaction)) {
				return runtime.commitTo(target);
			}

			// No active mode: no-op
			return null;
		},

		onPointerCancel(): void {
			runtime.cancelInteraction();
		}
	};
}
