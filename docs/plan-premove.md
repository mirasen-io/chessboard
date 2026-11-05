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

- **Suppression capability (likely needed):** `main-renderer/pieces/suppress.ts` currently unions animation suppression, active lifted-drag source squares (regardless of session owner), and deferred-move squares. It has no external projected-position suppression input. Consider an explicit renderer-owned capability, wired by the application/wrapper, to acquire/release additional suppressed real-position squares; merge it with existing sources and trigger renderer invalidation on acquisition, updates and release. Also avoid conflicting normal `legal-moves` hints when premove owns interaction. See [issue #71 capability-wiring note](https://github.com/mirasen-io/chessboard/issues/71#issuecomment-4467544740).
- **Lifted-drag rendering (existing generic contract):** `ExtensionDragSession` already supports `type: 'lifted-piece-drag'`, `phase: 'active'`, and `sourcePieceCode`. `commands.startDrag()` stores an extension-owned session without looking up the source piece on the real board. The main renderer's drag update/render path checks the shared session shape, **not the extension owner**, and renders the provided piece code using existing symbol/configuration logic. Prefer this existing contract over a new `ext:lifted-drag` type or direct premove-to-renderer wiring. Confirm projected-source, pending/active threshold and cleanup behavior with targeted tests; stationary projected pieces still need a separate rendering strategy.
- **Destination hints (two approaches, undecided):** `legal-moves/factory.ts` currently reads runtime `interaction.activeDestinations` and actual board occupancy, checking **opposing color** to choose a ring, and exposes no public capability. **A:** Extract a narrow shared internal dot/ring SVG drawing helper; both extensions own their source data and rendering slots, with separate visibility rules. **B:** Give the legal-moves/hint renderer an explicitly wired presentation capability taking projected destinations and occupancy, with a clear override/lease/cleanup policy and explicit invalidation. Either is feasible, but option B needs new cross-extension composition and precedence rules. Premoves use a ring for **any occupied target**, independent of color.
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
