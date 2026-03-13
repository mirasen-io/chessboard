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

---

## Phase 4 — Extension / overlay model

### 4.1 Minimal extension mounting model

- Define core-owned slot model for extensions
- Core creates and owns top-level extension slot roots
- Extension only owns its assigned subtree root(s)
- Do not allow arbitrary top-level DOM ownership by extensions

### 4.2 First first-party extension: `lastMove`

- Use `lastMove` as the first passive extension
- Keep `lastMove` state inside the extension
- Feed extension with board transition/update context
- Render into appropriate extension slot
- Use this to validate extension lifecycle and mounting model

### 4.3 Interaction overlay extension

- Add first-party interaction visual extension after drag/runtime stabilize
- Read finalized core interaction state
- Render:
  - selected/source square highlight
  - destination dots
  - current target highlight
  - optional press / interaction halo feedback
- Keep interaction facts in core and interaction visuals in the extension layer

### 4.4 Extension lifecycle / invalidation contract

- Define minimal extension lifecycle:
  - mount
  - update
  - render
  - teardown
- Define how extensions are notified of relevant updates
- Keep extension invalidation aligned with core update flow
- Avoid overdesigning a universal plugin system too early

### 4.5 Extension tests

- Add focused tests for mount/unmount/update flow
- Add tests for extension subtree ownership and cleanup
- Add tests for `lastMove` behavior
- Add tests for interaction overlay reading core interaction state correctly

---

## Phase 5 — Public API shaping

### 5.1 Public construction/config API

- Shape public board creation API only after runtime and extension model are stable
- Re-check what belongs in constructor vs runtime setters
- Re-check public config boundaries:
  - board state inputs
  - interaction inputs
  - render config
  - optional feature/extension registration

### 5.2 Public state exposure

- Finalize what snapshot is publicly exposed
- Confirm stable public meaning of piece identity exposure
- Confirm public read model does not leak implementation details

### 5.3 Public interaction API

- Finalize public interaction API shape only after drag/runtime/overlay behavior is proven
- Re-check what interaction facts, if any, should be externally readable
- Re-check what interaction inputs should be externally writable or configurable
- Keep legality source external
- Avoid baking speculative APIs before real runtime needs are proven

### 5.4 Public extension API

- Expose only the minimum extension surface proven by first-party extensions
- Avoid generic hooks that were not needed in real implementation
- Keep ownership and lifecycle constraints explicit

### 5.5 Public API tests

- Add tests for public construction/config/update API
- Add tests for snapshot behavior
- Add tests for public extension registration path
- Add tests for backward-safe expected usage patterns

---

## Phase 6 — Hardening / polish to library-ready

### 6.1 Cleanup and consistency pass

- Remove legacy names and dead code paths
- Normalize naming across state/runtime/renderer/input/extensions
- Ensure docs/comments reflect actual architecture, not intermediate designs

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

### 6.4 Packaging / release readiness

- Verify exports are intentional
- Verify no accidental internal types leak from package entrypoint
- Verify type declarations are clean
- Verify tests pass for core supported scenarios

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
