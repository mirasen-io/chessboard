_Current status: the project has already crossed the early public-package `0.1.x` checkpoint. The next major functional step is promotion flow completion, followed by cleanup of legacy paths and a new focused test pass._

# Chessboard implementation plan — from Pre-Phase 2 to library-ready

## Pre-Phase 2 — Core cleanup / normalization

**Status: COMPLETE**

### 0.1 Renderer root / slot normalization

**Status: COMPLETE**

- Rename `root` to `svgRoot`
- Rename legacy `layer*` fields to ownership-based `...Root`
- Remove core-owned highlights layer from `SvgRenderer`
- Keep only core-owned roots in renderer:
  - `boardRoot`
  - `coordsRoot`
  - `piecesRoot`
  - `dragRoot`
- Add reserved extension slot roots:
  - `extensionsUnderPiecesRoot`
  - `extensionsOverPiecesRoot`
  - `extensionsDragUnderRoot`
  - `extensionsDragOverRoot`
- Fix and document stable DOM order of all roots/slots
- Keep `DirtyLayer` as invalidation vocabulary, separate from DOM root naming

### 0.2 State / snapshot / render config separation

**Status: COMPLETE**

- Keep `InternalState` and `StateSnapshot` as separate types
- Do **not** make snapshot a readonly clone of full internal state
- Split board/runtime state from visual config
- Move `theme` out of core state into renderer/view config
- Remove `lastMove` from core state and snapshot
- Re-check which fields are truly core runtime state vs implementation detail
- Re-check which fields belong in public snapshot vs should stay internal

### 0.3 Post-cleanup validation

**Status: COMPLETE**

- Update focused tests for renderer roots/DOM structure
- Update state/snapshot tests after separation
- Confirm no architectural leakage from render config into state
- Confirm no dead fields / dead invalidation paths remain

---

## Phase 2 — Runtime composition

**Status: IN PROGRESS**

### 2.1 Internal runtime model

**Status: COMPLETE**

- Define internal board runtime/controller responsibilities
- Define how state, renderer, scheduler, and input collaborate
- Keep boundaries explicit:
  - state owns canonical board/runtime facts
  - renderer owns SVG DOM
  - scheduler owns batching/frame timing
  - input owns pointer interpretation

### 2.2 Update flow / invalidation flow

**Status: COMPLETE**

- Define state update path
- Define render request path
- Define invalidation routing into renderer
- Keep square-level and layer-level invalidation semantics clear
- Confirm no accidental coupling between renderer and state mutation

### 2.3 External input feeding

**Status: COMPLETE**

**Phase 2.3a — internal-only movability feeding into runtime/state/snapshot**  
**Status: COMPLETE**

**Phase 2.3b — runtime/input begins consulting movability**  
**Status: COMPLETE**

- Confirm external interaction policy enters runtime/state without leaking into renderer
- Keep legality source external and board rule-agnostic
- Store movability internally and consult it for move-attempt eligibility
- Allow strict movability to carry external destinations while free movability allows unrestricted move attempts
- Keep renderer independent from movability in Phase 2.3

### Immediate renderer bugfix

**Status: COMPLETE**

- Fix coordinate label placement under black orientation
- Add/adjust focused renderer test for black orientation label placement

### Board state / view state split

**Status: COMPLETE**

- Separate facts about the position from presentation / interaction state
- Keep board state focused on position facts:
  - pieces
  - ids
  - turn
- Introduce view state for non-position board UI state:
  - orientation
  - selected
  - future drag / presentation state
- Remove presentation state from board snapshot / state contracts where appropriate
- Keep renderer fed by board snapshot + geometry/view-derived inputs, not duplicated orientation sources
- Do not introduce a full controller yet; establish the logical split first

### 2.4 Runtime tests

**Status: COMPLETE**

- Add focused tests for wiring and invalidation flow
- Add tests for state change → invalidation → render scheduling path
- Add tests for no-op updates / narrow updates

---

### 2.5 Piece rendering review

**Status: COMPLETE**

- Review current piece sprite rendering strategy before deeper drag/input work
- Evaluate whether full-sprite `<image>` + `clip-path` is acceptable for piece hit-targeting and drag ownership
- If needed, normalize per-piece DOM structure without redesigning unrelated renderer parts

## Phase 3 — Drag and interaction system

### 3.1 Interaction state model

**Status: COMPLETE**

- Define minimal core interaction facts:
  - selected square / selected piece context
  - destinations
  - drag session state
  - current target square
- Keep interaction facts in core
- Keep optional overlay visuals out of core

