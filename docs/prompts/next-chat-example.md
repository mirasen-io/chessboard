We are continuing work on `kt-npm-modules/chessboard`.

## Handoff summary

Project: `kt-npm-modules/chessboard` — MIT-licensed modern TypeScript chessboard engine with chessground-like interaction and cm-chessboard-like extension ideas.
Current task: Pre-Phase 2 cleanup is complete through `0.2`; next work should start with `0.3 Post-cleanup validation`.
Confirmed decisions: `SvgRenderer` uses ownership-based root naming and stable SVG DOM order; core-owned roots are `boardRoot`, `coordsRoot`, `piecesRoot`, `dragRoot`.
Confirmed decisions: reserved extension slots are `extensionsUnderPiecesRoot`, `extensionsOverPiecesRoot`, `extensionsDragUnderRoot`, `extensionsDragOverRoot`.
Confirmed decisions: legacy core highlight rendering was removed from `SvgRenderer`; `render()` before `mount()` now intentionally throws.
Confirmed decisions: `InternalState` and `StateSnapshot` remain separate types; snapshot is not a readonly clone of full internal state.
Confirmed decisions: `theme` was removed from core state/snapshot, renamed to renderer-owned `RenderConfig`, and moved from `src/core/state/types.ts` to `src/core/renderer/types.ts`.
Confirmed decisions: `RenderConfig` is renderer-owned, passed through renderer construction/options, not through every `render()` call, and no public runtime config mutation API was added yet.
Confirmed decisions: legacy overlay/highlight color fields were removed from the moved config shape; `RenderConfig` now keeps only base board-render fields (`light`, `dark`, optional `coords`).
Confirmed decisions: `lastMove` was removed from core state/snapshot; `reducers.move()` now returns a `Move` domain result instead of storing `state.lastMove`.
Confirmed decisions: `move()` tests were updated to assert returned metadata for quiet move, capture, en passant-like `capturedSquare`, promotion, and castling metadata.
Confirmed decisions: `DirtyLayer.LastMove` and `DirtyLayer.Highlights` were removed; compact bit flags are now `Board`, `Coords`, `Pieces`, `Drag`, `All`.
Confirmed decisions: `select()` and `setTurn()` no longer mark `DirtyLayer.Board`; focused reducer tests verify they update state facts without board dirty marking.
Constraints: keep steps narrow, architecture-first, avoid overengineering, prefer small diff review loops, and do not redesign extension APIs, runtime composition, or public API prematurely.
Relevant files: `src/core/renderer/SvgRenderer.ts`, `src/core/renderer/types.ts`, `src/core/state/types.ts`, `src/core/state/boardState.ts`, `src/core/state/reducers.ts`, `tests/core/renderer/svgRenderer.structure.spec.ts`, `tests/core/state/reducers.spec.ts`, `current-plan.md`.
Next step: Pre-Phase 2 / `0.3 — post-cleanup validation and dead-path sweep`.
Next step scope: confirm no architectural leakage from `RenderConfig` into state, no dead fields or dead invalidation paths remain, and focused tests cover the new post-0.2 contracts without starting Phase 2 runtime composition.

## Attached plan

The full implementation plan is attached to this chat as a file, not pasted inline.
Use it as the roadmap reference, but in this chat focus only on the task below.

## Task for this chat

Focus only on: Pre-Phase 2 / 0.3 — post-cleanup validation and dead-path sweep.

Goals:

- validate that `0.1` and `0.2` cleanup outcomes are internally consistent
- confirm no architectural leakage from renderer/view config back into core state/snapshot
- confirm no dead fields, dead invalidation paths, or stale assumptions remain
- confirm focused tests reflect the new contracts (`RenderConfig`, `move(): Move`, no core-owned `lastMove`, no board dirty on `select()` / `setTurn()`)

Do:

1. brief audit of current implementation state
2. identify any remaining dead paths / stale assumptions / inconsistent tests
3. recommend only minimal follow-up changes if truly needed
4. prepare a precise implementation prompt for Cline + GPT-5 only if a narrow fix is justified

Do not:

- start Phase 2 runtime composition
- redesign extension APIs
- redesign public config/update API
- refactor controller/runtime wiring
- broaden cleanup into unrelated naming or export reshuffles

Working mode:

1. brief analysis
2. concrete recommendation
3. precise implementation prompt for Cline + GPT-5 (only if needed)
4. focused test updates (only if needed)
5. later patch review

Assume previously confirmed decisions remain in force unless explicitly revised.
Keep the step narrow and validation-focused.

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
