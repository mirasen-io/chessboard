We are continuing work on `kt-npm-modules/chessboard`.

## Handoff summary

- **Project:** `kt-npm-modules/chessboard` on branch `feat/v1`.
- **Current task completed:** Phase 2.5 is complete.
- **Phase 2.5 result:** renderer no longer uses runtime sprite-sheet cropping for pieces.
- **Confirmed renderer decision:** piece rendering now uses per-piece cburnett SVG assets instead of `pieces.svg` sprite slicing.
- **Asset set in use:** `assets/pieces/cburnett/{wk,wq,wr,wb,wn,wp,bk,bq,br,bb,bn,bp}.svg`.
- **Legacy asset status:** `assets/pieces/cburnett/pieces.svg` remains only as legacy/source reference, not runtime piece rendering input.
- **Renderer structure decision:** one local `<image>` per piece, keyed by stable piece id; no per-piece `clipPath`, no sprite tile offset logic, no full-sheet `<image>`.
- **DOM locality issue:** resolved; piece nodes now inspect as local square-sized image elements.
- **Manual verification:** orientation `black` renders correctly; coordinates/labels also look correct.
- **Tests updated:** renderer structure tests were narrowed to the new per-piece asset model and reuse behavior.
- **Confirmed architecture decisions remain unchanged:** board/view split stays final; do not reopen settled runtime architecture.
- **Constraints:** keep steps narrow; no redesign of runtime/state/input; no speculative drag APIs; mirror test structure to source structure.
- **Relevant files:** `src/core/renderer/SvgRenderer.ts`, `src/core/renderer/assets.ts`, `tests/core/renderer/svgRenderer.structure.spec.ts`, `assets/pieces/cburnett/*`, and `current-plan.md`.
- **Review verdict:** Phase 2.5 accepted and closed.
- **Next step:** start **Phase 3.1** only, using `current-plan.md` as the roadmap reference and keeping work limited to that step’s exact scope.

## Attached plan

The full implementation plan is attached to this chat as a file, not pasted inline.
Use it as the roadmap reference, but in this chat focus only on the task below.

## Task for this chat

Focus only on **Phase 3.1** from `current-plan.md`.

Goals:

- Review the current implementation only for the exact scope of Phase 3.1.
- Check whether the current code already satisfies the step or whether there are narrow gaps.
- Produce a brief verdict and, only if needed, a precise implementation prompt for Cline.

Do not:

- Reopen the board/view split or redesign settled runtime architecture.
- Rework Phase 2.5 renderer changes unless a Phase 3.1 issue directly depends on them.
- Expand into later Phase 3 steps.

Working mode:

1. brief analysis
2. concrete recommendation
3. precise implementation prompt for Cline + GPT-5 only if gaps are found
4. focused review of resulting diff later

Use the current branch `feat/v1` and ask for specific files if needed.
Do not invent file contents.
Keep the step narrow and architecture-first.

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
