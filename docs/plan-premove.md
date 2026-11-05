# Premove — Architecture Plan (Working Hypotheses)

## Goal

Implement premoves as an **optional extension** while preserving the real board position and ordinary runtime interaction. This is a high-level direction, **not** a finalized implementation design. Interaction behavior is tracked separately in [plan-interaction-model-premove.md](./plan-interaction-model-premove.md); research observations are in [issue #71](https://github.com/mirasen-io/chessboard/issues/71).

## Key constraint: projected position

Multiple queued premoves create a **projected board position** that differs from the runtime's real board.

For example, after queuing a knight move to b3, the user may select the knight on **projected b3** to queue another move. The runtime's actual board still has no knight on b3.

Currently, `createRuntimeInteractionSurface().startLiftedDragSession()` reads the piece from the real board, while runtime `activeDestinations` come from its own `movability`. Therefore **switching the existing runtime movability between ordinary moves and premoves is not sufficient** for projected-piece selection, targeting, and rendering. It would also mix distinct policies. This supersedes the earlier hypothesis that switching runtime movability alone might be enough.

## Likely direction (to validate)

- **Extension-owned projected state:** The premove extension owns the queue, projected piece positions, selection/targeting semantics for premove input, and premove candidate destinations. Do not mutate the real board merely to display a queued move.
- **Separate premove destinations:** Prefer a premove-owned, explicit destination policy rather than overloading runtime `movability`. A **required strict-style resolver/configuration at extension initialization**, with no `free`/`disabled` modes or setter, is a **tentative API hypothesis**, not yet approved.
- **Shared destination-hint drawing:** The current first-party `legal-moves` extension already draws empty-square dots and capture-style rings in its own rendering slot. Explore extracting a **small reusable internal drawing primitive/helper** so both legal-move and premove visuals can use it without duplicating SVG geometry and styling. A separate published library is not assumed or required.
- **Premove-specific visual inputs:** Candidate hints follow piece movement geometry on the **projected** position; choose dot versus ring by whether a square is occupied, **irrespective of piece color**. The current legal-moves implementation checks opposing color and must not be reused unchanged for this rule.
- **Rendering ownership:** Compare extension-slot rendering with explicit capability wiring to existing renderer facilities. Both require checking layering, hit-testing, visual conflicts, and lifecycle. Keep the renderer responsible for SVG/DOM; avoid bypassing established ownership boundaries.
- **Input ownership:** Prefer using existing extension-owned drag/session facilities and the agreed interaction model; avoid creating a generic gesture framework unless implementation evidence requires it. Premove and annotations must not process the same owned cancellation gesture.

## Questions before implementation

1. How should projected pieces and hit-testing coexist with the main renderer's real-position pieces?
2. What is the smallest shared boundary for destination-hint SVG drawing and configuration?
3. Which explicit runtime/extension capabilities, if any, are needed for projected selection, drag previews, and queued-move rendering?
4. How are queued moves revalidated/discarded on actual opponent moves, turn changes, promotions, and interrupted gestures?
5. Which focused tests verify projected re-selection, destinations on friendly-occupied squares, cancellation presets, and absence of regressions in ordinary runtime interaction?

**No architecture is finalized here.** Resolve these questions against the current branch implementation before changing runtime contracts or extracting shared rendering code.
