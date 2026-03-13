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
 *     - tracks one internal boolean: `targeting` (pointer is currently down)
 *
 *   Runtime (below this layer):
 *     - owns all semantic interaction state transitions
 *     - owns synchronization rules and invariants
 *     - owns mode-specific illegal-completion outcomes
 *
 * ── Two interaction modes ─────────────────────────────────────────────────────
 *
 *   Lifted-piece mode (dragSession !== null):
 *     Entered by pointer-down when no interaction is active.
 *     The piece is visually "in hand" (Phase 3.3 rendering concern).
 *     Illegal completion: no move, snap back, selection stays active.
 *
 *   Release-targeting mode (selectedSquare !== null, dragSession === null):
 *     Active after an illegal lifted-piece drop (selection kept, drag cleared).
 *     The user chooses a destination by releasing on it.
 *     Illegal completion: no move, selection is cleared.
 *
 * ── Pointer-down paths ────────────────────────────────────────────────────────
 *
 *   Path A — No active interaction (selectedSquare === null):
 *     select(sq) always.
 *     dragStart(sq) only if canStartMoveFrom(sq) → enter lifted-piece mode.
 *     Otherwise: selection only, no lifted piece (non-lifted path).
 *
 *   Path B — Release-targeting mode (selectedSquare !== null, dragSession === null):
 *     setCurrentTarget(sq) → begin destination targeting.
 *     No new select, no dragStart.
 *     Deselect is deferred to pointer-up (release-based, not eager).
 *
 *   Path C — Lifted-piece mode active (dragSession !== null) [defensive]:
 *     cancelInteraction() + select(sq) → always.
 *     dragStart(sq) only if canStartMoveFrom(sq) → re-lift from new square.
 *     This path should not occur in normal flow; handled defensively.
 *
 * ── Deselect rule ─────────────────────────────────────────────────────────────
 *
 *   Deselect happens on pointer-UP (release), not pointer-down.
 *   This is an explicit Phase 3.2 rule, aligned with the safer release-based model.
 *   In release-targeting mode, if pointer-up lands on the selected square → select(null).
 *
 * ── onPointerMove narrowness ──────────────────────────────────────────────────
 *
 *   onPointerMove updates currentTarget ONLY while `targeting === true`
 *   (i.e., the pointer is currently down and an interaction is in progress).
 *   Plain pointer movement after a selection, without a pointer-down, does NOT
 *   update currentTarget. This prevents generic global hover tracking.
 */

import type { InteractionSnapshot } from '../runtime/boardRuntime';
import type { Move, Square } from '../state/boardTypes';

/**
 * Minimal runtime surface the controller needs.
 * Subset of BoardRuntime — allows easy testing with partial mocks.
 */
export interface InteractionRuntimeSurface {
	getInteractionSnapshot(): InteractionSnapshot;
	/**
	 * Returns true if the given square is a valid drag-capable source under the
	 * current movability policy. Used to gate lifted-piece entry on pointer-down.
	 * Selection itself is NOT gated by this — only dragStart is.
	 */
	canStartMoveFrom(from: Square): boolean;
	select(sq: Square | null): boolean;
	dragStart(from: Square): boolean;
	setCurrentTarget(target: Square | null): boolean;
	dropTo(to: Square | null): Move | null;
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
	 * sq === null: off-board pointer-down → no-op.
	 *
	 * Path A (no active interaction): select(sq) + dragStart(sq) → lifted-piece mode.
	 * Path B (release-targeting mode): setCurrentTarget(sq) → begin destination targeting.
	 * Path C (lifted-piece mode, defensive): cancelInteraction() + select(sq) + dragStart(sq).
	 */
	onPointerDown(sq: Square | null): void;

	/**
	 * Called when the pointer moves to a new square (or off-board).
	 *
	 * Updates currentTarget ONLY while targeting is active (pointer is down).
	 * No-op if pointer is not currently down.
	 */
	onPointerMove(sq: Square | null): void;

	/**
	 * Called when the pointer is released.
	 *
	 * Lifted-piece mode: calls runtime.dropTo(sq). Returns Move | null.
	 * Release-targeting mode:
	 *   - sq === selectedSquare → select(null) (deselect), returns null.
	 *   - otherwise → calls runtime.dropTo(sq). Returns Move | null.
	 * No active interaction: returns null.
	 */
	onPointerUp(sq: Square | null): Move | null;

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
	// Internal flag: true while the pointer is currently down and an interaction is in progress.
	// Used to narrow onPointerMove so it does not become a global hover tracker.
	let targeting = false;

	return {
		onPointerDown(sq: Square | null): void {
			if (sq === null) return; // off-board pointer-down: no-op

			const snap = runtime.getInteractionSnapshot();

			if (snap.interaction.dragSession !== null) {
				// Path C (defensive): pointer-down while already in lifted-piece mode.
				// Cancel the current drag, re-select, and re-lift only if drag-capable.
				runtime.cancelInteraction();
				runtime.select(sq);
				if (runtime.canStartMoveFrom(sq)) {
					runtime.dragStart(sq);
				}
				targeting = true;
				return;
			}

			if (snap.interaction.selectedSquare !== null) {
				// Path B: release-targeting mode — a square is already selected, no drag active.
				// Begin destination targeting. Deselect is deferred to pointer-up.
				runtime.setCurrentTarget(sq);
				targeting = true;
				return;
			}

			// Path A: no active interaction.
			// Selection is always broad (any square).
			// Lifted-piece entry is gated: only if the square is drag-capable.
			runtime.select(sq);
			if (runtime.canStartMoveFrom(sq)) {
				runtime.dragStart(sq); // enter lifted-piece mode
			}
			// else: selection only — non-lifted path (no dragSession)
			targeting = true;
		},

		onPointerMove(sq: Square | null): void {
			// Only update currentTarget while the pointer is down and an interaction is active.
			if (!targeting) return;
			runtime.setCurrentTarget(sq);
		},

		onPointerUp(sq: Square | null): Move | null {
			targeting = false;

			const snap = runtime.getInteractionSnapshot();

			if (snap.interaction.dragSession !== null) {
				// Lifted-piece mode: attempt completion via dropTo.
				// Runtime handles legal/illegal outcomes (illegal: keeps selection).
				return runtime.dropTo(sq);
			}

			if (snap.interaction.selectedSquare !== null) {
				// Release-targeting mode.
				if (sq === snap.interaction.selectedSquare) {
					// Pointer-up on the selected square → deselect.
					// Explicit Phase 3.2 rule: deselect on release, not on pointer-down.
					runtime.select(null);
					return null;
				}
				// Pointer-up on a different square → attempt completion via dropTo.
				// Runtime handles legal/illegal outcomes (illegal: clears all interaction).
				return runtime.dropTo(sq);
			}

			// No active interaction.
			return null;
		},

		onPointerCancel(): void {
			targeting = false;
			runtime.cancelInteraction();
		}
	};
}
