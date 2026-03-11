We are continuing work on `kt-npm-modules/chessboard`.

## Handoff summary

- Project: `kt-npm-modules/chessboard` — MIT-licensed modern TypeScript chessboard engine with chessground-like interaction and cm-chessboard-like extension ideas.
- Current task completed: Phase 2.2 — runtime-owned host resize / geometry refresh with minimal internal destroy cleanup.
- Confirmed: runtime remains internal POJO/factory style via `createBoardRuntime(...)`, not a class.
- Confirmed: runtime owns mount state, host-derived board size, geometry, scheduler wiring, render permission, and resize observation.
- Confirmed: board size is host-derived via `Math.min(container.clientWidth, container.clientHeight)`.
- Confirmed: geometry is immutable derived data; runtime recreates geometry on orientation change and host resize instead of mutating it.
- Confirmed: initial mount still validates positive size and throws on invalid zero/non-positive container size.
- Confirmed: later resize to zero/non-positive size is ignored, not thrown.
- Confirmed: resize refresh marks `DirtyLayer.Board | DirtyLayer.Pieces` and schedules render through the existing scheduler.
- Confirmed: resize after orientation change uses the latest orientation when recreating geometry.
- Confirmed: runtime now has minimal internal-only `destroy()` because resize observation introduced an external resource.
- Confirmed: `destroy()` is idempotent, disconnects `ResizeObserver`, clears host reference, sets mounted false, prevents further resize-triggered render effects, and rejects remount.
- Confirmed: no scheduler redesign, no renderer redesign, no public API shaping, no extension/input/drag work was introduced in Phase 2.2.
- Confirmed: runtime remains internal-only; do not export it publicly.
- Confirmed: review workflow for coding projects is chat architecture discussion -> prompt for Cline -> Cline plan -> delta prompt -> Act -> git diff review; request changed files if diff looks glitched/incomplete.
- Relevant files: `src/core/runtime/boardRuntime.ts`, `tests/core/runtime/boardRuntime.spec.ts`, `src/core/scheduler/scheduler.ts`, `src/core/scheduler/invalidation.ts`, `src/core/renderer/SvgRenderer.ts`, `src/core/renderer/geometry.ts`, `src/core/state/boardState.ts`, `src/core/state/reducers.ts`, `src/core/state/types.ts`, `current-plan.md`.
- Next step: move to the next narrow Phase 2 runtime/composition step from `current-plan.md`, keeping the same architecture-first constraints and internal-only scope.

## Attached plan

The full implementation plan is attached to this chat as a file, not pasted inline.
Use it as the roadmap reference, but in this chat focus only on the task below.

## Task for this chat

We are continuing work on `kt-npm-modules/chessboard`.

Phase 2.2 is complete and accepted. Use the attached `current-plan.md` as the roadmap source of truth, and pick up the next narrow step immediately after Phase 2.2.

Working mode for this chat:

1. brief audit of the current implementation relevant to the next step
2. identify the smallest correct step to implement now
3. recommend only minimal changes needed
4. prepare a precise implementation prompt for Cline
5. later review the patch in a narrow diff loop

Keep these confirmed decisions in force unless explicitly revised:

- runtime is internal POJO/factory style via `createBoardRuntime(...)`, not a class
- runtime owns mount state, host-derived board size, geometry, scheduler wiring, render permission, and resize observation
- board size is host-derived via `Math.min(container.clientWidth, container.clientHeight)`
- geometry is immutable and recreated on orientation change / resize, never mutated
- initial mount invalid size throws; later zero/non-positive resize is ignored
- resize refresh marks `DirtyLayer.Board | DirtyLayer.Pieces`
- runtime has minimal internal-only `destroy()`; it is idempotent, disconnects `ResizeObserver`, clears host reference, sets mounted false, prevents further resize-triggered render effects, and rejects remount
- runtime remains internal-only; do not export it publicly

Do not:

- redesign renderer or scheduler unless strictly necessary
- start drag/input/controller work early
- broaden into public API design
- redesign extension model
- refactor unrelated code
- introduce speculative abstractions

Cline workflow preference:

- discuss architecture here first
- then generate a precise prompt for Cline
- once the plan is good enough, provide only delta/corrections to the plan in the prompt itself
- do not write prompts that say `Go to Act` / `toggle to Act`
- in chat, separately say that the prompt can be sent in Act and that an updated plan is not needed
- review actual staged diff; if diff looks glitched or inconsistent, request the changed files explicitly

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
