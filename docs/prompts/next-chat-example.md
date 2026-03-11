We are continuing work on `kt-npm-modules/chessboard`.

## Handoff summary

- Project: `kt-npm-modules/chessboard` — MIT-licensed modern TypeScript chessboard engine with chessground-like interaction and cm-chessboard-like extension ideas.
- Current task completed: Phase 2.3a — internal-only movability feeding into runtime/state/snapshot.
- Confirmed: runtime remains internal POJO/factory style via `createBoardRuntime(...)`, not a class.
- Confirmed: runtime owns mount state, host-derived board size, geometry, scheduler wiring, render permission, resize observation, and minimal internal-only `destroy()`.
- Confirmed: board remains rule-agnostic; legality source stays external and host/controller-owned.
- Confirmed: external interaction policy now enters runtime via `setMovability(...)`, not `setDestinations(...)`.
- Confirmed movability model: `MovableColor = 'white' | 'black' | 'both'`; `Movability = StrictMovability | FreeMovability | DisabledMovability`.
- Confirmed `StrictMovability` carries external `destinations`; `FreeMovability` allows unrestricted move interaction; `DisabledMovability` means move interaction disabled only.
- Confirmed: renderer does not consume movability in Phase 2.3a; movability lives in internal state/snapshot for runtime read model and future input/extensions.
- Confirmed: `turn` and `movability` are independent inputs; board must not infer one from the other.
- Confirmed: internal state/snapshot use normalized `null` rather than `undefined`; optionality is only at input/options boundary.
- Confirmed: `setMovability` reducer returns `boolean` changed-flag; runtime schedules only when `mounted && changed`.
- Confirmed: no renderer redesign, no scheduler redesign, no drag/input/controller implementation, no public API shaping, no extension model work in Phase 2.3a.
- Relevant files: `src/core/state/types.ts`, `src/core/state/boardState.ts`, `src/core/state/reducers.ts`, `src/core/runtime/boardRuntime.ts`, `tests/core/runtime/boardRuntime.spec.ts`, `tests/core/renderer/svgRenderer.coords.spec.ts`, `tests/core/renderer/svgRenderer.structure.spec.ts`, `current-plan.md`.
- Known follow-up note: movability is currently stored by reference; later consider defensive cloning/normalization or an explicit immutable-input contract.
- Next step: Phase 2.3b — runtime/input begins consulting movability for move-attempt eligibility while keeping scope narrow and avoiding drag lifecycle/public API work.

## Attached plan

The full implementation plan is attached to this chat as a file, not pasted inline.
Use it as the roadmap reference, but in this chat focus only on the task below.

## Task for this chat

We are continuing work on `kt-npm-modules/chessboard`.

Phase 2.3a is complete and accepted. Use the attached `current-plan.md` as the roadmap source of truth, and continue with the next narrow step: **Phase 2.3b — runtime/input begins consulting movability**.

Working mode for this chat:

1. brief audit of the current implementation relevant to Phase 2.3b
2. identify the smallest correct behavioral step to implement now
3. recommend only minimal changes needed
4. prepare a precise implementation prompt for Cline
5. later review the patch in a narrow diff loop

Keep these confirmed decisions in force unless explicitly revised:

- runtime is internal POJO/factory style via `createBoardRuntime(...)`, not a class
- runtime owns mount state, host-derived board size, geometry, scheduler wiring, render permission, resize observation, and minimal internal-only `destroy()`
- board remains rule-agnostic; legality source stays external
- external interaction policy enters runtime via `setMovability(...)`
- movability model is:
  - `MovableColor = 'white' | 'black' | 'both'`
  - `StrictMovability`
  - `FreeMovability`
  - `DisabledMovability`
  - `Movability = StrictMovability | FreeMovability | DisabledMovability`
- `StrictMovability` carries external `destinations`
- `DisabledMovability` means move interaction disabled only, not all board interaction
- renderer does not consume movability directly
- `turn` and `movability` are independent; board must not infer one from the other
- internal normalized state/snapshot use `null`, not `undefined`
- runtime remains internal-only; do not export it publicly

Do not:

- redesign renderer or scheduler unless strictly necessary
- start full drag lifecycle work early
- broaden into public API design
- redesign extension model
- refactor unrelated code
- introduce speculative abstractions

Goal for this chat:

- determine the smallest way for runtime/input to begin consulting movability for move-attempt eligibility
- keep this behavioral step narrow
- avoid pulling in full drag/drop/controller architecture prematurely

Likely boundary of the step:

- `DisabledMovability` blocks move attempts
- `StrictMovability` allows only destinations-driven move attempts
- `FreeMovability` allows move attempts without destinations
- no full drag lifecycle redesign
- no public API shaping
- no extension work

Cline workflow preference:

- discuss architecture here first
- then generate a precise prompt for Cline
- once the plan is good enough, provide only delta/corrections to the plan in the prompt itself
- do not write prompts that say `Go to Act` / `toggle to Act`
- in chat, separately say that the prompt can be sent in Act and that an updated plan is not needed
- review actual staged diff; if diff looks glitched or inconsistent, request the changed files explicitly

Prefer:

1. brief analysis
2. concrete recommendation
3. precise implementation prompt for Cline + GPT-5
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
