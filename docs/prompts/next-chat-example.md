We are continuing work on `mirasen-io/chessboard`.

## Handoff Summary — Phase 3.10 complete / preparing Phase 4.1

- Project: `mirasen-io/chessboard` / `@mirasen/chessboard`, branch `feat/v1`.
- Phase 3.10 is complete and can be treated as done.
- Implemented architecture:
  - committed animation planning moved to runtime/core,
  - `Animator` owns RAF/timing/session lifecycle,
  - `SvgRenderer` owns scene graph only,
  - renderer split into:
    - `renderBoard(...)`
    - `renderAnimations(...)`
    - `renderDrag(...)`
- Standard animation drawing is delegated to `SvgAnimationFrameRenderer`, which renders one frame into its own reserved subgroup inside a provided session `<g>`.
- Ordinary committed move and castling now go through one shared committed-animation pipeline.
- Castling animates king and rook simultaneously and now behaves like modern board UIs (closer to lichess/chess.com than cm-chessboard).
- Suppression cleanup bug was fixed by making `renderBoard(...)` refresh the pieces pass when `suppressedPieceIds` changes, even without normal pieces invalidation.
- Tests are green:
  - 24 test files passed
  - 325 tests passed
  - coverage:
    - statements 92.83%
    - branches 83.94%
    - functions 97.98%
    - lines 95.49%
- Manual verification passed:
  - drag works,
  - click-move animation works and restores final static piece correctly,
  - castling manual route works for white and black.
- Current notable non-blocking test gaps:
  - no focused `animator.spec.ts`,
  - no automated runtime-level castling animation integration test.
- These gaps are not considered blockers for entering Phase 4.
- Phase 4 plan does not need a full rewrite before starting 4.1.
- Next step: start Phase 4.1 and define the concrete extension slot model and first implementation boundaries.

## Attached plan

The full implementation plan is attached to this chat as a file, not pasted inline.
Use it as the roadmap reference, but in this chat focus only on the task below.

## Task for this chat — Phase 4.1 extension slot model

Focus on **Phase 4.1: extension slot model / DOM ownership contract**.

Before proposing a plan:

1. Read the current relevant runtime/renderer/extension-facing files first.
2. Read the current plan section for Phase 4.
3. List which files you actually inspected.
4. Only then propose the plan.

Main goal:

Define the **smallest clean slot model** for board extensions so that:

- core owns top-level SVG roots / slot roots,
- extensions do **not** own arbitrary top-level DOM,
- each extension gets an assigned subtree/root inside a core-owned slot,
- the contract is reusable for later first-party and third-party extensions.

Requirements:

- work architecture-first
- keep the step narrow
- avoid overengineering
- do not implement `lastMove` yet unless the plan requires a tiny supporting shape
- do not redesign unrelated renderer/runtime pieces
- use current 3.10 renderer boundaries as the source of truth

Need the plan to answer clearly:

1. What slots exist initially, and why?
2. What exactly does core own?
3. What exactly does an extension own?
4. What extension root/subtree handle is given to an extension?
5. How are slot roots created, named, and cleaned up?
6. How does an extension render/update without taking ownership of arbitrary top-level DOM?
7. What is the smallest extension lifecycle/update contract needed now?
8. What should remain deferred until after 4.1?

Output expectations:

- concise, implementation-oriented plan
- no full code blocks in PLAN
- reference files/functions/types only
- explicitly separate:
  1. architecture decision
  2. minimal refactor steps
  3. file-level changes
  4. focused test updates
  5. non-goals / deferred items

Important context already decided:

- 3.10 is done
- renderer split is already real:
  - `renderBoard(...)`
  - `renderAnimations(...)`
  - `renderDrag(...)`
- core animation lifecycle belongs to `Animator`
- `SvgRenderer` owns scene graph / roots
- extension animation API is **not** being built now
- future extensions may later reuse existing core rendering helpers, but 4.1 should not solve all future extension problems yet

Prefer:

1. brief analysis
2. concrete recommendation
3. precise implementation prompt for Cline
4. focused test updates
5. later patch review

## Working mode

Work architecture-first.
Keep the step narrow.
Avoid overengineering.
Assume previously confirmed decisions remain in force unless explicitly revised.

Prefer:

1. brief analysis
2. concrete recommendation
3. precise implementation prompt for Cline
4. focused test updates
5. later patch review

If you notice related future issues, mention them briefly only if they affect this step.
Do not redesign unrelated parts.
Do not introduce speculative APIs unless clearly justified.

## Codebase

The working branch of the project is here:

https://github.com/mirasen-io/chessboard/tree/feat/v1

When discussing the current implementation, use this branch as the source of truth.

Sometimes you retrieve old version of files (probably due to cache), so attached also is the zip of src folder if you need to review some files.

If you need to inspect specific files, ask for them explicitly rather than assuming their contents.
Do not invent file contents.
