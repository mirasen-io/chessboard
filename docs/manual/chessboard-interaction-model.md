# Interaction Model

## Baseline model principles

This document defines the library's normalized baseline interaction model for constrained move interaction.

The primary UX reference for this baseline is Chess.com-like behavior, especially for source pickup, reselection, and board-owned interaction flow. However, this document is the source of truth for the library model and does not attempt to mirror any external product exactly in every edge case.

In this model, move completion is resolved on `pointerup`, not on `pointerdown`. `pointerdown` may start, redirect, or re-own board interaction, but it does not commit a move.

In this model, `turn` is a fact about position state, not an interaction-layer authority for move availability. Move availability is determined by `movability`, not by reapplying `turn` inside the interaction decision model.

---

## Scope

This document defines the core chess interaction model for constrained move interaction.

In scope:

- primary-pointer board interaction
- `pointerdown`
- `pointermove`
- `pointerup`
- selection
- deselection
- reselection
- lifted piece drag
- release targeting
- move completion and cancellation

Out of scope:

- keyboard-driven interaction
- right-click / annotation interactions
- extension-owned custom input semantics
- accessibility / focus behavior
- non-primary pointer semantics unless explicitly stated

---

## Purpose

This document exists to define the baseline interaction semantics for constrained move interaction.

It should make it easy to answer:

- what does a given pointer event mean in the current interaction state?
- when does the board
  - select a piece?
  - deselect a piece?
  - reselect a different piece?
  - start drag mode?
  - start release-targeting mode?
  - update the current target?
- when can `pointerup` complete a move?
- when must `pointerup` not complete a move?

---

## Core interaction facts

These are the core interaction facts used by pointer interaction within this interaction model.

### `selectedSquare`

The currently selected source square, if any.

In this model:

- `selectedSquare` must represent a source square containing a piece
- an empty square must not become `selectedSquare`

`selectedSquare` is a source fact, not a target fact.
Current target interpretation belongs to `currentTarget`, not to `selectedSquare`.

### `dragSession`

The active lifted-piece drag session.

In this model:

- `dragSession !== null` means the board is currently in lifted-piece drag mode
- `dragSession === null` means the board is not currently in lifted-piece drag mode

`dragSession` covers only lifted-piece drag.
Non-lifted targeting belongs to `releaseTargetingActive`, not to `dragSession`.

### `currentTarget`

The currently active target square for the ongoing interaction, if any.

This is meaningful only in an active targeting mode.

### `releaseTargetingActive`

Whether the board is currently in non-lifted release-targeting mode.

This means:

- a source square is already selected
- the board is actively targeting from that selected source without a lifted-piece drag session
- move completion, if allowed, happens on `pointerup`

## Context inputs

These inputs affect event interpretation in this model.

### Event phase

- `pointerdown`
- `pointermove`
- `pointerup`

### Board ownership

- whether the relevant press started on the board

In this model, a gesture is board-owned only if the relevant press started on the board.

Implications:

- press originating outside the board does not start a board-owned interaction mode
- press originating outside the board does not allow move completion from that gesture on the board
- `pointermove` alone must not retroactively create a board-owned targeting session

### Square under pointer

- no square
- a square on the board

### Pressed / targeted square category

Always applicable:

- no square
- empty square
- occupied square

Relative to `selectedSquare`, where applicable:

- the same square as `selectedSquare`
- occupied by a piece of the same color as `selectedSquare`
- occupied by a piece of the opposite color to `selectedSquare`

### Source interaction eligibility

- whether the pressed square may become the interaction source on `pointerdown`

### Move constraints

- movability rules for the selected source and candidate target where applicable
- legal destination / illegal destination status where applicable

### Position facts

- `turn`, if present, is a fact about board state rather than an independent interaction-layer gate

---

## Interaction outcomes

These are the main interpretation outcomes the core may choose.

### Selection outcomes

- select square
- reselect square
- clear selection (deselect)
- keep current selection

### Mode-entry outcomes

- start lifted drag
- start release targeting
- do not enter a targeting mode

### Targeting outcomes

- update `currentTarget`
- clear `currentTarget`
- keep current target unchanged

### Completion outcomes

- commit move
- reject move
- clear active interaction mode
- no-op

---

## Event responsibilities

### `pointerdown`

Responsible for interpreting the start of a board-owned press interaction.

Possible meanings:

- select a piece
- reselect another piece
- start lifted drag
- start release targeting
- ignore / no-op

### `pointermove`

Responsible for updating target state inside an already active interaction mode.

Possible meanings:

- continue lifted drag and update `currentTarget`
- continue release targeting and update `currentTarget`
- no-op

### `pointerup`

Responsible for completing, clearing, or cancelling an already active interaction mode.

Possible meanings:

- commit move
- reject move
- clear drag state
- clear release-targeting state
- no-op

---

## Pointerdown decision model

Use this section as the primary interpretation guide for `pointerdown`.

### Step 1 — Did the relevant press start on the board?

- If no:
  - this is not a board-owned interaction
  - do not change any board interaction state, including:
    - `selectedSquare`
    - `currentTarget`
    - `dragSession`
    - `releaseTargetingActive`
  - do not enter any interaction mode
  - do not allow later move completion from this gesture

- If yes:
  - continue

### Step 2 — Is there already an active `dragSession` or `releaseTargetingActive` (defensive)?

- If yes:
  - an active interaction mode is already in progress
  - do not start a new board interaction from this `pointerdown`
  - keep the existing interaction mode active
  - interpret this branch as no-op unless a specific platform/input edge case requires otherwise

- If no:
  - continue

### Step 3 — Is there already a `selectedSquare`?

- If no:
  - use the [“no existing selection” branch](#branch-a--no-existing-selection)

- If yes:
  - use the [“existing selection” branch](#branch-b--existing-selection-present)

---

### Branch A — No existing selection

#### Case A1 — Pressed square is empty

- interpretation:
  - no-op
- state changes:
  - no state changes
- mode changes:
  - do not start drag
  - do not start release targeting
- notes:
  - an empty square must not become `selectedSquare` in this model

#### Case A2 — Pressed square contains a piece

- interpretation:
  - select that square
- state changes:
  - `selectedSquare` becomes the pressed square
  - `currentTarget` remains `null` unless drag starts
- mode changes:
  - drag starts from the newly selected square if source interaction can enter lifted drag
  - otherwise no active targeting mode starts
  - `releaseTargetingActive` may later start from the newly selected square, if required conditions are met
- notes:
  - this is the normal source-selection entry path
  - in this model, any occupied square can become the selected source when no selection is already present

---

### Branch B — Existing selection present

#### Case B1 — Pressed square is the same as `selectedSquare`

- interpretation:
  - continue interaction from the already selected source
- state changes:
  - `selectedSquare` stays unchanged
  - `currentTarget` remains `null` unless drag starts
- mode changes:
  - drag starts from the already selected square if source interaction can enter lifted drag
  - otherwise no active targeting mode starts
  - `releaseTargetingActive` may later start from the selected square, if required conditions are met
- notes:
  - this is not deselection on `pointerdown`
  - same-source repeated interaction must remain possible

#### Case B2 — Pressed square is empty

- interpretation:
  - start release targeting on the pressed square
- state changes:
  - `selectedSquare` stays unchanged
  - `currentTarget` becomes the pressed square
- mode changes:
  - `releaseTargetingActive` starts on the pressed square
  - drag does not start
- notes:
  - this is non-lifted target continuation, not source reselection
  - legal vs illegal status does not change `pointerdown` handling here
  - legality matters later during `pointerup` move completion

#### Case B3 — Pressed square contains a piece of the same color as `selectedSquare`

- interpretation:
  - reselect that square
- state changes:
  - `selectedSquare` becomes the pressed square
  - `currentTarget` remains `null` unless drag starts
- mode changes:
  - drag starts from the newly selected square if source interaction can enter lifted drag
  - otherwise no active targeting mode starts
  - `releaseTargetingActive` may later start from the newly selected square, if required conditions are met
- notes:
  - this is a reselection outcome, not target continuation from the previous selection
  - this model must not treat a same-color occupied press as move targeting from the previously selected source

#### Case B4 — Pressed square contains an opposite-color piece

##### Case B4.1 — The pressed square is a legal target for the selected source

- interpretation:
  - start release targeting on the pressed square
- state changes:
  - `selectedSquare` stays unchanged
  - `currentTarget` becomes the pressed square
- mode changes:
  - `releaseTargetingActive` starts on the pressed square
  - drag does not start
- notes:
  - this is target continuation, not reselection
  - current model uses release targeting here rather than committing immediately on `pointerdown`

##### Case B4.2 — The pressed square is not a legal target for the selected source

- interpretation:
  - reselect that square
- state changes:
  - `selectedSquare` becomes the pressed square
  - `currentTarget` remains `null` unless drag starts
- mode changes:
  - drag starts from the newly selected square if source interaction can enter lifted drag
  - otherwise no active targeting mode starts
  - `releaseTargetingActive` may later start from the newly selected square, if required conditions are met
- notes:
  - this is a reselection outcome, not target continuation from the previous selection
  - this model must not treat an illegal opposite-color occupied press as move targeting from the previously selected source

---

### Pointerdown interpretation table

Use this as a compact scan-friendly lookup table after the decision model.

| Existing selection | Pressed square kind  | Legality context         | Interpretation            | State changes                                                                       | Mode changes                                                                                                                        | Notes                                                     |
| ------------------ | -------------------- | ------------------------ | ------------------------- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| none               | empty                | n/a                      | no-op                     | no state changes                                                                    | do not start drag; do not start release targeting                                                                                   | empty square cannot become `selectedSquare`               |
| none               | contains a piece     | n/a                      | select source             | `selectedSquare = pressedSquare`; `currentTarget` remains `null` unless drag starts | drag starts from the newly selected square if source interaction can enter lifted drag; otherwise no active targeting mode starts   | normal source-entry path                                  |
| present            | same selected square | n/a                      | continue from same source | `selectedSquare` unchanged; `currentTarget` remains `null` unless drag starts       | drag starts from the already selected square if source interaction can enter lifted drag; otherwise no active targeting mode starts | not deselection on `pointerdown`                          |
| present            | empty                | legality evaluated later | start release targeting   | `selectedSquare` unchanged; `currentTarget = pressedSquare`                         | `releaseTargetingActive` starts on the pressed square; drag does not start                                                          | legality matters later during `pointerup` move completion |
| present            | same-color piece     | n/a                      | reselect source           | `selectedSquare = pressedSquare`; `currentTarget` remains `null` unless drag starts | drag starts from the newly selected square if source interaction can enter lifted drag; otherwise no active targeting mode starts   | reselection, not target continuation                      |
| present            | opposite-color piece | legal target             | start release targeting   | `selectedSquare` unchanged; `currentTarget = pressedSquare`                         | `releaseTargetingActive` starts on the pressed square; drag does not start                                                          | target continuation, not reselection                      |
| present            | opposite-color piece | not a legal target       | reselect source           | `selectedSquare = pressedSquare`; `currentTarget` remains `null` unless drag starts | drag starts from the newly selected square if source interaction can enter lifted drag; otherwise no active targeting mode starts   | reselection, not target continuation                      |

---

## Pointermove decision model

Use this section only for movement inside already active interaction modes.

`pointermove` does not create a new board-owned interaction by itself.

In this model, `pointermove` is responsible only for maintaining target state inside an already active mode. It does not:

- select a source
- reselect a source
- clear selection by itself
- commit a move

### Rule M1 — Lifted drag mode

When `dragSession !== null`:

- interpretation:
  - continue the existing lifted-piece drag interaction
- `currentTarget` behavior:
  - if the pointer currently resolves to a board square, `currentTarget` becomes that square
- invalid target behavior:
  - if the pointer does not currently resolve to a board square, `currentTarget` is cleared
- cleanup behavior:
  - do not clear `selectedSquare`
  - do not clear `dragSession`
  - do not commit or reject a move on `pointermove`
- notes:
  - `pointermove` in lifted drag mode updates targeting only
  - square-kind interpretation from `pointerdown` does not re-run here
  - legality does not cause move completion on `pointermove`

### Rule M2 — Release-targeting mode

When `releaseTargetingActive === true`:

- interpretation:
  - continue the existing non-lifted release-targeting interaction
- `currentTarget` behavior:
  - if the pointer currently resolves to a board square, `currentTarget` becomes that square
- invalid target behavior:
  - if the pointer does not currently resolve to a board square, `currentTarget` is cleared
- cleanup behavior:
  - do not clear `selectedSquare`
  - do not clear `releaseTargetingActive`
  - do not commit or reject a move on `pointermove`
- notes:
  - this is target maintenance from the already selected source, not source reselection
  - `pointermove` must not start drag from release-targeting mode
  - legality does not cause move completion on `pointermove`

### Rule M3 — No active targeting mode

When:

- `dragSession === null`
- and `releaseTargetingActive === false`

Then:

- `pointermove` must not create a board-owned targeting session by itself
- interpretation:
  - no-op
- notes:
  - `pointermove` without an already active mode does not select a source
  - `pointermove` without an already active mode does not start drag
  - `pointermove` without an already active mode does not start release targeting

### Pointermove lookup table

| Active mode            | Pointer on board? | Target square resolved? | Result                           | Notes                                                   |
| ---------------------- | ----------------- | ----------------------- | -------------------------------- | ------------------------------------------------------- |
| dragSession            | yes               | yes                     | `currentTarget = resolvedSquare` | continue lifted drag; no move commit                    |
| dragSession            | yes               | no                      | `currentTarget = null`           | keep drag active; no move commit                        |
| dragSession            | no                | no                      | `currentTarget = null`           | board-owned interaction may remain active; no commit    |
| releaseTargetingActive | yes               | yes                     | `currentTarget = resolvedSquare` | continue release targeting; no move commit              |
| releaseTargetingActive | yes               | no                      | `currentTarget = null`           | keep release targeting active; no move commit           |
| releaseTargetingActive | no                | no                      | `currentTarget = null`           | board-owned interaction may remain active; no commit    |
| none                   | yes               | yes                     | no-op                            | `pointermove` must not start a targeting mode by itself |
| none                   | no                | no                      | no-op                            | `pointermove` must not create board ownership           |

---

## Pointerup and completion rules

This section defines when `pointerup` may complete a move and when it must not.

`pointerup` is the only event that may resolve move completion in this model.

A move may complete only from an already active completion mode. `pointerup` does not create a new source selection or a new targeting session by itself. `pointerup` may, however, clean the current selection.

### Rule U1 — Lifted drag completion

When `dragSession !== null` on `pointerup`:

- valid target outcome:
  - if `currentTarget` resolves to a valid move target from `selectedSquare`, complete the move
- source-return outcome:
  - if no move was completed and `currentTarget === selectedSquare`, preserve selection on `selectedSquare`
- other invalid target outcome:
  - if no move was completed and `currentTarget !== selectedSquare`, the piece returns to `selectedSquare` and selection remains on `selectedSquare`
- cleanup:
  - end the active drag session
  - clear `dragSession`
  - clear `releaseTargetingActive`
  - clear `currentTarget`
- notes:
  - `pointerup` is the move-resolution point for lifted drag interactions
  - legality is evaluated here, not on `pointerdown` or `pointermove`
  - releasing back onto the selected source square preserves selection in lifted drag mode
  - releasing onto any other invalid target returns the piece to its source square and preserves selection

### Rule U2 — Release-targeting completion

When `releaseTargetingActive === true` on `pointerup`:

- valid target outcome:
  - if `currentTarget` resolves to a valid move target from `selectedSquare`, complete the move
- source-return outcome:
  - if no move was completed and `currentTarget === selectedSquare`, preserve selection on `selectedSquare`
- other invalid target outcome:
  - if no move was completed and `currentTarget !== selectedSquare`, clear selection by setting `selectedSquare = null`
- cleanup:
  - end release targeting
  - clear `releaseTargetingActive`
  - clear `dragSession`
  - clear `currentTarget`
- notes:
  - `pointerup` is the move-resolution point for non-lifted release targeting
  - legality is evaluated here, not on `pointerdown` or `pointermove`
  - releasing back onto the selected source square preserves selection in release-targeting mode
  - releasing onto any other invalid target clears selection

### Rule U3 — No active completion mode

When:

- `dragSession === null`
- and `releaseTargetingActive === false`

Then `pointerup` must:

- not complete a move
- interpretation:
  - no-op
- notes:
  - `pointerup` without an active completion mode does not create move resolution by itself
  - `pointerup` without an active completion mode does not select a source
  - `pointerup` without an active completion mode does not reselect a source
  - `pointerup` without an active completion mode does not clear selection by itself

### Pointerup lookup table

| Active mode            | `currentTarget` state              | Outcome       | Cleanup                                                                                           | Notes                                                      |
| ---------------------- | ---------------------------------- | ------------- | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| dragSession            | legal target from `selectedSquare` | complete move | end drag; clear `dragSession`; clear `currentTarget`; clear `releaseTargetingActive`              | lifted drag resolves only on `pointerup`                   |
| dragSession            | equals `selectedSquare`            | no move       | end drag; clear `dragSession`; clear `currentTarget`; clear `releaseTargetingActive`              | preserve selection on `selectedSquare`                     |
| dragSession            | other invalid target               | no move       | end drag; clear `dragSession`; clear `currentTarget`; clear `releaseTargetingActive`              | piece returns to `selectedSquare`; selection remains there |
| releaseTargetingActive | legal target from `selectedSquare` | complete move | end release targeting; clear `releaseTargetingActive`; clear `currentTarget`; clear `dragSession` | non-lifted targeting resolves only on `pointerup`          |
| releaseTargetingActive | equals `selectedSquare`            | no move       | end release targeting; clear `releaseTargetingActive`; clear `currentTarget`; clear `dragSession` | preserve selection on `selectedSquare`                     |
| releaseTargetingActive | other invalid target               | no move       | end release targeting; clear `releaseTargetingActive`; clear `currentTarget`; clear `dragSession` | clear selection                                            |
| none                   | any                                | no-op         | no completion cleanup required                                                                    | no active completion mode exists                           |

---

## Interaction cancellation

This section defines the expected effect of explicit interaction cancellation.

When interaction cancellation occurs:

- no move is completed
- `dragSession` is cleared
- `currentTarget` is cleared
- `releaseTargetingActive` is cleared
- `selectedSquare` remains unchanged

Notes:

- interaction cancellation returns the board to a selected-source state
- interaction cancellation does not fully deselect by itself
- full deselection requires separate selection clearing

---
