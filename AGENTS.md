# AGENTS.md

## Project

`@mirasen/chessboard` is a TypeScript chessboard library focused on clean architecture, predictable rendering, and future extension support.

## Core principles

- Preserve architectural clarity over short-term convenience.
- Prefer narrow, local changes over broad rewrites.
- Keep public API and internal contracts explicit.
- Do not silently weaken invariants without stating the tradeoff.
- Do not remove tests to make failures disappear; fix behavior or update tests intentionally.

## Required workflow

Before proposing any plan or code change:

1. Read all relevant files first.
2. Infer the current architecture from the code, not from assumptions.
3. Reference concrete files/functions/types in the plan.
4. If something is unclear, inspect more files before proposing changes.

## PLAN mode rules

- PLAN must describe changes, not implement them.
- PLAN must not include full code blocks.
- PLAN must not quote large chunks of existing code.
- PLAN should reference files, types, functions, and responsibilities.
- PLAN should call out invariants, risks, and affected tests.
- PLAN should prefer minimal-scope implementation steps.

## ACT mode rules

- Make the smallest change that solves the problem.
- Prefer minimal unified diffs or minimal code edits.
- Do not restate unchanged files.
- Do not rewrite unrelated code for style consistency.
- Preserve naming and structure unless change is required.
- Keep comments concise and only where they add real value.

## Architecture invariants

- Renderer owns DOM/SVG structure and rendering lifecycle.
- Input/interaction logic must not directly manipulate DOM.
- InteractionController handles interaction state and move intent, not rendering.
- Rendering decisions should follow explicit runtime/state inputs.
- Avoid introducing hidden coupling between controller, runtime, and renderer.
- Prefer explicit interfaces over implicit cross-layer access.

## Rendering rules

- SVG structure ownership stays centralized in the renderer layer.
- New visual features should render through existing renderer boundaries, not ad hoc DOM access.
- Extension visuals must render through extension slots/layers, not by bypassing renderer ownership.
- Avoid separate one-off rendering systems when a general rendering path already exists.

## Animation rules

- Animation should follow the general animation architecture, not special-case pipelines per move type.
- Castling and other multi-piece motion should use the shared coordinated animation model.
- Prefer reusable animation planning/execution boundaries.
- Keep animation-specific logic limited to producing correct animation input, not duplicating renderer ownership.

## Extension rules

- Design first-party extension work so it validates the extension lifecycle and mounting model.
- Extensions should use explicit slots/layers.
- Do not over-promise completeness in types when runtime coverage is partial or conditional.
- Prefer extension APIs that can later support more advanced visuals without reworking ownership boundaries.

## Type and API rules

- Keep types honest.
- If widened inputs make completeness uncertain, reflect that in the return type.
- Avoid “helpful” type signatures that promise more than runtime guarantees.
- Preserve literal-type benefits where possible, but do not fake certainty.

## Testing rules

- Add or update focused tests for every meaningful behavior change.
- Prefer targeted unit tests close to the changed logic.
- When fixing regressions, add a regression test if practical.
- Verify both runtime behavior and cleanup behavior where relevant.
- Avoid brittle tests that depend on incidental implementation details.

## Performance and behavior

- Prefer predictable RAF-based or scheduler-based flows over scattered ad hoc updates.
- Avoid extra rereads, recomputation, or rerendering unless justified.
- Preserve responsiveness of drag/move/render paths.
- Do not introduce hidden performance costs for future extension points.

## Change discipline

For each task, identify:

- touched files
- preserved invariants
- new invariant or behavior introduced
- test impact

## Output expectations

When reporting back:

- summarize what changed
- note any contract/type changes
- note tests added/updated
- note any remaining risk or follow-up
