We are continuing work on `kt-npm-modules/chessboard`.

## Handoff summary

- Project: `kt-npm-modules/chessboard` — modern TypeScript chessboard engine with internal runtime, renderer, and future extension model.
- Recently completed: Phase 2.3a and 2.3b are accepted and complete.
- Confirmed: runtime stays internal POJO/factory style via `createBoardRuntime(...)`, not a class.
- Confirmed: board remains rule-agnostic; legality source stays external.
- Confirmed: movability is the external interaction-policy input; `turn` and movability remain independent.
- Confirmed: 2.3b added internal runtime movability eligibility queries and tests.
- Completed follow-up: coordinate labels gained `data-square` attributes for inspectability/tests.
- Important finding: the apparent black-orientation coords bug was not a renderer bug; it was a manual/demo wiring mismatch between `state.orientation` and geometry orientation.
- Confirmed cleanup already done: render path now uses `geometry.orientation` as the authoritative orientation source.
- Confirmed cleanup already done: `RenderGeometry` now includes `orientation`.
- Confirmed cleanup already done: renderer-facing state type was narrowed (`RenderStateSnapshot`) so renderer no longer depends on `StateSnapshot.orientation`.
- Confirmed cleanup already done: `InternalState` was moved into `src/core/state/types.ts`; `InternalState` and `StateSnapshot` remain separate types but now live side by side.
- Confirmed type cleanup: keep `Orientation` alias; keep `turn` as `Color` (do not keep `SideToMove` alias).
- Key architectural conclusion: the correct boundary is “facts about the position” vs presentation/interaction state.
- Position facts: `pieces`, `ids`, `turn`.
- Likely non-position state: `orientation`, `selected`, and future drag/presentation state; these should move toward a view-state layer.
- Constraint: do not introduce a full controller yet; establish the logical board-state / view-state split first.
- Relevant files: `src/core/state/types.ts`, `src/core/state/boardState.ts`, `src/core/state/reducers.ts`, `src/core/runtime/boardRuntime.ts`, `src/core/runtime/movability.ts`, `src/core/renderer/types.ts`, `src/core/renderer/geometry.ts`, `src/core/renderer/SvgRenderer.ts`, `tests/core/runtime/boardRuntime.spec.ts`, `tests/core/renderer/svgRenderer.coords.spec.ts`, `current-plan.md`.
- Next step: work on the new unnumbered plan section `Board state / view state split`, then continue to `2.4 Runtime tests`.

## Attached plan

The full implementation plan is attached to this chat as a file, not pasted inline.
Use it as the roadmap reference, but in this chat focus only on the task below.

## Task for this chat

We are continuing `kt-npm-modules/chessboard`.

Use the attached updated `current-plan.md` as the source of truth. In this chat, work only on the new step inserted before `2.4 Runtime tests`:

### Board state / view state split

Working mode for this chat:

1. brief audit of current ownership/state boundaries
2. identify the smallest correct refactor step now
3. recommend only minimal changes needed
4. prepare a precise implementation prompt for Cline
5. later review the patch in a narrow diff loop

Confirmed decisions to keep in force unless explicitly revised:

- board state should contain facts about the position
- current stable position facts are:
  - `pieces`
  - `ids`
  - `turn`
- presentation / interaction state should move toward view state:
  - `orientation`
  - `selected`
  - future drag / presentation state
- do not introduce a full controller yet
- establish the logical split first
- renderer should continue to consume board snapshot + geometry/view-derived inputs
- avoid duplicated orientation sources in the render path
- runtime remains internal POJO/factory style via `createBoardRuntime(...)`
- board remains rule-agnostic; legality stays external
- do not broaden public API
- do not redesign renderer, scheduler, or extension model unless strictly necessary
- do not refactor unrelated code

Goal for this chat:

- define and implement the smallest correct board-state / view-state split
- keep board state focused on facts about the position
- move clearly non-position state out of board snapshot/state contracts where appropriate
- avoid overreaching into full controller architecture

Likely scope boundary for this step:

- audit current use of `orientation` and `selected`
- decide what moves now vs what stays temporarily
- prefer the smallest ownership refactor that clarifies the boundary
- do not try to solve full drag/controller architecture yet
- do not broaden into public API shaping

Cline workflow preference:

- discuss architecture here first
- then generate a precise prompt for Cline
- once the plan is good enough, provide only delta/corrections to the plan in the prompt itself
- do not write prompts that say `Go to Act` / `toggle to Act`
- in chat, separately say that the prompt can be sent in Act and that an updated plan is not needed
- review the actual staged diff; if diff looks glitched or inconsistent, request the changed files explicitly

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
