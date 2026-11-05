# Premove Interaction Model — Plan

## Status and scope

Working interaction-model plan for optional premove support. This captures the agreed **intended mirasen behavior**, not an exact specification of Chess.com across platforms. Detailed architecture, APIs, state ownership, and implementation design are deferred.

The model uses the existing **lifted-piece drag** and **release-targeting** concepts. A move or queue cancellation is resolved on `pointerup`; `pointerdown` starts/selects/claims an interaction but does not commit a move or clear the queue. Desktop and touch share the same interaction semantics; only the drag activation threshold and available input buttons differ.

## Selection and move entry

The same select/deselect behavior is intended for ordinary moves and premoves:

| Starting state / input | Intended result |
| --- | --- |
| No selection; `pointerdown` on an eligible own piece | Select immediately and start a lifted-piece interaction. |
| First `pointerup` on that piece's source square | Keep selection. |
| Piece was **already selected before this gesture**; press it again and release on its source square | **Deselect**, even if the piece was dragged away and returned before release. |
| Lifted drag released on a valid destination | Complete the ordinary move or append the premove. |
| Lifted drag released on an invalid board destination | Restore the piece, keep selection and existing premove queue. |
| Lifted drag released outside the board | Cancel the drag, keep selection and queue. |
| Selected piece; `pointerdown` on a **different** square | Start release-targeting; decide the outcome on `pointerup`. |
| Release-targeting released on an allowed destination | Complete the ordinary move or append the premove. |
| Premove release-targeting released on a disallowed square **inside** the board | Clear the entire pending premove queue (if any) and deselect. |
| Premove release-targeting released **outside** the board | Cancel this targeting attempt, preserving the queue and selection. |

Important: selection is set on `pointerdown`, so the repeated-source deselect rule must distinguish **selection already present before the gesture** from selection created by that same `pointerdown`. It must **not** depend on whether the drag entered `pending` or `active` phase. Desktop drag may activate immediately; touch typically uses a movement threshold.

### Different-square targeting in premove mode

When premove is available (for example, during the opponent's turn), a selected piece retains ownership of the next primary-button gesture on **any different square**, including a square occupied by another friendly piece, an enemy piece, or an empty square. It is a potential **destination**, not an automatic reselection of the occupant.

This is intentional: premove candidates may include squares occupied by either color. To select a different piece, first deselect the current source by releasing a repeat gesture on its own source square, then select the other piece.

Ordinary-move interaction retains its current destination/reselection policy apart from the shared repeated-source deselect change.

## Queue cancellation: input presets

A nonempty premove queue can enter a **release-targeting cancellation gesture**. This is distinct from release-targeting used to complete a move: it owns the input gesture until release and decides **whether to clear the queue** on `pointerup`, not on `pointerdown`.

| Input preset | When cancellation targeting begins on `pointerdown` | `pointerup` inside board | `pointerup` outside board |
| --- | --- | --- | --- |
| **Web / desktop mouse** | **Secondary/right button** pressed on any board square while the queue is nonempty, **regardless of selection**. | Clear the **entire** queue. | Preserve the queue. |
| **Mobile / touch** | **Primary touch** on an empty square or opponent-occupied square, **only if the queue is nonempty and no piece is selected**. | Clear the **entire** queue. | Preserve the queue. |

The cancelling gesture is **consumed in both presets**: it must not select a piece, initiate a piece drag, commit a move, or create an annotation. It does not retrospectively turn into another gesture when cancellation is aborted outside the board.

### Mobile preset: selection takes precedence over cancellation targeting

- With a nonempty queue and **no selection**, pressing a friendly piece (including at a projected piece position) starts the normal selection/lifted-drag interaction **instead of** cancellation targeting.
- With a nonempty queue and **no selection**, pressing an empty square or an opponent piece starts **release-targeting for queue cancellation**. Nothing is cleared until release.
- With **an already-selected piece**, the next primary press on a different square starts **move release-targeting**, including on friendly-occupied squares. Its release either appends a premove, clears the queue on a disallowed in-board target, or preserves queue and selection when released outside.
- Invalid **lifted-piece drags** restore the piece without clearing the queue.

### Web preset: secondary-button ownership versus annotations

With a nonempty queue, **every secondary-button press on the board** starts **release-targeting for queue cancellation**, even if a piece is selected. This gesture is owned by premove rather than annotations; it does not draw a circle or arrow whether released inside or outside the board.

When the queue is empty, secondary-button input follows the existing annotation behavior.

This **release-based** cancellation deliberately differs from the observed Chess.com desktop behavior, where the queue visibly cleared on the initial right-button press.

Extension ordering alone must not be assumed to guarantee exclusive gesture handling: ensure a premove-owned cancellation gesture cannot also produce annotations.

## Premove candidates and visuals

- Multi-premove interaction uses a **projected position**: queued pieces appear at their intended destinations so further premoves can be entered from projected squares. Use consistent behavior across platforms where multiple premoves are available.
- Candidate destinations follow **piece-movement geometry**, not the legal-move destinations of the current real position. Existing blockers and piece color should not by themselves exclude a destination from the hint set (subject to piece-specific rules still to be specified).
- Show a **dot** on an empty candidate square and a **capture-style circle** on an occupied candidate square, **regardless of the occupant's color**.
- Candidate hints are not a guarantee that a queued move is legal when later executed; legality must be checked separately at execution time.
- The observed native Chess.com iOS **single-premove** mode leaves the piece in its actual square. The projected-position model above is a **mirasen design choice for multiple premoves**, not a verified description of the current native iOS multiple-premove UX.

## Follow-up architecture and documentation (not decided here)

- Evaluate whether the existing `movability` infrastructure can provide premove candidate destinations (potentially with a separate resolver/policy), or whether a distinct premove mechanism is required. **No decision yet.**
- Inspect renderer destination-hint logic: a premove candidate on **any occupied square**, including a friendly piece, needs a circle rather than a dot; do not assume existing normal-move coloring/occupancy checks are suitable.
- Resolve projected-piece hit-testing, extension/core input ownership and consumption, and changes to board/turn while a gesture is active. Avoid introducing a generic multi-event gesture framework without a demonstrated requirement.
- **Update `docs/core-interaction-model.md` later** for the shared select/deselect behavior and any confirmed runtime interaction changes. Do **not** change that existing document or the runtime implementation as part of this planning step.
- Preserve the distinction between manually **observed Chess.com behavior** in issue #71 and the **intended mirasen interaction policy** recorded here.
