# AGENTS.md

## Project

`@mirasen/chessboard` is a TypeScript chessboard library focused on clean architecture, predictable rendering, explicit contracts, and future extension support.

## Instructions

### General principles

- Preserve architectural clarity over short-term convenience.
- Prefer narrow, local changes over broad rewrites.
- Keep public API and internal contracts explicit.
- Keep types honest; do not promise guarantees the runtime does not provide.
- Do not remove tests to make failures disappear.
- Do not weaken invariants silently; state the tradeoff explicitly.

### Required workflow

Before proposing any plan or implementation:

1. Read all relevant files first.
2. Infer current behavior from the actual code, not from assumptions.
3. Reference concrete files, functions, types, and responsibilities.
4. If anything is unclear, inspect more files before proposing changes.
5. Avoid rereading already-understood files unless new evidence requires it.

### PLAN mode rules

PLAN exists to describe intended changes, not to implement them.

- PLAN must not include full code blocks.
- PLAN must not include any code snippets, even as examples.
- PLAN must not quote large chunks of existing code.
- PLAN must reference files, types, functions, contracts, and responsibilities.
- PLAN must call out preserved invariants, risks, and affected tests.
- PLAN must prefer minimal-scope implementation steps.
- PLAN must not restate the task at length.
- PLAN must stay concise and structured.

When useful, PLAN should identify:

- touched files
- why each file is involved
- behavior to preserve
- tests to add or update
- possible edge cases

### ACT mode rules

ACT exists to implement the approved scope with minimal disruption.

- Make the smallest change that solves the problem.
- Prefer minimal unified diffs or minimal code edits.
- Do not restate unchanged code.
- Do not output full files unless explicitly requested.
- Do not rewrite an entire file unless the task explicitly requires it.
- If a change affects more than a small local region, briefly justify why that scope is necessary.
- Do not rewrite unrelated code for style consistency.
- Preserve naming and structure unless change is required.
- Keep comments concise and only where they add real value.

### Change scope discipline

- Never expand scope without a concrete reason tied to the task.
- Do not mix bug fixes, refactors, and cleanup unless they are required for correctness.
- If a tempting cleanup is unrelated, note it separately instead of implementing it.
- If a change might affect behavior outside the immediate file, explicitly mention possible side effects.

### Output discipline

- Do not restate existing code.
- Only show the minimal changed portion.
- Prefer unified diffs or tightly scoped snippets when output format allows.
- Keep explanations short and tied to the actual change.
- Do not produce large code dumps in PLAN or ACT unless explicitly requested.

### Architecture safety

Respect the existing architecture.

- Do not introduce new layers, patterns, or abstractions unless the task explicitly requires it.
- Do not merge or split architectural components without explicit instruction.
- Do not move responsibilities across layers unless the task explicitly requires it.
- Work within the current architecture first; propose deeper refactors only if necessary.

### Architecture invariants

- Renderer owns DOM/SVG structure and rendering lifecycle.
- Input and interaction logic must not directly manipulate DOM.
- InteractionController handles interaction state and move intent, not rendering.
- Rendering decisions should follow explicit runtime/state inputs.
- Avoid hidden coupling between controller, runtime, animation, and renderer.
- Prefer explicit interfaces over implicit cross-layer access.

### Rendering rules

- SVG structure ownership stays centralized in the renderer layer.
- New visual features should render through existing renderer boundaries.
- Do not bypass renderer ownership with ad hoc DOM access.
- Extension visuals must render through defined extension slots/layers.
- Avoid one-off rendering paths if a general rendering path already exists.

### Animation rules

- Animation should follow the general animation architecture, not special-case pipelines per move type.
- Multi-piece motion must use the shared coordinated animation model where applicable.
- Keep animation-specific logic limited to producing correct animation input.
- Do not duplicate renderer ownership inside animation logic.
- Prefer reusable planning/execution boundaries over ad hoc move-specific handling.

### Extension rules

- First-party extension work should validate extension lifecycle and mounting behavior.
- Extensions should use explicit slots/layers.
- Do not over-promise completeness in types when runtime coverage is partial or conditional.
- Prefer extension APIs that leave room for future advanced visuals without breaking ownership boundaries.

### Extension runtime boundaries

- `boardRuntime` must not hardcode or import specific first-party extensions.
- Runtime consumes extension definitions only from `BoardRuntimeInitOptions.extensions`.
- Extension execution order is the array order from `BoardRuntimeInitOptions.extensions`.
- Duplicate extension ids must throw during runtime initialization.
- Default first-party extension sets belong in a higher-level/public wrapper layer, not in runtime.

### Runtime helper boundaries for extensions

- Keep shared internal runtime helpers narrow.
- Do not let a shared committed-move helper call extension updates or render scheduling if the caller still has related state mutations to finish.
- `updateExtensions()` and `scheduleIfAnythingDirty()` should run only after the full user-visible operation reaches its final runtime state for that cycle.

### Layout invalidation for square-based extensions

- Keep layout invalidation signaling for extensions separate from semantic `view` state.
- Prefer runtime-provided top-level extension update context fields such as `layoutVersion` / `layoutChanged` over forcing each extension to track previous layout version on its own.
- Square-position-based extensions should re-render on both their semantic state changes and runtime-provided layout changes.