### 3.2 Drag lifecycle

**Status: COMPLETE**

- Define pointer-down / hold / drag-start / drag-move / drop / cancel flow
- Unify tap-to-select and drag behavior under one interaction model
- Support piece-selected → destination targeting flow
- Keep illegal target behavior explicit

### 3.3 Drag rendering responsibilities

**Status: COMPLETE**

- Define render ownership during active drag
- Define what belongs in `dragRoot` vs what remains in base renderer roots
- Define how source piece vs drag preview are represented during drag
- Confirm whether the source piece is hidden, suppressed, or otherwise visually neutralized while drag is active
- Keep non-drag roots stable during drag unless a real invalidation requires update
- Keep drag-time visuals in core only where needed for direct drag rendering; defer optional overlay-style visuals to extensions

### 3.4 Hit testing / mapping

**Status: COMPLETE**

- Integrate input geometry and square mapping into active interaction flow
- Keep renderer layout contract separate from pointer interpretation and target resolution
- Define `currentTarget` update semantics during pointer move
- Define behavior when pointer leaves the board or maps to no square
- Confirm `null` no-square convention remains consistent across hover, drag, cancel, and drop handling

### 3.5 Drag tests

**Status: COMPLETE**

- Add focused tests for interaction-state transitions:
  - press/select
  - drag start
  - drag move
  - cancel
  - legal drop
  - illegal drop
- Add tests for selected-square → destination-targeting flow
- Add tests for destinations-driven behavior under strict movability
- Add tests for `currentTarget` updates, including off-board / `null` cases
- Add tests for drag rendering behavior if source-piece suppression / drag preview ownership is renderer-visible

### 3.6 Input / UI adapter wiring

**Status: COMPLETE**

- Add DOM/pointer adapter that reads board-local pointer coordinates
- Use geometry + `mapBoardPointToSquare(...)` to resolve square or `null`
- Feed controller on pointer down / move / up / cancel
- Update `currentTarget` during active interaction through the adapter path
- Clear target on off-board / leave / cancel according to settled semantics
- Keep DOM event plumbing separate from controller/runtime logic
- Do not expand public API in this step

### 3.7 Input adapter tests

**Status: COMPLETE**

- Add focused tests for DOM/pointer → controller/runtime wiring
- Add tests for board-local coordinate extraction and square / `null` mapping through the adapter path
- Add tests that pointer move updates `currentTarget` through the adapter
- Add tests for off-board / leave behavior through the adapter
- Add tests for pointer cancel / release behavior through the adapter
- Confirm adapter wiring does not leak DOM concerns into controller/runtime contracts
- Keep tests narrow and avoid re-covering controller lifecycle already validated in Phase 3.5

### 3.8 Drag visual bug-fix pass

**Status: COMPLETE**

- Investigate why active drag is not visually rendered in the runtime/manual sandbox
- Confirm whether drag interaction is actually starting, or only completing on release
- Verify renderer behavior during active drag:
  - source piece suppression / hiding while drag is active
  - drag preview presence in `dragRoot`
  - drag-time invalidation / rerender path
- Fix the missing active-drag visual path without reopening settled interaction architecture
- Add/update focused tests for active drag rendering behavior where appropriate
- Prevent native text selection / drag-selection artifacts during active board interaction (for example coordinate text selection while dragging)
- Re-verify in the runtime/manual sandbox where move commit works on release but drag preview is currently missing

### 3.9 Move animation architecture + base implementation

**Status: COMPLETE**

- Add renderer-side move animation for committed move application
- Cover click-move / release-complete flow, not only drag-drop
- Keep animation ownership in renderer/view layer, not in core interaction state
- Design the animation flow to support both single-piece and multi-piece committed move animation from the start
- Define minimal animation lifecycle:
  - animation start on committed move
  - one or more animated pieces with source/destination squares
  - cleanup after animation completes
- Implement the base path for ordinary single-piece moves
- Ensure animation does not break existing invalidation, selection, or interaction semantics
- Add/update focused tests for animation-triggering behavior where appropriate
- Verify manually in runtime playground

### 3.10 Animation architecture refactor + castling integration

**Status: COMPLETE**

- Refactor committed-move animation from the current renderer-driven implementation toward a general animation pipeline
- Introduce a minimal `AnimationPlan` model for committed transitions, designed around visual transition from previous placement to next placement
- Keep the initial core effect vocabulary minimal and reusable:
  - `move`
  - `fade-in`
  - `fade-out`
  - `snap-out`
