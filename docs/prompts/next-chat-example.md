We are continuing work on `kt-npm-modules/chessboard`.

## Handoff summary

- **Project:** `kt-npm-modules/chessboard` on branch `feat/v1`.
- **Current task completed:** **Phase 3.3** was reviewed against the current implementation, a narrow Cline prompt was prepared, the resulting patch was reviewed, and the step is accepted/closed.
- **Phase 3.3 result:** core now owns active-drag rendering responsibilities.
- **Confirmed renderer ownership:** `SvgRenderer` uses `dragRoot` for the active dragged-piece preview and suppresses the source piece from `piecesRoot` during an active drag.
- **Confirmed renderer contract:** `RenderingContext` was extended minimally with curated drag data `drag: { sourceSquare } | null`; no pointer coordinates were introduced.
- **Confirmed runtime wiring:** runtime now derives drag render info from `interactionState.dragSession` and passes it to the renderer.
- **Confirmed invalidation model:** drag-related interaction transitions now mark/schedule `DirtyLayer.Drag` (and `DirtyLayer.Pieces` where needed) without disturbing unrelated dirty-square data.
- **Confirmed legal-drop handling:** legal move completion preserves existing move invalidation and additionally ORs in `DirtyLayer.Drag` so drag visuals clear cleanly.
- **Confirmed non-goal preserved:** `setCurrentTarget()` still does not drive drag rendering; current drag preview remains source-anchored.
- **Confirmed boundary:** Phase 3.3 did not introduce pointer-position plumbing, hit testing changes, or Phase 3.4 behavior.
- **Tests status:** focused Phase 3.3 tests were added/updated; all tests passed.
- **Minor note:** the reviewed diff contained one unrelated docs change in `docs/prompts/next-chat-example.md`, but it was non-blocking for acceptance of Phase 3.3.
- **Relevant files:** `src/core/renderer/types.ts`, `src/core/renderer/SvgRenderer.ts`, `src/core/runtime/boardRuntime.ts`, relevant renderer/runtime tests, `current-plan.md`.
- **Review verdict:** **Phase 3.3 accepted and closed.**
- **Next step:** start **Phase 3.4** only, using the same narrow architecture-first review process against `current-plan.md`.

## Attached plan

The full implementation plan is attached to this chat as a file, not pasted inline.
Use it as the roadmap reference, but in this chat focus only on the task below.

## Task for this chat

Focus only on the **next exact step after Phase 3.3** from `current-plan.md` (**Phase 3.4**).

Goals:

- Review the current implementation only for the exact scope of Phase 3.4.
- Check whether the current code already satisfies any part of that step or whether there are narrow gaps.
- Produce a brief verdict and, only if needed, a precise implementation prompt for Cline.

Do not:

- Reopen settled Phase 3.1 / 3.2 / 3.3 decisions.
- Redesign controller/runtime/renderer boundaries unless Phase 3.4 directly requires it.
- Expand into later Phase 3+ steps.

Working mode:

1. brief analysis
2. concrete recommendation
3. precise implementation prompt for Cline + GPT-5 only if gaps are found
4. focused review of resulting diff later

Keep the step narrow, architecture-first, and grounded in the actual current files on branch `feat/v1`.
Ask for specific files if needed; do not invent file contents.

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
