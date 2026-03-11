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

- Confirm external destinations remain input into core interaction/runtime
- Clarify how host-provided data enters runtime without leaking into renderer
- Keep legality source external, behavior usage internal

### 2.4 Runtime tests

- Add focused tests for wiring and invalidation flow
- Add tests for state change → invalidation → render scheduling path
- Add tests for no-op updates / narrow updates

---

## Phase 3 — Drag and interaction system

### 3.1 Interaction state model

- Define minimal core interaction facts:
  - selected square / selected piece context
  - destinations
  - drag session state
  - current target square
- Keep interaction facts in core
- Keep optional overlay visuals out of core

### 3.2 Drag lifecycle

- Define pointer-down / hold / drag-start / drag-move / drop / cancel flow
- Unify tap-to-select and drag behavior under one interaction model
- Support piece-selected → destination targeting flow
- Keep illegal target behavior explicit

### 3.3 Drag rendering responsibilities

- Define what belongs in `dragRoot`
- Define how original piece vs drag preview are handled
- Define interaction between drag visuals and base pieces layer
- Ensure non-drag roots remain stable during drag

### 3.4 Hit testing / mapping

- Integrate input geometry and square mapping into drag flow
- Keep renderer layout contract separate from input mapping concerns
- Confirm `null` no-square convention remains consistent throughout interaction code

### 3.5 Drag tests

- Add focused tests for selection / drag / cancel / illegal drop / legal drop
- Add tests for selected-piece then destination-targeting flow
- Add tests for destinations-driven behavior

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
- Read core interaction state
- Render:
  - selected/source square highlight
  - destination dots
  - target highlight
  - interaction halo/press feedback
- Keep interaction facts in core, visuals in extension

### 4.4 Extension lifecycle / invalidation contract

- Define minimal extension lifecycle:
  - mount
  - update
  - render
  - teardown
- Define how extensions are notified of relevant updates
- Avoid overdesigning a universal plugin system too early

### 4.5 Extension tests

- Add focused tests for mount/unmount/update flow
- Add tests for extension subtree ownership and cleanup
- Add tests for `lastMove` behavior
- Add tests for interaction overlay reading core state correctly

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

- Finalize selection/destinations-related API shape
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
