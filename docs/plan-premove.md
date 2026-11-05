# Premove — Architecture Plan (Working Hypotheses)

## Scope

High-level, **provisional architecture** for the optional premove extension; not an implementation specification. The intended gestures and preset differences are in [plan-interaction-model-premove.md](./plan-interaction-model-premove.md), and Chess.com observations are in [issue #71](https://github.com/mirasen-io/chessboard/issues/71).

Keep the runtime's actual board position authoritative. Prefer extending and reusing existing contracts over introducing parallel rendering and interaction mechanisms.

## Projected position and interaction ownership

Queued premoves produce a **projected piece position** distinct from the real runtime board. For example, after queuing a knight move to b3, another premove may start from projected b3 even though the actual board has no knight there.

- **Premove owns** its queue, projected position, selected piece/square, candidate destinations, and premove interaction outcomes. It must not mutate the real board just to show a queued move.
- **Runtime retains** normal game interaction and movability. Premove claims only the input gestures defined in the interaction model (including selected-piece gestures and preset-dependent queue cancellation); unrelated gestures remain with runtime.
- Runtime `select(square)` requires a piece on the **real** board. Runtime `activeDestinations` depend on runtime `movability`, and selection is reconciled against real board changes. Therefore switching runtime movability alone cannot implement projected selection.
- A **separate, premove-owned destination resolver/policy** is the likely approach. Required strict-style configuration at extension creation (no `free`/`disabled` modes and no setter) remains an **API hypothesis** to validate, not a settled contract.

## One unified Piece Overrides mechanism (preferred hypothesis)

Instead of exposing `suppressSquares` while separately drawing projected pieces, let the **main renderer** own a single mechanism for composing **partial per-square piece overrides** with the real board. Call the external capability **Piece Overrides** (tentative naming).

For each square:
- **Not specified:** preserve the value from the underlying position/layer.
- **Specified as empty (`PieceCode.Empty = 0`):** draw no stationary piece there.
- **Specified as a nonempty `PieceCode`:** draw that piece there, even when the real board differs.

An override contains only changed squares, **not a replacement 64-square position**. Explore an appropriate sparse input representation; do not use `-1` to mean empty because the current internal empty code is `0`. Omission must remain distinguishable from explicit empty.

### Handles and composition

- Acquire/register an override set through a renderer capability; get an **object handle** exposing **`update(overrides)`** and **`release()`**, not a release-only callback.
- `update()` **replaces the handle's entire partial set**, preserving its original precedence and allowing premove to maintain a single long-lived handle as the queue changes.
- `release()` removes the handle, revealing whichever underlying override or actual board piece applies.
- Support multiple simultaneous handles. Compose them in **registration order**: later-registered handles override earlier ones on intersecting squares. **Updates do not reorder handles.**
- The renderer invalidates and redraws affected pieces on acquire, update, and release; define cleanup for unmount/destroy. Exact public types and handle lifetime rules remain to be designed.

Example: a premove handle overrides **g1 → empty** and **b3 → white knight**. A subsequently registered active-drag handle overrides **b3 → empty** while the existing drag renderer draws the knight under the pointer. Releasing the drag handle reveals the premove position; releasing the premove handle reveals the real position.

### Consolidate existing internal suppression

**Do not create a second suppression mechanism underneath Piece Overrides.** Refactor the current suppression sources into consumers of the **same underlying override registry/composition mechanism**:

- Active lifted-piece drag: temporarily override its source square as empty.
- Animations: temporarily override their suppressed squares as empty, potentially across multiple sessions.
- Deferred UI moves: temporarily override their relevant squares as empty.
- Premove and other explicitly wired extensions: supply empty **or nonempty** overrides through the external capability.

The renderer can use an internal adapter/interface for existing consumers and expose a narrower capability externally, but there must be **one effective-piece computation**, not a parallel suppression pipeline plus override pipeline. Preserve existing drag/animation/deferred-move behavior; investigate exact acquisition/release timing and rendering lifecycle before implementation.

The capability affects **visual piece placement only**: it does not change actual board state, hit-testing, selection, or move legality. Premove still computes projected interaction data itself.

## Reuse existing visuals

| Visual | Likely approach |
| --- | --- |
| Stationary real/projected pieces | **Main renderer** draws the effective position produced by Piece Overrides, reusing existing piece symbol and SVG logic. |
| Lifted dragged piece | Reuse the shared **extension-owned `lifted-piece-drag` session** with `sourcePieceCode`. The main renderer already recognizes active lifted drag sessions without checking their owner; avoid premove-specific renderer wiring. |
| Active target | Evaluate reuse of the existing `active-target` extension from the shared drag session. |
| Selected-square highlight | Premove has its own selection state; extract a **small shared internal SVG drawing helper** rather than add a selection capability. Runtime `select(square)` cannot select a projected-only piece. |
| Candidate destination dots/rings | Prefer a **shared internal drawing helper** used independently by `legal-moves` and premove, not capability wiring merely to reuse small SVG primitives. Each extension supplies its own destinations/occupancy and controls when its hints are visible. |

For premove candidates, an occupied projected square gets a ring **regardless of occupant color**; this differs from current normal `legal-moves` rendering. Avoid displaying both ordinary and premove selection/destination hints for the same claimed gesture.

**Intended new cross-extension capability: Piece Overrides only**, wired explicitly by the application/wrapper rather than hidden direct premove → main-renderer imports. Shared SVG helpers and existing drag/session contracts are not new capabilities.

## Architecture review before implementation

Validate these hypotheses against current code before defining interfaces or refactoring:

1. How to integrate the single override registry with `main-renderer/pieces/suppress.ts`, `pieces/update.ts`, `pieces/render.ts` and animation/drag/deferred-move lifecycles, including multiple handles, update order, invalidation, cleanup and regression tests.
2. How projected piece hit-testing and selection remain premove-owned, and how event ownership switches cleanly back to runtime without simultaneous normal/premove highlights.
3. How extension-owned drag sessions and `active-target` behave for projected-only source squares, pending/active phases, canceled gestures and pointer release.
4. How queue changes, actual board/turn updates, revalidation, promotions and animation overlap affect the projected position and piece overrides.
5. What minimal SVG helpers to share for selected-square and destination hints without introducing unnecessary new layers or breaking existing renderer ownership.

**No implementation or final API choice is approved by this document.** Keep changes focused, preserve existing runtime contracts where possible, and add targeted behavioral tests when implementation begins.
