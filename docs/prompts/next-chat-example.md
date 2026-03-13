We are continuing work on `kt-npm-modules/chessboard`.

## Handoff summary

- **Project:** `kt-npm-modules/chessboard` on branch `feat/v1`.
- **Current task completed:** **Phase 3.2** is implemented, reviewed, accepted, and can be considered closed.
- **Phase 3.2 result:** pointer interaction lifecycle is now modeled through controller methods `onPointerDown`, `onPointerMove`, `onPointerUp`, `onPointerCancel`.
- **Confirmed lifecycle model:** no drag threshold; immediate lifted-piece entry may start on pointer-down when the square is drag-capable.
- **Confirmed selection model:** `select(square)` remains square-based and may select any square; selection is not restricted to movable squares.
- **Confirmed lifted-piece gating:** controller uses `canStartMoveFrom(square)` to decide whether pointer-down enters lifted-piece mode; `dragStart(square)` is not unconditional.
- **Confirmed runtime ownership:** runtime remains the owner of semantic state synchronization and interaction transitions (`select`, `dragStart`, `setCurrentTarget`, `dropTo`, `cancelInteraction`).
- **Confirmed controller ownership:** controller translates pointer lifecycle in board terms and reads runtime state via `getInteractionSnapshot()`.
- **Confirmed snapshot boundary:** controller gets a curated internal read-only snapshot grouped as `{ board, view, interaction }`; in Phase 3.2 only the needed subset is exposed.
- **Confirmed deselect rule:** deselect for the already-selected square is resolved on `pointerUp`, not eagerly on `pointerDown`.
- **Confirmed illegal completion outcomes:** lifted-piece illegal completion keeps selection; release-targeting illegal completion clears all interaction.
- **Confirmed `dropTo()` semantics:** runtime `dropTo(target)` is the semantic completion method and now distinguishes illegal outcomes by mode.
- **Confirmed move timing:** completion is release-based (`pointerUp`) for the non-lifted selected-piece path to reduce misclick risk.
- **Constraints preserved:** no public API expansion; no renderer redesign in 3.2; no pointer x/y in core interaction state; no transient visual state implementation in this phase.
- **Relevant files:** `src/core/runtime/boardRuntime.ts`, `src/core/runtime/movability.ts`, `src/core/input/interactionController.ts`, `tests/core/input/interactionController.spec.ts`, `tests/core/runtime/boardRuntime.phase32.spec.ts`, `current-plan.md`.
- **Minor non-blocking note:** there is a small stale/local doc-comment wording issue in `interactionController.ts`, but it does not block acceptance of Phase 3.2.
- **Review verdict:** Phase 3.2 accepted and closed.
- **Next step:** start **Phase 3.3** only, using the same narrow architecture-first review process against `current-plan.md`.

## Attached plan

The full implementation plan is attached to this chat as a file, not pasted inline.
Use it as the roadmap reference, but in this chat focus only on the task below.

## Task for this chat

Focus only on the **next exact step after Phase 3.2** from `current-plan.md` (Phase 3.3).

Goals:

- Review the current implementation only for the exact scope of Phase 3.3.
- Check whether the current code already satisfies any part of that step or whether there are narrow gaps.
- Produce a brief verdict and, only if needed, a precise implementation prompt for Cline.

Do not:

- Reopen settled Phase 3.1 / 3.2 decisions.
- Redesign controller/runtime boundaries unless Phase 3.3 directly requires it.
- Expand into later Phase 3+ steps.

Working mode:

1. brief analysis
2. concrete recommendation
3. precise implementation prompt for Cline + GPT-5 only if gaps are found
4. focused review of resulting diff later

Keep the step narrow, architecture-first, and grounded in the actual current files on branch `feat/v1`.

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

Sometimes you retrieve old version of files (probably due to cache), so attached also is the zip of src folder if you need to review some files.

If you need to inspect specific files, ask for them explicitly rather than assuming their contents.
Do not invent file contents.