- Preserve the rule that board state is committed **before** animation; animation is presentation over committed state, not delayed state application
- Move animation orchestration / lifecycle ownership out of the renderer into a dedicated `Animator`
- Keep SVG scene graph / layer ownership inside the main renderer
- Split renderer responsibilities into:
  - static render pass for committed board state
  - animation render pass/helper for active animation sessions
- Migrate ordinary committed move animation onto the new pipeline so it no longer remains a separate renderer-specific path
- Implement castling on the same pipeline as the first required multi-track case:
  - king and rook animate **simultaneously**
  - no castling-only renderer choreography
  - no sequential king-then-rook animation
- Keep move-type special-casing out of renderer as much as possible; castling should become coordinated animation input, not a separate rendering system
- Compute animation input from previous -> next renderable piece placements in runtime/core
- Do not introduce persistent semantic piece IDs unless strictly necessary; prefer a practical transition-time matcher sufficient for ordinary move + castling
- Represent each active animation session with its own `<g>` group inside the shared `animationRoot`
- Design the session / effect boundaries so standard core animation effects can be reused later by extensions
- Do **not** implement extension animation hooks/API yet
- Add/update focused tests for:
  - ordinary move on the new pipeline
  - castling triggering two simultaneous move tracks
  - animation cleanup / session cleanup
  - drag-drop vs non-drag policy preservation where relevant
- Verify manually in runtime playground

---

## Phase 4 — Extension / overlay model

### 4.1 Minimal extension mounting model

**Status: COMPLETE**

- Define core-owned slot model for extensions
- Core creates and owns top-level extension slot roots
- Extension only owns its assigned subtree root(s)
- Do not allow arbitrary top-level DOM ownership by extensions

### 4.2a First lifecycle-validation extension: `Selected Square (with figure)`

**Status: COMPLETE**

- Implement a minimal passive extension that highlights the currently selected square when it contains a piece
- Render into the appropriate extension slot
- Use this as the first end-to-end validation of:
  - runtime extension mounting
  - extension update flow
  - extension-owned subtree rendering
  - extension cleanup

### 4.2b First move-derived extension: `lastMove`

**Status: COMPLETE**

- Implement `lastMove` after the first extension lifecycle path is validated by `Selected Square`
- Keep `lastMove` state inside the extension
- Feed the extension with the required board transition/update context
- Render into the appropriate extension slot
- Use this as the first validation of an extension that depends on move-derived state rather than only current interaction state

### 4.3 Interaction overlay extension

**Status: COMPLETE**

- Add a first-party interaction overlay extension after the initial runtime and extension path are validated
- Keep interaction facts in core and interaction visuals in the extension layer
- Read finalized core interaction state as the source of truth
- Use this phase to validate transient interaction-driven visuals during active drag/touch workflows, not just static selection state
- Treat this as the interaction-visual counterpart to the already-validated `selectedSquare` and move-derived `lastMove` steps

### 4.3a First active interaction visual: `activeTarget`

**Status: COMPLETE**

- Start the interaction overlay work with the first meaningful transient interaction visual:
  - implement the `activeTarget` extension
  - active target-square highlight during active interaction
  - halo / ring feedback for the active interaction target
- Before or alongside implementation, finalize and document the normalized standard-play interaction model that `activeTarget` depends on:
  - pointerdown source/target interpretation
  - pointermove target-maintenance semantics
  - pointerup completion and cleanup semantics
  - explicit interaction-cancellation semantics relevant to active interaction cleanup
- Use the documented interaction model as the source of truth for `activeTarget` gating and lifecycle:
  - active interaction context, not raw `currentTarget` alone
  - `dragSession` and `releaseTargetingActive` as the authoritative interaction-mode facts
  - cleanup behavior aligned with the documented interaction model
- As part of this normalization, remove `MovableColor` / `movability.color` and related color-gating logic:
  - do not keep side-color gating as a separate movability axis
  - keep interaction authority on concrete movability / source-target eligibility behavior instead
  - simplify free movability accordingly if color-scoped free movement is not a real product requirement
- Use this step as the first real validation of an extension that reacts to live interaction targeting changes during pointer/touch movement
- Gate rendering by active interaction context, not by raw `currentTarget` alone
- Keep the initial version deliberately narrow:
  - current target-square feedback only during active interaction
  - halo / ring included as part of the same extension
  - no destination dots yet
  - no broader move-hint system yet
  - no animation required unless implementation proves it is already naturally supported
