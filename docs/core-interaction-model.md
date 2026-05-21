# Interaction Model

## Baseline model principles

This document defines the library's normalized baseline interaction model for constrained move interaction.

This baseline follows common chessboard interaction behavior, especially source pickup, reselection, and board-owned interaction flow. This document is the source of truth for the library model and does not attempt to mirror any external product exactly in every edge case.

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
  - start a pending lifted-piece drag session?
  - start an active lifted-piece drag session?
  - activate a pending lifted-piece drag session?
  - start a release-targeting drag session?
  - update `dragSession.targetSquare`?
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

`selectedSquare` is a source fact, not a target fact. The current target of an in-progress interaction lives on the active drag session as `dragSession.targetSquare`.

### `dragSession`

The single active interaction-session container.

In this model:

- `dragSession !== null` means there is an active board-owned or extension-owned interaction session
- `dragSession === null` means there is no active drag/targeting session

A `dragSession` may be core-owned or extension-owned.

Core-owned `dragSession` types:

- pending lifted-piece drag
- active lifted-piece drag
- release-targeting drag session

Extension-owned `dragSession` is used by extensions (for example, annotations) and follows extension-owned completion rather than core move completion.

#### Lifted-piece drag phases

Lifted-piece drag has two phases, gated by the configured activation threshold (see [`interaction.drag.liftedActivation.thresholdPx`](#interaction-config)).

`pending` lifted-piece drag:

- exists after `pointerdown` on an occupied source square when the lifted-activation threshold is greater than `0`
- carries source square, source piece code, target square, start button, start point, and threshold
- is not yet rendered as a lifted dragged piece
- cannot complete a core move on `pointerup`

`active` lifted-piece drag:

- starts immediately on `pointerdown` when the lifted-activation threshold is `0`
- otherwise starts when an in-progress pending lifted-piece drag's pointer movement from `startPoint` exceeds `thresholdPx`
- is rendered as the lifted dragged piece
- can complete a move on `pointerup` if the target is a legal destination from the source

#### Release-targeting drag session

A release-targeting `dragSession` is core-owned and represents non-lifted target tracking from an already-selected source:

- a source square is already selected
- the current target is tracked on the session as `dragSession.targetSquare`
- move completion, if allowed, happens on `pointerup`

### `dragSession.targetSquare`

The current target square of the active interaction, if any. This field lives on `dragSession`; there is no separate top-level current-target field. It is meaningful only while a `dragSession` is active and is updated by `pointermove`.

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

### Interaction config

`interaction.drag.liftedActivation.thresholdPx` controls how `pointerdown` on an occupied source enters lifted-piece drag.

- desktop default: `0`
- mobile default: `5`
- must be a finite number, `>= 0`

Behavior:

- `thresholdPx === 0` — `pointerdown` on an occupied source starts an active lifted-piece drag immediately.
- `thresholdPx > 0` — `pointerdown` on an occupied source starts a pending lifted-piece drag. The session activates on a subsequent `pointermove` once movement from `startPoint` exceeds `thresholdPx`.

---

## Interaction outcomes

These are the main interpretation outcomes the core may choose.

### Selection outcomes

- select square
- reselect square
- clear selection (deselect)
- keep current selection

### Mode-entry outcomes

- start pending lifted-piece drag session
- start active lifted-piece drag session
- start release-targeting drag session
- do not start a drag session

### Targeting outcomes

- update `dragSession.targetSquare`
- clear `dragSession.targetSquare`
- keep `dragSession.targetSquare` unchanged
- activate a pending lifted-piece drag session

### Completion outcomes

- commit move
- cancel active interaction (clears active `dragSession`, preserves selected source)
- cancel interaction (clears selected source, active destinations, and `dragSession`)
- no-op

---

## Event responsibilities

### `pointerdown`

Responsible for interpreting the start of a board-owned press interaction.

Possible meanings:

- select a piece
- reselect another piece
- start a pending lifted-piece drag session
- start an active lifted-piece drag session
- start a release-targeting drag session
- ignore / no-op

`pointerdown` never commits a move.

### `pointermove`

Responsible for updating target state inside an already active `dragSession`, and for activating a pending lifted-piece drag once movement exceeds the configured threshold.

Possible meanings:

- update `dragSession.targetSquare`
- activate a pending lifted-piece drag session
- no-op

`pointermove` never commits a move and never by itself creates board ownership.

### `pointerup`

Responsible for completing, cancelling, or clearing an already active `dragSession`.

Possible meanings:

- complete a core move (active lifted-piece drag or release-targeting)
- complete an extension-owned drag through extension-owned completion
- cancel active interaction
- cancel interaction
- no-op

`pointerup` is the only event that may commit a core move.

### Terminal interruption — `pointercancel` and `lostpointercapture`

`pointercancel` and `lostpointercapture` are terminal interruption paths and may cancel or terminally resolve an active `dragSession` according to the runtime input controller. They are out of scope for the core decision model in this document; for exact behavior see [src/runtime/input/controller/pointer.ts](../src/runtime/input/controller/pointer.ts).

---

## Pointerdown decision model

Use this section as the primary interpretation guide for `pointerdown`.

### Step 1 — Did the relevant press start on the board?

- If no:
  - this is not a board-owned interaction
  - do not change any board interaction state, including:
    - `selectedSquare`
    - `dragSession`
  - do not enter any interaction mode
  - do not allow later move completion from this gesture

- If yes:
  - continue

### Step 2 — Is there already an active `dragSession` (defensive)?

- If yes:
  - an interaction session is already in progress
  - do not start a new board interaction from this `pointerdown`
  - keep the existing session active
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
  - do not start a drag session
- notes:
  - an empty square must not become `selectedSquare` in this model

#### Case A2 — Pressed square contains a piece

- interpretation:
  - select that square and start a lifted-piece drag session from it
- state changes:
  - `selectedSquare` becomes the pressed square
- session changes:
  - if `interaction.drag.liftedActivation.thresholdPx === 0`, start an active lifted-piece drag session from the newly selected square
  - if `interaction.drag.liftedActivation.thresholdPx > 0`, start a pending lifted-piece drag session from the newly selected square
  - the new `dragSession.targetSquare` is the source square
- notes:
  - this is the normal source-selection entry path
  - in this model, any occupied square can become the selected source when no selection is already present

---

### Branch B — Existing selection present

#### Case B1 — Pressed square is the same as `selectedSquare`

- interpretation:
  - re-lift the piece on the already selected source
- state changes:
  - `selectedSquare` stays unchanged
- session changes:
  - if `interaction.drag.liftedActivation.thresholdPx === 0`, start an active lifted-piece drag session from the already selected square
  - if `interaction.drag.liftedActivation.thresholdPx > 0`, start a pending lifted-piece drag session from the already selected square
  - the new `dragSession.targetSquare` is the source square
- notes:
  - this is not deselection on `pointerdown`
  - same-source repeated interaction must remain possible

#### Case B2 — Pressed square is empty

- interpretation:
  - start a release-targeting drag session on the pressed square
- state changes:
  - `selectedSquare` stays unchanged
- session changes:
  - a release-targeting `dragSession` starts with `dragSession.targetSquare` set to the pressed square
  - no lifted-piece drag session starts
- notes:
  - this is non-lifted target continuation, not source reselection
  - legal vs illegal status does not change `pointerdown` handling here
  - legality matters later during `pointerup` move completion

#### Case B3 — Pressed square contains a piece of the same color as `selectedSquare`

- interpretation:
  - reselect that square and start a lifted-piece drag session from it
- state changes:
  - `selectedSquare` becomes the pressed square
- session changes:
  - if `interaction.drag.liftedActivation.thresholdPx === 0`, start an active lifted-piece drag session from the newly selected square
  - if `interaction.drag.liftedActivation.thresholdPx > 0`, start a pending lifted-piece drag session from the newly selected square
  - the new `dragSession.targetSquare` is the source square
- notes:
  - this is a reselection outcome, not target continuation from the previous selection
  - this model must not treat a same-color occupied press as move targeting from the previously selected source

#### Case B4 — Pressed square contains an opposite-color piece

##### Case B4.1 — The pressed square is a legal target for the selected source

- interpretation:
  - start a release-targeting drag session on the pressed square
- state changes:
  - `selectedSquare` stays unchanged
- session changes:
  - a release-targeting `dragSession` starts with `dragSession.targetSquare` set to the pressed square
  - no lifted-piece drag session starts
- notes:
  - this is target continuation, not reselection
  - the current model uses release targeting here rather than committing immediately on `pointerdown`

##### Case B4.2 — The pressed square is not a legal target for the selected source

- interpretation:
  - reselect that square and start a lifted-piece drag session from it
- state changes:
  - `selectedSquare` becomes the pressed square
- session changes:
  - if `interaction.drag.liftedActivation.thresholdPx === 0`, start an active lifted-piece drag session from the newly selected square
  - if `interaction.drag.liftedActivation.thresholdPx > 0`, start a pending lifted-piece drag session from the newly selected square
  - the new `dragSession.targetSquare` is the source square
- notes:
  - this is a reselection outcome, not target continuation from the previous selection
  - this model must not treat an illegal opposite-color occupied press as move targeting from the previously selected source

---

### Pointerdown interpretation table

Use this as a compact scan-friendly lookup table after the decision model.

In the "Session changes" column, "lifted-piece drag" splits into pending vs active by `interaction.drag.liftedActivation.thresholdPx`:

- `thresholdPx === 0` → active lifted-piece drag session
- `thresholdPx > 0` → pending lifted-piece drag session

| Existing selection | Pressed square kind  | Legality context         | Interpretation                              | State changes                    | Session changes                                                                                             | Notes                                                     |
| ------------------ | -------------------- | ------------------------ | ------------------------------------------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| none               | empty                | n/a                      | no-op                                       | no state changes                 | do not start a drag session                                                                                 | empty square cannot become `selectedSquare`               |
| none               | contains a piece     | n/a                      | select source and start lifted-piece drag   | `selectedSquare = pressedSquare` | start lifted-piece drag from the newly selected square; `dragSession.targetSquare` = source square          | normal source-entry path                                  |
| present            | same selected square | n/a                      | re-lift on selected source                  | `selectedSquare` unchanged       | start lifted-piece drag from the already selected square; `dragSession.targetSquare` = source square        | not deselection on `pointerdown`                          |
| present            | empty                | legality evaluated later | start release-targeting drag session        | `selectedSquare` unchanged       | start release-targeting `dragSession` with `dragSession.targetSquare = pressedSquare`; no lifted-piece drag | legality matters later during `pointerup` move completion |
| present            | same-color piece     | n/a                      | reselect source and start lifted-piece drag | `selectedSquare = pressedSquare` | start lifted-piece drag from the newly selected square; `dragSession.targetSquare` = source square          | reselection, not target continuation                      |
| present            | opposite-color piece | legal target             | start release-targeting drag session        | `selectedSquare` unchanged       | start release-targeting `dragSession` with `dragSession.targetSquare = pressedSquare`; no lifted-piece drag | target continuation, not reselection                      |
| present            | opposite-color piece | not a legal target       | reselect source and start lifted-piece drag | `selectedSquare = pressedSquare` | start lifted-piece drag from the newly selected square; `dragSession.targetSquare` = source square          | reselection, not target continuation                      |

---

## Pointermove decision model

Use this section only for movement inside an already active `dragSession`.

`pointermove` does not create a new board-owned interaction by itself.

In this model, `pointermove` is responsible for:

- maintaining `dragSession.targetSquare` from the current pointer location, and
- activating a pending lifted-piece drag once movement exceeds `interaction.drag.liftedActivation.thresholdPx`.

`pointermove` does not:

- select a source
- reselect a source
- clear selection by itself
- commit a move

### Rule M1 — No active `dragSession`

When `dragSession === null`:

- interpretation:
  - no-op
- notes:
  - `pointermove` without an active session does not select a source
  - `pointermove` without an active session does not start a drag session
  - `pointermove` without an active session must not create board ownership

### Rule M2 — Pending lifted-piece drag session

When `dragSession` is a pending lifted-piece drag session:

- target behavior:
  - update `dragSession.targetSquare` to the square currently under the pointer (or `null` if the pointer does not resolve to a board square)
- activation behavior:
  - if movement from `dragSession.startPoint` exceeds `dragSession.thresholdPx`, activate the pending lifted-piece drag session
  - the activated session carries the same source and the current target square forward as the active session's `dragSession.targetSquare`
- otherwise the session remains pending
- completion behavior:
  - do not commit or reject a move on `pointermove`

### Rule M3 — Active lifted-piece drag session

When `dragSession` is an active lifted-piece drag session:

- target behavior:
  - update `dragSession.targetSquare` to the square currently under the pointer (or `null` if the pointer does not resolve to a board square)
- cleanup behavior:
  - do not clear `selectedSquare`
  - do not clear `dragSession`
- completion behavior:
  - do not commit or reject a move on `pointermove`
- notes:
  - square-kind interpretation from `pointerdown` does not re-run here
  - legality does not cause move completion on `pointermove`

### Rule M4 — Release-targeting drag session

When `dragSession` is a release-targeting drag session:

- target behavior:
  - update `dragSession.targetSquare` to the square currently under the pointer (or `null` if the pointer does not resolve to a board square)
- cleanup behavior:
  - do not clear `selectedSquare`
  - do not clear `dragSession`
- completion behavior:
  - do not commit or reject a move on `pointermove`
- notes:
  - this is target maintenance from the already selected source, not source reselection
  - `pointermove` must not promote a release-targeting session into a lifted-piece drag session
  - legality does not cause move completion on `pointermove`

### Rule M5 — Extension-owned drag session

When `dragSession` is extension-owned:

- target behavior:
  - update `dragSession.targetSquare` through the same target-tracking path used by core-owned sessions
- completion behavior:
  - core move completion does not apply
  - extension-owned completion happens on `pointerup` through extension-owned completion (see [Pointerup and completion rules](#pointerup-and-completion-rules))

### Pointermove lookup table

| Active session                 | Pointer on board? | Target square resolved? | Result                                                                  | Notes                                                         |
| ------------------------------ | ----------------- | ----------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------- |
| none                           | yes               | yes                     | no-op                                                                   | `pointermove` must not start a session by itself              |
| none                           | no                | no                      | no-op                                                                   | `pointermove` must not create board ownership                 |
| pending lifted-piece drag      | yes               | yes                     | `dragSession.targetSquare = resolvedSquare`; activate if past threshold | activation carries the current target into the active session |
| pending lifted-piece drag      | yes               | no                      | `dragSession.targetSquare = null`; activate if past threshold           | activation carries `null` target into the active session      |
| pending lifted-piece drag      | no                | no                      | `dragSession.targetSquare = null`; activate if past threshold           | session remains pending until movement exceeds threshold      |
| active lifted-piece drag       | yes               | yes                     | `dragSession.targetSquare = resolvedSquare`                             | continue lifted drag; no move commit                          |
| active lifted-piece drag       | yes               | no                      | `dragSession.targetSquare = null`                                       | keep drag active; no move commit                              |
| active lifted-piece drag       | no                | no                      | `dragSession.targetSquare = null`                                       | board-owned interaction may remain active; no commit          |
| release-targeting drag session | yes               | yes                     | `dragSession.targetSquare = resolvedSquare`                             | continue release targeting; no move commit                    |
| release-targeting drag session | yes               | no                      | `dragSession.targetSquare = null`                                       | keep release targeting active; no move commit                 |
| release-targeting drag session | no                | no                      | `dragSession.targetSquare = null`                                       | board-owned interaction may remain active; no commit          |
| extension-owned drag session   | any               | any                     | `dragSession.targetSquare` updated via target-tracking path             | core move completion does not apply                           |

---

## Pointerup and completion rules

This section defines when `pointerup` may complete a move and when it must not.

`pointerup` is the only event that may resolve core move completion in this model.

A core move may complete only from an already active core-owned `dragSession` of a session type that supports completion (active lifted-piece drag, release-targeting). `pointerup` does not create a new source selection or a new drag session by itself. `pointerup` may, however, cancel or clear an active session.

### Rule U1 — Active lifted-piece drag completion

When `dragSession` is an active lifted-piece drag session on `pointerup`:

- valid target outcome:
  - if `dragSession.targetSquare` is a legal move target from `selectedSquare`, complete the move
- source-return outcome:
  - if `dragSession.targetSquare === selectedSquare`, cancel active interaction (clears the active `dragSession`, preserves `selectedSquare`)
- other invalid target outcome:
  - if `dragSession.targetSquare` is any other invalid target (including `null`), cancel active interaction (clears the active `dragSession`, preserves `selectedSquare`)
- notes:
  - `pointerup` is the move-resolution point for active lifted-piece drag
  - legality is evaluated here, not on `pointerdown` or `pointermove`
  - releasing back onto the source square or onto any invalid target leaves the selected source in place; the lifted piece is no longer rendered because the active session is cleared

### Rule U2 — Pending lifted-piece drag completion

When `dragSession` is a pending lifted-piece drag session on `pointerup`:

- the pending session must not complete a core move
- pointerup before activation goes through the same terminal-release path and cancels active interaction
- result: the active `dragSession` is cleared, `selectedSquare` is preserved
- notes:
  - this is the "click without dragging past threshold" outcome on touch / threshold-gated configurations
  - legality is not evaluated for a pending session — completion is impossible regardless of what the pending target square is

### Rule U3 — Release-targeting completion

When `dragSession` is a release-targeting drag session on `pointerup`:

- valid target outcome:
  - if `dragSession.targetSquare` is a legal move target from `selectedSquare`, complete the move
- source-return outcome:
  - if `dragSession.targetSquare === selectedSquare`, cancel active interaction (clears the active `dragSession`, preserves `selectedSquare`)
- other invalid target outcome:
  - if `dragSession.targetSquare` is any other invalid target (including `null`), cancel interaction (clears `selectedSquare`, active destinations, and the active `dragSession`)
- notes:
  - `pointerup` is the move-resolution point for release targeting
  - legality is evaluated here, not on `pointerdown` or `pointermove`
  - releasing back onto the selected source preserves selection in release-targeting; releasing onto any other invalid target clears selection

### Rule U4 — Extension-owned drag session completion

When `dragSession` is extension-owned on `pointerup`:

- pointerup completes the extension drag through extension-owned completion
- core move completion does not apply
- the extension is responsible for any extension-defined completion semantics

### Rule U5 — No active `dragSession`

When `dragSession === null` on `pointerup`:

- interpretation:
  - no-op for move completion
- notes:
  - `pointerup` without an active session does not commit a move
  - `pointerup` without an active session does not select or reselect a source
  - `pointerup` without an active session does not clear selection by itself

### Core principles

- `pointerup` is the only event that may complete a core move
- `pointerdown` never commits a move
- `pointermove` never commits a move
- `pointermove` does not by itself create board ownership
- `turn` remains position state, not interaction-layer authority

### Pointerup lookup table

| Active session                 | `dragSession.targetSquare` state   | Outcome                    | Effect on selection / session                                    | Notes                                                 |
| ------------------------------ | ---------------------------------- | -------------------------- | ---------------------------------------------------------------- | ----------------------------------------------------- |
| active lifted-piece drag       | legal target from `selectedSquare` | complete move              | move commit clears the active `dragSession`                      | active lifted-piece drag resolves only on `pointerup` |
| active lifted-piece drag       | equals `selectedSquare`            | cancel active interaction  | active `dragSession` cleared; `selectedSquare` preserved         | source-return preserves selection                     |
| active lifted-piece drag       | other invalid target (or `null`)   | cancel active interaction  | active `dragSession` cleared; `selectedSquare` preserved         | invalid release preserves selection                   |
| pending lifted-piece drag      | any                                | cancel active interaction  | active `dragSession` cleared; `selectedSquare` preserved         | pending session cannot complete a core move           |
| release-targeting drag session | legal target from `selectedSquare` | complete move              | move commit clears the active `dragSession`                      | release-targeting resolves only on `pointerup`        |
| release-targeting drag session | equals `selectedSquare`            | cancel active interaction  | active `dragSession` cleared; `selectedSquare` preserved         | source-return preserves selection                     |
| release-targeting drag session | other invalid target (or `null`)   | cancel interaction         | `selectedSquare`, active destinations, and `dragSession` cleared | invalid release away from source clears selection     |
| extension-owned drag session   | any                                | extension-owned completion | extension-defined; core move completion does not apply           | extensions handle their own completion semantics      |
| none                           | n/a                                | no-op                      | no completion cleanup required                                   | no active session exists                              |

---

## Interaction cancellation

This section defines the expected effect of explicit interaction cancellation.

The runtime exposes two cancellation operations, with different scopes:

- `cancelActiveInteraction` — clears only the active `dragSession` and preserves the selected source.
- `cancelInteraction` — clears the selected source, active destinations, and `dragSession`.

When invoked, neither commits a move.

How they map to the cases described above:

- pending lifted-piece drag cancellation before activation preserves the selected source (uses `cancelActiveInteraction`)
- active lifted-piece drag invalid release preserves the selected source (uses `cancelActiveInteraction`)
- release-targeting invalid release away from the source clears the selected source (uses `cancelInteraction`)

Notes:

- `cancelActiveInteraction` returns the board to a selected-source state with no active session
- full deselection requires `cancelInteraction` (or equivalent selection clearing)

---
