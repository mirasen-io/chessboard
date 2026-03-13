We are continuing work on `mirasen-io/chessboard`.

## Handoff summary

- **Project:** `mirasen-io/chessboard` on branch `feat/v1`.
- **Current task completed:** reviewed and accepted **Phase 3.6 Input / UI adapter wiring**.
- **Confirmed implementation:** added internal `src/core/input/inputAdapter.ts` as the DOM/pointer → controller bridge.
- **Confirmed adapter boundary:** adapter remains internal-only; no public API/package export expansion was accepted.
- **Confirmed runtime ownership:** `boardRuntime` creates and owns both `InteractionController` and `InputAdapter`; adapter wiring happens in `mount()` and cleanup in `destroy()`.
- **Confirmed controller boundary:** controller remains square-level only; DOM event objects/DOM math do not leak into controller contracts.
- **Confirmed mapping path:** adapter reads DOM pointer coordinates from the mounted host element, converts to local coordinates, and uses existing `mapBoardPointToSquare(...)`.
- **Confirmed geometry handling:** adapter receives `getGeometry: () => geometry`, so mapping uses live runtime geometry and is not cached across resize/orientation changes.
- **Confirmed pointer semantics:** `pointerleave` routes as `onPointerMove(null)`; `pointercancel` routes as `onPointerCancel()`; off-board resolution is `null`.
- **Confirmed pointer discipline:** one active pointer is tracked; non-primary and non-left-button `pointerdown` are ignored; pointer capture is used and safely released.
- **Confirmed teardown fix:** adapter/controller cleanup was moved to the beginning of `boardRuntime.destroy()` before runtime destroyed-state transition.
- **Confirmed scope discipline:** Phase 3.6 stayed narrow; no reopening of settled 3.1–3.5 decisions; no expansion into Phase 3.7 tests except a tiny snapshot-shape alignment fix.
- **Acceptance verdict:** **Phase 3.6 accepted and closed.**
- **Constraint carried forward:** do not redesign runtime/controller/renderer boundaries unless Phase 3.7 directly requires it.
- **Relevant files:** `src/core/input/inputAdapter.ts`, `src/core/runtime/boardRuntime.ts`, `src/core/input/interactionController.ts`, `src/core/input/squareMapping.ts`, `tests/core/input/interactionController.spec.ts`, `current-plan.md`.
- **Next step:** start **Phase 3.7 Input adapter tests** only, focused on DOM/pointer adapter-path behavior.

## Attached plan

The full implementation plan is attached to this chat as a file, not pasted inline.
Use it as the roadmap reference, but in this chat focus only on the task below.

## Task for this chat

Focus only on **Phase 3.7 Input adapter tests** from `current-plan.md`.

Goals:

- Review the current implementation only for the exact scope of **Phase 3.7**.
- Add focused tests for the new internal DOM/pointer input adapter path.
- Keep the step limited to testing DOM/pointer → adapter → controller/runtime wiring using the already accepted Phase 3.6 implementation.
- Produce a brief verdict and, if needed, a precise implementation prompt for Cline.

Do not:

- Reopen settled Phase 3.1 / 3.2 / 3.3 / 3.4 / 3.5 / 3.6 decisions.
- Redesign controller/runtime/renderer boundaries unless Phase 3.7 directly requires it.
- Expand public API.
- Broaden into unrelated runtime or renderer test coverage.

Working mode:

1. brief analysis
2. concrete recommendation
3. precise implementation prompt for Cline only if gaps are found
4. focused review of resulting diff later

Expected test focus:

- pointerdown on-board starts the interaction path
- off-board pointerdown is a no-op
- pointermove updates runtime targeting / `currentTarget`
- pointerleave routes as `null` target rather than cancel
- pointerup routes through drop/release path
- pointercancel routes through cancel path
- non-primary / non-left-button input is ignored
- destroy cleanup removes active adapter behavior
- geometry getter is live, not cached across geometry/orientation changes

Keep the step narrow, architecture-first, and grounded in the actual current files on branch `feat/v1`.
If specific files are needed for verification, request them explicitly rather than assuming contents.
Do not invent file contents.

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

https://github.com/mirasen-io/chessboard/tree/feat/v1

When discussing the current implementation, use this branch as the source of truth.

Sometimes you retrieve old version of files (probably due to cache), so attached also is the zip of src folder if you need to review some files.

If you need to inspect specific files, ask for them explicitly rather than assuming their contents.
Do not invent file contents.
