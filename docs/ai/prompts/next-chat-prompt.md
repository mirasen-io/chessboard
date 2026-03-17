We are continuing work on `mirasen-io/chessboard`.

Follow:

- `ai-workflow-instructions.md`
- `ai-artifacts-instructions.md`

Use as project-specific references:

- `chessboard-current-plan.md`
- `chessboard-AGENTS.md` (if relevant to this task)

## Handoff summary

- Project: `mirasen-io/chessboard` / `@mirasen/chessboard`, branch `feat/v1`.
- Phase 3.10 is complete and can be treated as done.
- Committed animation planning lives in runtime/core, `Animator` owns RAF/session lifecycle, and `SvgRenderer` owns scene graph rendering only.
- Committed move and castling use one shared committed-animation pipeline; castling animates king and rook together.
- The suppressed-piece cleanup bug was fixed.
- Phase 4.1 is complete for the intentionally narrowed scope.
- Completed in 4.1:
  - added internal extension contract in `src/core/extensions/types.ts`
  - confirmed existing core-owned SVG extension slot roots in `SvgRenderer` as the source of truth
  - added renderer-side slot allocation/removal for per-extension child `<g>` roots inside those existing slot roots
  - added focused renderer tests for allocation, coexistence, cleanup, and duplicate-slot rejection
- Confirmed constraints:
  - core owns top-level SVG roots and slot roots
  - extensions must only own their assigned child subtrees
  - runtime extension registry/lifecycle plumbing was deliberately deferred
  - no extension invalidation system yet
  - no extension animation API yet
- Relevant files:
  - `src/core/extensions/types.ts`
  - `src/core/renderer/SvgRenderer.ts`
  - `tests/core/renderer/svgRenderer.structure.spec.ts`
  - `tests/core/renderer/svgRenderer.slots.spec.ts`
  - `chessboard-current-plan.md`
  - `chessboard-AGENTS.md`

## Task for this chat

Focus on **Phase 4.2a: first lifecycle-validation extension — `Selected Square (with figure)`**.

Before proposing a plan:

1. Read the current relevant runtime / renderer / interaction / extension files first.
2. Read the current Phase 4.2a section in `chessboard-current-plan.md`.
3. List which files you actually inspected.
4. Only then propose the plan.

Main goal:

Implement the smallest first-party extension that highlights the currently selected square **only when that square currently contains a piece**.

Requirements:

- work architecture-first
- keep the step narrow
- use the existing 4.1 extension slot contract as the source of truth
- do not broaden into general interaction overlay work yet
- do not implement `lastMove`
- do not add extension invalidation/render split yet unless strictly required
- do not redesign unrelated runtime/renderer pieces

Need the plan to answer clearly:

1. What is the minimal runtime integration path needed to mount/update/unmount one first-party extension?
2. What slot should `Selected Square (with figure)` render into, and why?
3. What existing interaction/board/view state should drive the extension?
4. How should the extension decide whether to show or clear the highlight?
5. What should remain deferred until after 4.2a?

Output expectations:

- concise, implementation-oriented plan
- no full code blocks in PLAN
- reference files/functions/types only
- explicitly separate:
  1. architecture decision
  2. minimal runtime integration steps
  3. file-level changes
  4. focused test updates
  5. non-goals / deferred items

Important context already decided:

- 4.1 is done and should not be reopened
- existing extension slot roots in `SvgRenderer` are the source of truth
- runtime integration was intentionally deferred in 4.1 and should now be added only as much as 4.2a needs
- `Selected Square (with figure)` is the first end-to-end lifecycle-validation extension
- broader interaction overlay work remains later

## Working mode

Work architecture-first when architectural risk is present.
Keep the step narrow.
Avoid overengineering.
Assume previously confirmed decisions remain in force unless explicitly revised.

If you notice related future issues, mention them briefly only if they materially affect this step.
Do not redesign unrelated parts.
Do not introduce speculative APIs unless clearly justified.

## Project plan reference

Use `chessboard-current-plan.md` as the roadmap reference for:

- current phase
- sequencing
- task scope context

If the current plan appears out of sync with the handoff or recently completed work, call that out briefly before relying on it.

## Codebase / source materials

Primary repository / branch:

- `mirasen-io/chessboard`
- `feat/v1`
- when repository access is needed, prefer the GitHub connector over Web/Web UI access

Optional attached materials:

- current `src` + `tests` zip
- other task-specific files if needed

If repository access may be stale, incomplete, or cached, prefer attached source artifacts for file-level review.

If this prompt refers to attached files that are not actually present in the chat, do not assume their contents.
Instead, briefly say that the files may have been forgotten and ask for them only if they are materially needed.

If you need specific files that are not attached, ask for them explicitly rather than inventing contents.
