We are continuing work on `mirasen-io/chessboard`.

Follow:

- `ai-workflow-instructions.md`
- `ai-artifacts-instructions.md`

Use as project-specific references:

- `chessboard-current-plan.md`
- `chessboard-AGENTS.md` (if relevant to this task)

## Handoff summary

- Project: `mirasen-io/chessboard` / `@mirasen/chessboard`, branch `feat/v1`.
- Phase 3.10 is complete.
- Phase 4.1 is complete.
- Phase 4.2a is complete and can be treated as done.
- Completed in 4.2a:
  - runtime extension lifecycle is wired end-to-end: init -> mount -> update -> renderBoard -> unmount
  - extension invalidation is separate from core invalidation and is cleared through scheduler pass cleanup
  - runtime no longer hardcodes `selectedSquare`; extensions come from `BoardRuntimeInitOptions.extensions`
  - extension order is array order from `BoardRuntimeInitOptions.extensions`
  - duplicate extension ids throw during runtime initialization
  - no runtime default extensions are injected inside `boardRuntime`
  - `selectedSquare` was converted from exported singleton definition to factory form:
    - `createSelectedSquareExtension(): SelectedSquareExtensionDefinition`
  - tests were updated so extension-aware behavior is covered only in extension-aware runtime tests
- Confirmed constraints/invariants:
  - core owns top-level SVG roots and extension slot roots
  - renderer owns slot allocation/removal for extension child roots
  - extensions own only their assigned child subtrees
  - runtime drives extension lifecycle; defaults belong in higher-level wrapper/public layer, not runtime
  - `BoardRuntimeInitOptions.extensions` already exists and should remain the runtime entry point
  - extension order is array order; no separate runtime `order` field
  - locked invalidation snapshot types should remain unchanged unless strictly required:
    - `InvalidationStateRenderSnapshot`
    - `InvalidationStateSnapshot`
    - `InvalidationStateExtensionSnapshot`
- Relevant files:
  - `src/core/runtime/boardRuntime.ts`
  - `src/core/extensions/types.ts`
  - `src/core/extensions/selectedSquare.ts`
  - `src/core/renderer/SvgRenderer.ts`
  - `tests/core/runtime/boardRuntime.extensions.spec.ts`
  - `tests/core/runtime/boardRuntime.spec.ts`
  - `tests/core/input/inputAdapter.spec.ts`
  - `chessboard-current-plan.md`

## Task for this chat

Focus only on: **Phase 4.2b planning — first move-derived extension `lastMove`**

### Task frame

What:

- plan the narrow next step for a first-party `lastMove` extension using the now-complete 4.2a runtime extension path

Not:

- no runtime extension framework redesign
- no wrapper/default-extension API work
- no extension customization/theme system work yet

Constraints:

- use the existing runtime extension path from 4.2a as the source of truth
- keep runtime generic: no hardcoded `lastMove` inside `boardRuntime`
- preserve locked invalidation snapshot types unless a strict need is proven
- treat extension order as array order from `BoardRuntimeInitOptions.extensions`
- keep the task architecture-first and narrow

Done when:

- there is a concise implementation-oriented plan for 4.2b
- the plan clearly states what extra update/render context `lastMove` needs beyond `selectedSquare`
- the plan identifies touched files and focused test updates without broadening scope

### Questions to answer

- What is the minimal move-derived context that `lastMove` needs from runtime?
- Should `lastMove` derive its own state only from update context, or does runtime need to pass explicit previous/current move-transition data?
- What slot should `lastMove` render into, and why?
- What should remain deferred until after 4.2b?

### Output expectations

- files inspected first
- concise architecture decision
- minimal runtime/file/test plan for 4.2b
- explicit non-goals/deferred items

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