- Treat this step as the semantic and visual foundation for later transient interaction overlays
- As part of this step, remove `MovableColor` / `movability.color` and all related color-gating logic from movability:
  - eliminate color-based source gating
  - simplify `free` movability accordingly
  - keep interaction authority on concrete source/target eligibility behavior instead

### 4.3b UX alignment pass for repeated same-piece drag after drop-to-source

**Status: COMPLETE**

- After selected-square highlighting is visible, manually verify the repeated same-piece interaction flow:
  - pointerdown on piece → selection + drag start
  - drop back to source → drag stop with selection persistence
  - repeated pointerdown on the same selected piece
  - repeated drop back to source
- Compare the observed behavior against the intended chess.com-style UX
- If needed, implement a narrow interaction-semantic follow-up so repeated same-piece drag / selection behavior aligns with the chosen standard
- Keep this pass narrowly focused on this specific UX flow
- Do not broaden it into general interaction redesign

### 4.3c Legal moves extension + flexible strict movability destination source

**Status: COMPLETE**

Goal:

- add a first-party `legalMoves` extension
- extend strict movability so legal destinations can be provided either as a precomputed record or as a resolver function

Completed:

- strict movability now supports both precomputed destination records and resolver-based destination lookup
- runtime behavior remains correct for existing record-based strict movability callers
- a first-party `legalMoves` extension is implemented and wired through the extension system
- `legalMoves` renders legal destinations from the existing movability source of truth without taking ownership of legality decisions
- the built-in extension path now includes `legalMoves` as part of the first-party/public wrapper surface

Notes:

- `legalMoves` remains presentation-only; move-policy ownership stays outside the extension
- coexistence with the existing built-in overlay extensions was validated during the wrapper/public API pass
- broader cleanup and additional tests are intentionally deferred until after the promotion step

### 4.4 Extension lifecycle / invalidation contract

**Status: COMPLETE**

- Define minimal extension lifecycle:
  - mount
  - update
  - render
  - teardown
- Define how extensions are notified of relevant updates
- Keep extension invalidation aligned with core update flow
- Avoid overdesigning a universal plugin system too early

### 4.5 Extension tests

**Status: COMPLETE**

- Add focused tests for mount/unmount/update flow
- Add tests for extension subtree ownership and cleanup
- Add tests for `lastMove` behavior
- Add tests for interaction overlay reading core interaction state correctly
- Add focused tests for the first interaction-overlay extension pass:
  - selected-square highlight reflects core interaction selection state
  - selected-square highlight appears for the currently selected square and clears when selection clears
- Keep these tests narrow:
  - verify extension input/output behavior
  - do not turn them into broad renderer snapshot suites unless needed

### 4.6 Promotion flow + minimal deferred-input subscription surface

**Status: PLANNED**

Goal:

- complete the first promotion flow for UI-originated moves
- validate deferred UI move handling through a real first-party extension
- add only the minimal subscription/runtime surfaces required for the promotion chooser lifecycle

Why:

- the current early public package is already usable for `0.1.x`, but promotion remains the main missing functional interaction step
- promotion is the first real proof point for deferred UI move handling, extension-owned temporary UI state, and extension-managed pointer-event capture during a pending choice flow
- this step should validate the smallest viable subscription model before any broader event-platform expansion

Scope:

- detect promotion ambiguity through the existing UI move request path
- allow the promotion extension to defer the UI move request
- let the extension enter a pending promotion mode with internal data-only pending state
- keep `onUiMoveRequest` narrow: identify the case, store pending state, call `defer()`
- use `onUpdate` as the lifecycle owner for:
  - subscribing to pointer input needed by the chooser
  - unsubscribing during cleanup
  - enabling transient-visual participation for chooser hover/press feedback
  - setting invalidation as needed for chooser lifecycle changes
- render the stable chooser structure in the normal extension render path
- render hover / pressed / preview feedback in transient visuals
- allow chooser pointer handling to consume board input while the pending promotion UI is active
- provide a narrow deferred-resolution path for:
  - committing the deferred promotion choice
  - cancelling the deferred promotion choice

Constraints:

- do not broaden this step into a general event-platform redesign
- do not add keyboard, accessibility, or generalized modal-management scope here
- do not redesign programmatic `move(...)`; promotion ambiguity remains a UI move interpretation concern
- do not store live deferred request objects in public snapshots
- keep the new subscription/runtime surface minimal and justified by the promotion use case

Done when:

- a UI move that requires promotion can be deferred and completed through a first-party promotion chooser
- the promotion extension can subscribe/unsubscribe to the required pointer events through the runtime surface
- chooser interactions can consume relevant pointer events while active
- chooser structure renders through the normal render path
- chooser hover/press feedback renders through transient visuals
- deferred commit and deferred cancel both clean up correctly
- the step is validated manually in the runtime/manual environment and through the package-level usage path where practical

