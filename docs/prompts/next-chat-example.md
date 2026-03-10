We are continuing work on `kt-npm-modules/chessboard`.

## Handoff summary

Project: `kt-npm-modules/chessboard`, an MIT-licensed modern TypeScript chessboard engine aiming to combine chessground-like interaction with cm-chessboard-like extensions.
Current task: architecture-first implementation planning before Phase 2, using iterative loop: discuss → precise Cline + GPT-5 prompt (with focused tests) → patch review → next iteration.
Confirmed process: keep steps narrow, avoid overengineering, prefer git diff/patch review; full files only when needed.
Roadmap status: Pre-Phase 2 cleanup added before continuing with Phase 2–6.
Pre-Phase 2 focus: normalize `SvgRenderer` roots/slots and separate core state from render/view config.
Confirmed renderer decision: top-level renderer fields should use ownership-based `...Root` naming, while `DirtyLayer` remains the invalidation vocabulary.
Confirmed renderer naming direction: `root` should become `svgRoot`; `layerSquares` should become `boardRoot`.
Confirmed renderer structure: keep core-owned roots for board, coords, pieces, drag; reserve extension slot roots for under/over pieces and drag under/over.
Confirmed removal direction: `layerHighlights` does not belong as a core-owned renderer layer and should be removed from core structure.
Confirmed state boundary: `InternalState` and `StateSnapshot` remain separate types; snapshot must not become a readonly clone of full internal state.
Confirmed config boundary: `theme` is visual/render config, not core board state, and should be moved out of `InternalState`.
Confirmed extension decision: `lastMove` should be removed from core state/snapshot and later implemented as the first passive extension to validate extension-owned state and lifecycle.
Confirmed interaction boundary: selection/drag/destinations belong to core interaction/runtime state because they drive behavior; their visual feedback belongs to extension-driven overlays later.
Confirmed legality/destinations model: legal destinations are provided from outside, then stored/used by core runtime for selection/drag/tap behavior.
Quality target: aim for ~8/10 polish through architecture phases (Pre-Phase 2 to Phase 4), then ~9/10 during public API shaping and hardening.
Relevant files discussed: `src/core/renderer/SvgRenderer.ts`, renderer/root-related types, state types defining `InternalState`, `StateSnapshot`, and `Theme`/render config boundaries.
Constraint: every implementation prompt must include focused test updates and must not mix multiple architectural changes in one step.
Next step: start with Pre-Phase 2 / 0.1 — `SvgRenderer` root/slot normalization only, before touching extension contracts or broader runtime composition.

## Attached plan

The full implementation plan is attached to this chat as a file, not pasted inline.
Use it as the roadmap reference, but in this chat focus only on the task below.

## Task for this chat

Focus only on: Pre-Phase 2 / 0.1 — SvgRenderer root / slot normalization.

Goals:

- review the current renderer root/layer structure
- confirm final ownership-based root/slot naming
- confirm which legacy renderer fields should be renamed or removed
- confirm reserved extension slot roots in the renderer structure
- include focused tests only for this step
- prepare a precise implementation prompt for Cline + GPT-5

Do not:

- design extension APIs yet
- refactor runtime composition yet
- refactor state/snapshot/render config yet unless directly required by this renderer step

## Working mode

Work architecture-first.
Keep the step narrow.
Avoid overengineering.
Assume previously confirmed decisions remain in force unless explicitly revised.

Prefer:

1. brief analysis
2. concrete recommendation
3. precise implementation prompt for Cline + GPT-5
4. focused test updates
5. later patch review

If you notice related future issues, mention them briefly only if they affect this step.
Do not redesign unrelated parts.
Do not introduce speculative APIs unless clearly justified.

## Codebase

The working branch of the project is here:

https://github.com/kt-npm-modules/chessboard/tree/feat/v1

When discussing the current implementation, use this branch as the source of truth.

If you need to inspect specific files, ask for them explicitly rather than assuming their contents.
Do not invent file contents.
