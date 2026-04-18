Follow:

- `ai-workflow-instructions.md`
- `ai-artifacts-instructions.md`

Also use as references when relevant:

- the active project current plan file `chessboard-current-plan.md`
- the active project AGENTS file `chessboard-AGENTS.md`
- `AGENTS-template.md`
- `next-chat-prompt-template.md`

Perform end-of-chat closeout for this project/task.

## Goals

1. Generate the replacement block for the next chat prompt.
2. Review whether the current project plan should be updated.
3. Review whether the project-specific `chessboard-AGENTS.md` should be updated.
4. Review whether `AGENTS-template.md` should be updated.
5. Only propose artifact updates that are materially justified by this chat.

Do not create update churn for minor wording preferences or one-off observations.

---

## Required output structure

Output the result in exactly these sections and in this order:

### 1. Next-chat replacement block

Generate one contiguous markdown block intended for direct replacement inside `next-chat-prompt-template.md`.

This block must contain exactly these two consecutive sections, with headings included:

- `## Handoff summary`
- `## Task for this chat`

Requirements:

- keep both sections in one contiguous markdown block
- match the structure expected by `next-chat-prompt-template.md`
- make the block ready for direct paste/replace
- include only durable, relevant context
- keep the next task narrow and actionable
- do not include unrelated brainstorming
- do not include process commentary outside the two sections

### 2. Current plan review

State one of:

- `No chessboard-current-plan.md update needed`
- or `chessboard-current-plan.md update needed`

If an update is needed, provide:

- the reason
- the exact section(s) that should change
- the proposed replacement text or patch block

Only propose a current-plan update if completed work or changed sequencing materially affects the plan.

### 3. Project AGENTS review

State one of:

- `No chessboard-AGENTS.md update needed`
- or `chessboard-AGENTS.md update needed`

If an update is needed, provide:

- the reason
- the exact section(s) that should change
- the proposed replacement text or patch block

Only propose a project AGENTS update if this chat produced durable project-specific agent guidance that should apply again.

### 4. AGENTS-template review

State one of:

- `No AGENTS-template.md update needed`
- or `AGENTS-template.md update needed`

If an update is needed, provide:

- the reason
- the exact section(s) that should change
- the proposed replacement text or patch block

Only propose an AGENTS-template update if this chat produced durable reusable guidance that is truly project-agnostic.

---

## Closeout rules

### Generate the next-chat block from durable context only

The handoff and next-task block should preserve only:

- project
- current task status
- confirmed decisions
- relevant constraints
- relevant files or artifact references
- next step

Do not include:

- jokes
- side discussions
- rejected ideas
- verbose explanations
- temporary confusion that no longer matters

### Respect artifact hierarchy

Do not let summaries or model narrative outrank:

- the current task reality
- current code/diff/tests
- the current plan
- project-specific AGENTS rules

### Keep the next task narrow

The generated `## Task for this chat` section should define a focused next step, not a broad phase rewrite.

### Do not force artifact updates

If no durable update is needed for:

- current plan
- project AGENTS
- AGENTS-template

say so explicitly and stop there.

### Prefer patch-ready output

When proposing updates, make them easy to apply in VS Code:

- include headings when useful
- prefer replacement-ready text blocks
- keep patches focused

### Template alignment

The generated next-chat replacement block must align with:

- `next-chat-prompt-template.md`

That means:

- `## Handoff summary` and `## Task for this chat` must be emitted together
- they should be ready to replace the corresponding two consecutive sections in the template
- include the section headings themselves

---

## Decision standard for artifact updates

Propose an update only if at least one of these is true:

### For `chessboard-current-plan.md`

- a meaningful task was completed
- sequencing changed
- the next phase/task changed
- the plan is now out of sync with actual completed work

### For `chessboard-AGENTS.md`

- a durable project-specific implementation/planning/review rule emerged
- a project-specific architectural invariant was clarified
- a repeated project-specific failure mode now has a stable prevention rule

### For `AGENTS-template.md`

- a durable reusable rule emerged that should apply across projects
- the rule is not chessboard-specific
- the rule is not merely a one-off convenience

If the insight is useful but not durable enough, do not propose an update.

---

## Style requirements

- Keep the result compact and operational.
- Prefer exact replacement text over abstract advice.
- Do not output long essays.
- Do not restate the whole chat.
- Do not rewrite artifacts unless necessary.
- Be explicit when no update is needed.

---

## Final instruction

Perform closeout for the current `mirasen-io/chessboard` chat.

Use `next-chat-prompt-template.md` as the structural target for the generated replacement block.

Use:

- `chessboard-current-plan.md`
- `chessboard-AGENTS.md`
- `AGENTS-template.md`