---

## Phase 5 — Public API shaping

**Status: MOSTLY COMPLETE FOR EARLY `0.1.x` RELEASE**

### 5.1 Public construction/config API

**Status: COMPLETE FOR EARLY `0.1.x`**

- a public package-level wrapper is in place
- `createBoard(...)` is available from the main package entrypoint
- built-in extensions are exposed through the public package surface
- the wrapper resolves built-in string ids and explicit extension definitions
- immediate mount-on-create and document-only creation paths are both supported

### 5.2 Public state exposure

**Status: COMPLETE FOR CURRENT EARLY RELEASE SCOPE**

- `getSnapshot()` is exposed on the public board surface
- the current public snapshot surface is sufficient for the smoke/manual usage path
- snapshot exposure remains intentionally limited; no broader public read model expansion is required before the next functional step

### 5.3 Public interaction API

**Status: PARTIALLY COMPLETE**

- the current public board surface already supports the main early-use commands needed by the package smoke/manual path
- programmatic interaction and UI-originated move handling are intentionally kept distinct
- the next public-interaction-related step is promotion/deferred UI flow completion, not a broad public API redesign

### 5.4 Public extension API

**Status: PARTIALLY COMPLETE**

- the public wrapper exposes the minimum proven first-party extension surface needed for the current early release
- typed `board.extensions.events` is available and usable from the consumer side
- broader extension subscription/runtime surfaces required for promotion should be added only as part of the promotion step

### 5.5 Public API tests

**Status: DEFERRED UNTIL AFTER PROMOTION**

- broad public API test expansion is intentionally deferred
- the current package/public surface has already been validated through real package-path usage and an external installed-consumer smoke test
- after promotion is implemented, add focused public API tests against the stabilized early-release surface

### 5.6 Early package release checkpoint

**Status: COMPLETE**

- package-level entrypoints for `.` and `./extensions` are in place
- the package builds successfully in release mode
- the external installed-consumer smoke test passed after fixing ESM relative import specifiers for published output
- the project has reached an early public-package checkpoint suitable for `0.1.x`
- the next major functional step is promotion flow, not additional package-surface expansion

## Phase 6 — Hardening / polish to library-ready

### 6.1 Cleanup and consistency pass

- Remove legacy names and dead code paths
- Normalize naming across state/runtime/renderer/input/extensions
- Ensure docs/comments reflect actual architecture, not intermediate designs

### 6.1a Post-promotion cleanup pass

**Status: PLANNED**

- remove old or no-longer-relevant legacy source paths after promotion is in place
- delete or replace tests that only reflect the old architecture and no longer validate current behavior
- keep this cleanup intentionally after promotion so the codebase is cleaned against the more complete new-architecture shape rather than mid-transition

### 6.2 Performance sanity pass

- Re-check narrow invalidation behavior
- Re-check drag-time rendering stability
- Re-check unnecessary DOM churn across roots
- Re-check scheduler assumptions

### 6.3 Documentation pass

- Write architecture notes for:
  - board state vs view state vs interaction state
  - state vs snapshot vs render config
  - renderer roots and extension slots
  - interaction model
  - extension ownership model
- Write usage examples for basic board, destinations, and optional extensions
- CONTRIBUTING/CONTRIBUTION.md
- EVOLUTION.md

### 6.4 Packaging / release readiness

**Status: EARLY RELEASE CHECKPOINT REACHED**

- exports have been validated through real external installed-consumer usage
- package-path ESM import issues were fixed by restoring proper `.js` relative specifiers in the published graph
- type declarations and package entrypoints are in a usable early-release state
- further packaging hardening can continue later, but it is no longer the next blocking step

Next after the current functional work:

- re-run release/publish sanity checks after promotion and the subsequent cleanup/test pass
- keep final release-candidate hardening separate from the current promotion implementation step

### 6.5 Release candidate review

- Final architecture sanity review
- Public API sanity review
- Naming consistency review
- “Could we support this in v1 without regret?” pass

---

## Library-ready outcome

- Core board platform is minimal and rule-agnostic
- Core owns board/runtime/interaction facts, not optional overlay feature state
- Renderer owns stable SVG root/slot structure
- Extensions own only their subtree and optional feature state
- `lastMove` validated as first passive extension
- Interaction visuals validated as extension-driven presentation over core interaction state
- Public API shaped only after architecture proved itself through implementation
