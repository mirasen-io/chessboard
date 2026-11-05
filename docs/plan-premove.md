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
- **Rendering ownership:** Investigate narrowly scoped suppression and rendering capabilities to maximize reuse of existing renderers (see below). Compare capability wiring with internal shared rendering helpers; check layering, hit-testing, visual conflicts, and lifecycle. Keep the renderer responsible for SVG/DOM; avoid bypassing established ownership boundaries.
- **Input ownership:** Prefer using existing extension-owned drag/session facilities and the agreed interaction model; avoid creating a generic gesture framework unless implementation evidence requires it. Premove and annotations must not process the same owned cancellation gesture.

## Renderer reuse and capability wiring (investigate)

**Prefer reusing existing rendering behavior** over building a separate piece/drag/highlight renderer inside premove. Exact capability contracts remain open.

- **Suppression capability:** Consider an explicit, narrowly scoped way for premove to suppress the main renderer's **real-position pieces on selected squares** while projected pieces are displayed, and to suppress or avoid conflicting normal `legal-moves` hints when premove owns the interaction. Existing piece suppression in `main-renderer/pieces/suppress.ts` already handles active lifted drag sources, animation, and deferred moves; evaluate whether extension-supplied suppression should compose with those sources and how it is invalidated/cleared.
- **Reuse lifted-drag rendering:** Inspect whether the existing main renderer can draw a **premove-owned lifted-piece drag** without a new renderer. Current `ExtensionDragSessionActiveLiftedPiece` includes `sourcePieceCode`, and `main-renderer/drag/update.ts` already reads active lifted drag sessions regardless of ownership. Determine whether projected source squares and pieces are supported safely, or whether a small drag-rendering capability/contract adjustment is needed. Avoid duplicating the piece symbol lookup, positioning, and transient SVG drawing.
- **Destination hints:** Reuse the existing `legal-moves` dot/ring drawing logic if possible, either by extracting a small **shared internal drawing helper** for both extensions or by an explicit capability allowing premove to supply its own projected destinations/occupancy. Normal hints and premove hints have different data sources and capture-ring rules; avoid competing renderers or accidental overwrites.
- **Projected piece display:** Explore how premove's projected pieces could reuse existing piece drawing and symbol assets, potentially through a limited capability, without making runtime's real board pretend the queued moves have executed.
- **Coordination:** Any exposed suppression/drag/hint capability needs explicit ownership, precedence, updates, and cleanup. Check coexistence with animations, annotations, ordinary legal-move hints, and extension render slots before selecting an approach.

These are **candidate reuse points**, not a commitment to add every capability. In particular, a shared internal helper and capability wiring are alternatives to evaluate, not mechanisms that must both be introduced.

## Questions before implementation

1. How should projected pieces and hit-testing coexist with the main renderer's real-position pieces?
2. What is the smallest shared boundary for destination-hint SVG drawing and configuration?
3. Which explicit runtime/extension capabilities, if any, are needed for projected selection, drag previews, and queued-move rendering?
4. How are queued moves revalidated/discarded on actual opponent moves, turn changes, promotions, and interrupted gestures?
5. Which focused tests verify projected re-selection, destinations on friendly-occupied squares, cancellation presets, and absence of regressions in ordinary runtime interaction?

**No architecture is finalized here.** Resolve these questions against the current branch implementation before changing runtime contracts or extracting shared rendering code.
