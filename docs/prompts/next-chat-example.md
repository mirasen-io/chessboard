We are continuing work on `kt-npm-modules/chessboard`.

## Handoff summary

- **Project:** `kt-npm-modules/chessboard` on branch `feat/v1`.
- **Current task:** Pre-Phase 2 and Phase 2.3 are complete; phase 2.4 is the next step.
- **Confirmed decisions:** board/view split is final.
- **Board state:** `BoardStateInternal` owns only `pieces`, `ids`, `turn`, `nextId`; `BoardStateSnapshot` exposes only `pieces`, `ids`, `turn`.
- **View state:** `ViewStateInternal` owns `orientation`, `selected`, `movability`; `ViewStateSnapshot` mirrors view-owned state only.
- **Invalidation:** separate from both board and view state; invalidation reducers are internal plumbing, not public runtime API.
- **Scheduler contract:** scheduler works with `BoardStateSnapshot` and `InvalidationStateSnapshot`.
- **Renderer contract:** core renderer no longer depends on full view state; orientation for core rendering is derived through geometry, not board snapshot.
- **Reducer/runtime contract:** if a reducer takes `InvalidationWriter`, runtime schedules after successful change; if a reducer does not take `InvalidationWriter`, runtime does not schedule.
- **Runtime shape:** runtime owns `boardState`, `viewState`, and `invalidationState`; runtime orchestrates scheduler calls and future extension hooks.
- **API decisions:** `move()` returns `Move`; simple setters return `boolean`.
- **2.3 result:** movability is stored internally, consulted by runtime/input, and remains renderer-independent.
- **Bugfix completed:** black-orientation coordinate label placement was fixed with focused renderer test coverage.
- **Tests:** targeted test rewrite for the split is complete; mirrored `tests/...` structure now follows `src/...` per-file naming.
- **Comments:** narrow comment/docstring pass is complete; stale combined-state comments were corrected without bloating docs.
- **Constraints:** keep steps narrow, no redesign of settled architecture, do not invent speculative APIs, and mirror test structure to source structure.
- **Relevant files:** `src/core/state/{boardState,viewState,boardReducers,viewReducers,boardTypes,viewTypes}.ts`, `src/core/runtime/boardRuntime.ts`, `src/core/scheduler/{scheduler,invalidationState,reducers,types}.ts`, `src/core/renderer/{types,SvgRenderer}.ts`, matching `tests/core/...` files, plus attached `current-plan.md`.
- **Next step:** Phase 2.4 — review and tighten runtime tests around wiring and invalidation flow: state change → invalidation → render scheduling, plus no-op and narrow-update behavior.

## Attached plan

The full implementation plan is attached to this chat as a file, not pasted inline.
Use it as the roadmap reference, but in this chat focus only on the task below.

## Task for this chat

Focus only on: **Phase 2.4 runtime tests**

Goals:

- Review whether current runtime tests adequately cover wiring between board/view state, invalidation, scheduler, and renderer.
- Identify any missing focused tests for state change → invalidation → render scheduling and for no-op / narrow updates.
- Produce a narrow implementation prompt for Cline if test gaps are found.

Do not:

- Redesign runtime architecture or reopen the board/view split.
- Expand into phase 2.5 piece rendering review or phase 3 drag/interaction work.

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
