We are continuing work on `mirasen-io/chessboard`.

Follow:

- `ai-workflow-instructions.md`
- `ai-artifacts-instructions.md`

Use as project-specific references:

- `chessboard-current-plan.md`
- `chessboard-AGENTS.md` (if relevant to this task)

## First-step rule

Start with analysis and discussion readiness.

Do not generate an implementation prompt immediately after the first analysis pass.

Instead:

- understand the task
- identify any architectural or structural questions if they exist
- summarize the proposed direction briefly
- stop in a discussion-ready state

Only generate the prompt if the user explicitly asks for it or clearly signals to proceed.

## Handoff summary

- Project: `mirasen-io/chessboard` / `@mirasen/chessboard`, branch `feat/v1`.
- Phase 4.3a is complete.
- Phase 4.3b is complete.
- Phase 4.4 is complete.
- Phase 4.5 is complete.
- The active next plan item is **4.3c Legal moves extension + flexible strict movability destination source**.

Confirmed durable decisions:

- `activeTarget` work is accepted and the interaction-baseline reconciliation pass is complete.
- Repeated same-piece re-engagement after return-to-source is accepted as preserving selection consistently; 4.3b is resolved and complete.
- Extension lifecycle / invalidation contract work is already materially implemented and validated; 4.4 is complete.
- Extension test coverage for the current first-party extension set is already materially in place; 4.5 is complete.
- Strict movability is being extended to support two destination-source forms:
  - `MovabilityDestinationsRecord = Partial<Record<Square, readonly Square[]>>`
  - `MovabilityResolver = (source: Square) => readonly Square[] | undefined`
  - `MovabilityDestinations = MovabilityDestinationsRecord | MovabilityResolver`
  - `StrictMovability.destinations: MovabilityDestinations`
- For 4.3c, the first-party `legalMoves` extension should stay presentation-only and read the existing movability source of truth rather than deciding legality itself.
- `legalMoves` MVP visual default is a centered filled dot:
  - size: `12.5%` of square size
  - fill: `rgb(0, 0, 0)`
  - fill opacity: `0.35`
  - stroke: `rgb(255, 255, 255)`
  - stroke opacity: `0.18`

Relevant constraints:

- Keep the next task narrow.
- Preserve existing record-based strict movability behavior.
- Add one normalization/helper path for record-vs-resolver destination lookup rather than duplicating branching.
- Do not overdesign advanced legal-move visuals in the first pass.
- Keep runtime ownership of move-policy questions; extension logic remains presentation-only.

Relevant references:

- `chessboard-current-plan.md`
- `chessboard-AGENTS.md`
- `chessboard-interaction-model.md`
- `ai-workflow-instructions.md`
- `ai-artifacts-instructions.md`

## Task for this chat

We are continuing with **Phase 4.3c** in `mirasen-io/chessboard`.

This chat should be **analysis/planning only** for the first narrow implementation step after the initial 4.3c movability contract update.

Do:

- read the current `src + tests` package from this chat first
- inspect the already-updated movability types and confirm whether the new strict-movability destination contract is correctly shaped and consistently represented
- identify what still needs to change after that contract update so the feature can proceed cleanly
- determine the narrowest sensible next implementation batch for 4.3c
- prepare only the **next immediate Cline prompt**

Do not:

- directly edit code yourself
- directly edit tests yourself
- run tests yourself
- generate a chain of future prompts
- repeat the already-completed contract-definition step as if it were still pending
- broaden into full extension implementation if a smaller normalization or compatibility batch should come first

Current 4.3c context:

- the strict-movability destination contract has already been introduced in code:
  - `MovabilityDestinationsRecord = Partial<Record<Square, readonly Square[]>>`
  - `MovabilityResolver = (source: Square) => readonly Square[] | undefined`
  - `MovabilityDestinations = MovabilityDestinationsRecord | MovabilityResolver`
  - `StrictMovability.destinations: MovabilityDestinations`
- this chat should treat that contract step as **already started** and should first **re-check / validate** it against the current codebase before choosing the next narrow batch

  4.3c target:

- preserve current record-based strict movability behavior
- support resolver-based strict movability cleanly
- add one normalization/helper path for record-vs-resolver destination lookup
- later implement `legalMoves` as a first-party extension on top of the normalized destination source

Important design constraints for this chat:

- prefer the narrowest sensible next batch
- do not reopen the contract shape unless the current code reveals a real problem
- keep current record-based callers working
- add one helper/normalization path instead of duplicating record-vs-resolver branching
- keep `legalMoves` presentation-only
- keep the first legal-moves visual model narrow:
  - centered filled dot only
  - no occupied-square special case in this first pass
  - no advanced visual variants

Required output for this chat:

1. files read from the attached archive
2. whether the already-added movability contract looks correct as-is or needs a narrow correction
3. the recommended first narrow batch after that re-check
4. any important constraints/risk notes for that batch
5. the single recommended immediate Cline prompt

## Working mode

Work architecture-first when the task has architectural risk.
Keep the step narrow.
Avoid overengineering.
Assume previously confirmed decisions remain in force unless explicitly revised.

When useful, structure the work as:

1. brief analysis
2. proposed direction, or the most relevant options if a real architectural choice exists
3. stop in a discussion-ready state
4. generate the implementation prompt only after the user explicitly asks for it or clearly signals to proceed
5. focused test updates
6. later patch review

If you notice related future issues, mention them briefly only if they materially affect this step.
Do not redesign unrelated parts.
Do not introduce speculative APIs unless clearly justified.

## Project plan reference

Use `chessboard-current-plan.md` as the roadmap reference for:

- current phase
- sequencing
- task scope context

If the current plan appears out of sync with the handoff or recently completed work, call that out briefly before relying on it.

## Codebase / project materials

Primary repository / branch:

- `mirasen-io/chessboard`
- `feat/v1`
- when repository access is needed, prefer the GitHub connector over Web/Web UI access

Optional attached materials:

- current `src` + `tests` zip
- other task-specific files if needed

If repository access may be stale, incomplete, or cached, prefer attached source artifacts for file-level review.

If this prompt refers to specific files, first look for them in the current chat attachments.

If they are not attached, then look for them in the available project sources / referenced artifacts.

When the same artifact exists in both places, prefer the attached version for the active task, because it may be the newer task-local version.

Do not assume the contents of referenced files that are not actually available.

If a materially required referenced file cannot be found in either attachments or available project sources, do not continue with substantive best-effort analysis.

Instead, briefly state which file is missing, say that it was not found in either attachments or sources, and ask the user to attach it or point to it.
