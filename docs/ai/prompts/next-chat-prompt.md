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
- Implemented architecture:
  - committed animation planning moved to runtime/core
  - `Animator` owns RAF/timing/session lifecycle
  - `SvgRenderer` owns scene graph only
  - renderer split into:
    - `renderBoard(...)`
    - `renderAnimations(...)`
    - `renderDrag(...)`
- Standard animation drawing is delegated to `SvgAnimationFrameRenderer`, which renders one frame into its own reserved subgroup inside a provided session `<g>`.
- Ordinary committed move and castling now go through one shared committed-animation pipeline.
- Castling animates king and rook simultaneously and now behaves like modern board UIs.
- A suppression cleanup bug was fixed by making `renderBoard(...)` refresh the pieces pass when `suppressedPieceIds` changes, even without normal pieces invalidation.
- Tests are green:
  - 24 test files passed
  - 325 tests passed
  - coverage:
    - statements 92.83%
    - branches 83.94%
    - functions 97.98%
    - lines 95.49%
- Manual verification passed:
  - drag works
  - click-move animation works and restores final static piece correctly
  - castling manual route works for white and black
- Current non-blocking test gaps:
  - no focused `animator.spec.ts`
  - no automated runtime-level castling animation integration test
- These gaps are not blockers for entering Phase 4.
- Phase 4 plan does not need a full rewrite before starting 4.1.
- Next step: start Phase 4.1 and define the concrete extension slot model and first implementation boundaries.

## Task for this chat

Focus only on: **Phase 4.1 — extension slot model / DOM ownership contract**

### Task frame

What:

- Define the smallest clean extension slot model for Phase 4.1.
- Define DOM/SVG ownership boundaries between core and extensions.
- Prepare a narrow implementation plan for this step only.

Not:

- Do not implement `lastMove` yet, unless the plan requires a tiny supporting shape.
- Do not redesign unrelated renderer/runtime pieces.
- Do not build extension animation API now.
- Do not solve all future extension problems in 4.1.

Constraints:

- Work architecture-first.
- Keep the step narrow.
- Use current 3.10 renderer boundaries as the source of truth.
- Core must own top-level SVG roots / slot roots.
- Extensions must not own arbitrary top-level DOM.
- The contract should be reusable for later first-party and third-party extensions.
- Read current relevant runtime/renderer/extension-facing files first.
- Read the current Phase 4 section in `chessboard-current-plan.md` before proposing a plan.
- List which files you actually inspected before proposing the plan.

Done when:

- there is a concise implementation-oriented plan for 4.1
- the slot model and ownership contract are explicit
- deferred items are clearly separated from the minimal scope for this step

### Questions the plan must answer

1. What slots exist initially, and why?
2. What exactly does core own?
3. What exactly does an extension own?
4. What extension root/subtree handle is given to an extension?
5. How are slot roots created, named, and cleaned up?
6. How does an extension render/update without taking ownership of arbitrary top-level DOM?
7. What is the smallest extension lifecycle/update contract needed now?
8. What should remain deferred until after 4.1?

### Output expectations

Provide:

1. brief analysis
2. concrete recommendation
3. precise implementation prompt for agent
4. focused test updates
5. later patch review

In the plan itself:

- keep it concise and implementation-oriented
- do not include full code blocks
- reference files/functions/types only
- explicitly separate:
  1. architecture decision
  2. minimal refactor steps
  3. file-level changes
  4. focused test updates
  5. non-goals / deferred items

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

- current `src` zip
- current `tests` zip
- other task-specific files if needed

If repository access may be stale, incomplete, or cached, prefer attached source artifacts for file-level review.

If this prompt refers to attached files that are not actually present in the chat, do not assume their contents.
Instead, briefly say that the files may have been forgotten and ask for them only if they are materially needed.

If you need specific files that are not attached, ask for them explicitly rather than inventing contents.