### Type and API rules

- Keep types honest.
- If widened inputs make completeness uncertain, reflect that in the return type.
- Avoid “helpful” signatures that promise more than runtime guarantees.
- Preserve literal-type benefits where possible, but do not fake certainty.
- Prefer explicit tradeoffs over misleading convenience.

### Testing rules

- Add or update focused tests for every meaningful behavior change.
- Prefer targeted unit tests near the changed logic.
- When fixing regressions, add a regression test when practical.
- Verify both runtime behavior and cleanup behavior where relevant.
- Avoid brittle tests that depend on incidental implementation details.
- Do not delete tests unless they are truly invalid and the reason is stated explicitly.
- Prefer behavior-focused tests over coverage-chasing.
- Do not chase 100% coverage for defensive branches, type artifacts, or unreachable fallback paths unless the branch represents meaningful behavior.
- If remaining uncovered lines are accepted coverage tails, leave them alone unless tied to a real bug, regression, or future feature task.

### Test suite organization rules

- Keep test files focused and reasonably small; as a working guideline, prefer about 200-250 lines maximum per spec file.
- If a test area grows beyond that, split by behavior using scope-specific file names such as `render-basic.spec.ts`, `render-reconcile.spec.ts`, `update-dirtying.spec.ts`, or `lifecycle-unmount.spec.ts`.
- Do not create large catch-all spec files.
- Do not keep reusable local `_helpers.ts` files beside specs when the helper belongs in `tests/test-utils`.
- `tests/test-utils` should mirror the relevant `src` structure for subsystem-specific helpers.
- Generic DOM/SVG helpers belong under generic test-utils paths such as `tests/test-utils/dom/`.
- Subsystem-specific helpers belong under matching subsystem paths such as `tests/test-utils/extensions/first-party/main-renderer/`.
- Keep casts and mock-shape compromises localized inside test-utils helpers when possible.
- Avoid scattering `as never`, broad casts, or hand-built context mocks through spec files.
- Prefer public or observable behavior in specs.
- Use direct exported internal functions only when they are intentionally exported and the test remains narrower and clearer than going through a larger integration surface.
- Do not broaden test-utils into generic frameworks unless multiple test areas clearly need the same abstraction.
- Do not duplicate helper logic across specs; extract small generic primitives or subsystem-specific helpers where reuse is clear.

### Performance and behavior

- Prefer predictable RAF-based or scheduler-based flows over scattered ad hoc updates.
- Avoid unnecessary rereads, recomputation, or rerendering.
- Preserve responsiveness of drag, move, animation, and render paths.
- Do not introduce hidden performance costs for future extension points.

### For each task, identify

- touched files
- preserved invariants
- new behavior or contract introduced
- test impact
- possible side effects or follow-up risk

### Response expectations

When reporting back after implementation:

- summarize what changed
- note any contract or type changes
- note tests added or updated
- note any remaining risk, limitation, or follow-up

## SvelteKit example workflow

Adapted from `../cloudflare-site/AGENTS.md`. The root remains the TypeScript library;
SvelteKit application tooling belongs to `examples/sveltekit`.

- Work from this repository root. Use root npm scripts for the library and
  `npm --prefix examples/sveltekit run <script>` for the example. Build the root library
  before checking/building the example, whose local package exports use `dist/`.
- Run formatting after coherent code/configuration changes, using each project's own
  tooling. Run lint, check and build after a coherent block, not after every small edit.
  Preserve generated skills with formatting exclusions.
- The example is for manual checks. Keep Vitest/Playwright tooling installed for future
  use, but do not generate example tests or test CI jobs unless requested. Preserve and
  run the root library's existing validation when verifying a migration.
- Use Svelte MCP `list-sections` first, then fetch relevant documentation. Run
  `svelte-autofixer` on changed Svelte files and recheck fixes. Keep suggestions within
  the authorized scope and preserve library architecture/lifecycle boundaries.

### Browser verification

- Apply `.agents/skills/playwright-cli/SKILL.md` for browser interaction guidance.
  Use `examples/sveltekit/node_modules/.bin/playwright-cli` from the root, or the local
  binary from inside the example. Check `--help`; never use a global installation.
- Start the example dev server in the background, use the URL Vite reports, and stop
  the server you started when finished. Do not build solely to inspect a page.
- Restart after routing/configuration/dependency changes or stale output, and before
  final visual verification. Do not leave duplicate servers or close unrelated sessions.
- Use named browser sessions, targeted `find`/snapshots, limited depth and `--raw` output.
  Take screenshots only for meaningful visual checks, not after routine edits.
- For this migration, perform a brief visual sanity check with priority on `/0-debug`,
  representative desktop/mobile widths, usable navigation and board controls. Do not
  pursue exhaustive route/state comparisons or pixel matching. DOM snapshots alone
  do not establish visual correctness.
- Keep CLI output untracked under `.playwright-cli/`; retain useful migration evidence
  only under ignored `artifacts/`. Report actual checks and any unavailable results.
- If browser tooling is missing, report it; do not silently install packages or browsers.
  The current migration explicitly authorizes local Playwright/Vitest/Tailwind setup.
