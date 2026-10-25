# Chessboard example migration: SvelteKit 2 → SvelteKit 3

Research date: October 25, 2026. Branch: `migrate/sk-3`.
Baseline commit: `5b5a70436a6beab4ae4f7001c6f105c1ed1dc557`.

Status: implementation authorized on October 25, 2026. Commit after each step; push and
open the PR at the end. Root Svelte/browser guidance and the sibling website's Playwright
skill/plugin setup are being transferred before migration.

## References and execution boundary

Adapted from [the website migration plan at `d5e9ae6`](https://github.com/mirasen-io/cloudflare-site/blob/d5e9ae6/docs/plan.md),
read from the local `../cloudflare-site` repository. Follow its fresh minimal scaffold,
port, compare, and verify approach within this repository's example directory.
Technical requirements were checked against the official Svelte MCP documentation:
[Kit 3 migration](https://svelte.dev/docs/kit/migrating-to-sveltekit-3),
[sv create](https://svelte.dev/docs/cli/sv-create),
[adapter-auto](https://svelte.dev/docs/kit/adapter-auto), and
[$app/tsconfig](https://svelte.dev/docs/kit/$app/tsconfig).

Execute the steps autonomously through commits, push, PR creation, and CI verification.
Update this document with actual results as work proceeds; do not inherit the reference
plan's requirement to stop for review after each step. The user will merge the PR.
Do not merge, enable auto-merge, publish the library, or trigger a production release.

## Approach and scope

Create a fresh minimal Kit 3 application at `examples/sveltekit`, alongside the renamed
`examples/sveltekit-2-old`. Port the existing example into it, verify against the old
application, then remove the tracked old tree after successful comparison. Keep the
existing repository and Git history; no nested repository or replacement of the root.

The final path is deliberate: `.github/workflows/ci.yml`, `.github/dependabot.yml`, and
the root `.prettierignore` already reference `examples/sveltekit`.

Carry over only chessboard pages, helpers and styles. Reorganize them as numbered examples
with simple reusable navigation; move Debug out of the home page. Preserve debug tools,
chess behavior and local library integration. No library API upgrade, renderer/runtime
refactor, hosting migration, or unrelated dependency refresh.

Use the clean `minimal` template, without the full SvelteKit demo. The existing `/demo`,
`/demo/playwright`, `src/lib/vitest-examples` and their greeting/heading tests are scaffold
examples, explicitly excluded by the user. Do not carry them forward or introduce new
generated demo content.

This example is a manual-check application. Do not write automated example tests, fixtures,
regression suites or example test CI jobs. Install and retain Vitest unit/component tooling,
Playwright and Tailwind (including forms/typography) for future use, following the tooling
setup in `../cloudflare-site`. Keep their configuration/scripts available without making
empty test suites a validation requirement. The root library's existing tests and CI remain
in scope for regression verification and must not be removed or weakened.

## Inspected baseline

| Area                | Current state                                                                                                     |
| ------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Example             | Private `sveltekit` package, version `0.0.1`; independent npm lockfile, no root workspace                         |
| Framework, locked   | Kit `2.70.3`, adapter-auto `7.0.1`, Svelte `5.57.2`                                                               |
| Build tools, locked | Vite `8.3.4`, TypeScript `6.0.3`, vite-plugin-svelte declared `^7.3.1`                                            |
| Test tools, locked  | Vitest and browser provider `5.0.5`, vitest-browser-svelte `3.1.0`, Playwright/test `1.64.1`                      |
| Library             | `@mirasen/chessboard` uses `file:../..`; root exports resolve through built `dist/`                               |
| Styling             | Tailwind 4 with forms/typography; shared `src/routes/layout.css`, favicon, app shell                              |
| Lifecycle           | `useBoard` creates on mount, runs setup teardown and destroys on unmount; standalone pages own equivalent cleanup |
| Rendering           | adapter-auto; no prerender configuration, server routes, hooks, or environment imports in the inspected source    |
| Tests               | Two Vitest demo specs, one Playwright demo spec; no automated board-route coverage                                |
| CI                  | Installs `examples/sveltekit`; existing explicit test run builds/tests the root library, not the example          |

The root package is `@mirasen/chessboard` `1.5.2`. Its TypeScript build and Vitest suite
are separate from the example. Preserve root exports, optional chess.js peer dependency,
Changesets, release workflows, and library engine contract. Kit's Node requirement
belongs to the example, not automatically to the framework-independent library.

Port these seven chessboard pages to the numbered routes below. URL changes are
intentional; update navigation and manual verification URLs together. Legacy redirects are not required for
this internal example application.

| Existing URL         | Target URL           | Responsibility                                                                                                            |
| -------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `/`                  | `/0-debug`           | Manual runtime debug: raw snapshots, free moves, annotation colors/modifiers, orientation and renderer drag configuration |
| `/free`              | `/1-free`            | Minimal free-movement controls                                                                                            |
| `/2-custom-ext-list` | `/2-custom-ext-list` | Explicit renderer/lastMove/autoPromote/promotion extension list                                                           |
| `/3-setOnUIMove`     | `/3-setOnUIMove`     | Event registration, snapshot refresh, 100 ms polling with cleanup                                                         |
| `/4-setMovability`   | `/4-setMovability`   | Strict destinations for e2, d7 and g1; snapshot polling with cleanup                                                      |
| `/promotion`         | `/5-promotion`       | Custom promotion destinations, chooser and auto-queen control, snapshot polling                                           |
| `/chessjs`           | `/6-chessjs`         | chess.js adapter, legal moves, check/status, delayed computer move and reset/timeout cleanup                              |

The home page becomes a simple example index. Navigation lists all seven chessboard
examples in numeric order, followed by any future non-chessboard pages; no extra demo
pages are needed now.

## Portable chessboard files and navigation

- Keep the seven example components as separate files under
  `src/lib/chessboard-examples/pages/`; numbered route `+page.svelte` files only mount
  their corresponding component. Debug keeps its current manual controls and snapshots,
  now in its own component rather than the home page.
- Keep `use-board.svelte.ts`, `board-utils.ts`, one navigation component and its link
  list under `src/lib/chessboard-examples/`. This is the small set to copy during a
  later migration or embed in another Svelte application; no generic framework.
- Put all authored chessboard page/navigation styles in a separate
  `src/lib/chessboard-examples/chessboard-examples.css`, including the current inline
  Debug segmented-button and chess.js status styles. Scope selectors under a chessboard
  example wrapper so embedding does not restyle the host's body, buttons or headings.
  Keep scaffold/Tailwind setup separate from these portable styles.
- Use a simple semantic navigation list with links and an active-page indication.
  Keep Kit-specific route resolution and current-page reads at the application boundary;
  pass links/current selection into the navigation component so it can be embedded.
  No menu framework; links should wrap and remain accessible.
- The layout integrates navigation, the example wrapper and stylesheet; the home page
  introduces/links the examples. Preserve board sizing and control behavior, allowing
  the deliberate navigation/layout adjustments and style isolation above.

## Target configuration and contracts

- Target stable Kit 3.x. The reference used Kit `3.1.0`; verify available compatible
  versions at execution time and record exact resolutions. Select a Kit 3-compatible
  adapter-auto using its actual peer requirements; do not copy adapter-static from the website.
- Kit 3 requires Node ≥22.17, TypeScript 6, Svelte ≥5.57.1, Vite ≥8.0.12 and
  vite-plugin-svelte 7. Existing non-Kit framework ranges already satisfy these minima.
  Keep compatible versions; align direct Playwright ranges with the already aligned lockfile.
- Move adapter and `compilerOptions` from `svelte.config.js` into `sveltekit` in
  `vite.config.ts`; remove the unsupported config. Preserve the runes function's
  `node_modules` exclusion, Tailwind plugins, `server.fs.allow`, and both Vitest projects.
- Add explicit package imports for `#lib` and `#lib/*`; replace `$lib` imports with
  explicit extensions, including `.svelte.js` for `use-board.svelte.ts`. Keep
  a library entry point if the bare alias is declared, and preserve real asset/component
  extensions; inspect relative imports too. Transfer helpers into the portable folder.
- Extend `$app/tsconfig`, explicitly include source, tests and configuration files,
  and preserve strict checking. Compare inherited DOM/lib settings before retaining
  the old custom `lib` override. If specifying `types`, include `$app/types` and Node.
- Remove ESLint's import/reference to the deleted Svelte config. Preserve Svelte parsing,
  project type information and existing rules; remove compatibility dependencies only
  if no longer consumed. Retain the Prettier Tailwind stylesheet setting.
- Update route IDs passed to `resolve` for the mapping above; preserve read-only
  `page.url.pathname` access.
  Do not strip leading slashes indiscriminately. No stores, forms, remote functions,
  service workers or server API migration is currently needed.
- Preserve `file:../..` and build the root library before example checks that resolve
  its public exports. Verify the example uses this checkout, without registry substitution
  or requiring global npm links. Do not port the website's postinstall/link helper.

## Implementation steps

### 1. Record reproducible baseline results

- [ ] Recheck branch, HEAD, instructions and user edits; preserve this plan and unrelated work.
- [ ] Inspect installed tooling and CLI help before scaffolding; record Node/npm and
      exact framework/test versions. Use a pinned `sv` version supporting Kit 3.
- [ ] Build the root library, then run the old example's check, lint and build. Verify
      chessboard behavior interactively; do not run its generated demo test suites.
      Record existing failures separately from migration regressions.
- [ ] Perform only a brief baseline visual sanity check, prioritizing Debug. The user
      explicitly reduced visual scope; no exhaustive screenshot matrix is required.
- [ ] Store local logs/screenshots under ignored `artifacts/`; keep baseline files unchanged.

### 2. Create and configure the sibling example

- [ ] Scaffold `examples/sveltekit` with the minimal TypeScript template and equivalent
      Prettier, ESLint, Vitest unit/component, Playwright and Tailwind forms/typography setup.
      Inspect destination collisions first; do not overwrite an existing user-created scaffold.
- [ ] Omit generated demo content, including test add-on examples; retain useful test
      configuration. Do not select the full demo template or port the old demo pages.
- [ ] Keep the scaffold inside the current Git repository. Preserve the example's private
      identity/version; avoid new generated AI instructions or unrelated add-ons.
- [ ] Apply the target configuration above and restore the three existing application
      dependencies. Resolve a consistent lockfile; ensure generated tooling does not
      downgrade the existing Vitest 5 stack without a demonstrated compatibility reason.
- [ ] Preserve `.npmrc`, ignore rules and `.vscode` settings/MCP setup; copy no generated
      output, caches, dependencies, secrets, local environment files or nested `.git`.

### 3. Port pages, helpers and assets

- [ ] Transfer only the chessboard components/helpers into the portable folder, create
      the seven numbered route wrappers and replace the root debug page with the index.
      Retain necessary app shell/types/assets; do not copy the old `src/` tree wholesale.
- [ ] Extract shared and inline chessboard CSS into the separate scoped stylesheet,
      and integrate the simple reusable navigation for all seven examples.
- [ ] Limit other application edits to required Kit 3 imports/configuration/API adjustments.
      Keep `useBoard`, setup callbacks, raw snapshots, custom extension order, timer
      cleanup and chess.js reset/version guard responsibilities unchanged.
- [ ] Retain Vitest unit/component and Playwright dependencies/configuration/scripts for
      future use, including local build/preview on port 4173. Exclude all old/generated
      demo specs and components; do not replace them with new automated tests or fixtures.
- [ ] Keep Tailwind, its Vite integration, forms/typography plugins and formatter support.
      Compare the sibling website's actual tooling configuration and reuse only relevant
      setup; do not import its product dependencies or automated website test suite.
- [ ] Run Svelte MCP autofixer on changed Svelte files, recheck corrections, and assess
      suggestions against migration scope rather than rewriting working interaction code.

### 4. Verify parity and finalize the directory replacement

- [ ] From a clean install, build the root library and verify the new example with
      format, lint, check and build. Verify the chessboard pages through interactive
      browser inspection; do not create/run automated example suites. Use existing browser
      tooling where available. Install/configure test packages without eagerly downloading
      test browsers solely for unused test runners.
- [ ] Perform a brief rendered sanity check, prioritizing `/0-debug` at desktop/mobile
      widths, basic controls and navigation. Smoke-open the remaining routes; avoid
      exhaustive state/viewport comparisons or pixel matching.
- [ ] Verify the new home index and all seven navigation links/order, including previously
      unlinked event/movability pages. Check that `/demo` and `/demo/playwright` are absent.
      Inspect stylesheet scoping for embedding without adding an automated fixture or demo route.
- [ ] Navigate away during polling or a pending computer move and return repeatedly;
      verify clean board remounts without duplicate updates, late moves or new errors.
- [ ] Record commands, results and baseline differences. Stop temporary servers/browser sessions.
- [ ] After parity passes, review the tracked deletion list and remove `examples/sveltekit-2-old`.
      Preserve user-local files; do not use unchecked recursive replacement/deletion.
- [ ] Repeat clean-install verification at the final path. Update the example README
      with root-build prerequisites, Kit 3 configuration, actual scripts and manual-check
      instructions. State that test tooling is installed for future use but no example
      automated tests are provided or required.
      Document numbered routes and which components/helpers/stylesheet to copy or embed.

### 5. Integrate CI and open the PR

- [ ] Preserve CI/Dependabot paths already pointing at `examples/sveltekit` and root
      release/coverage behavior. Do not add example test jobs, browser-install steps or
      automated manual-check scenarios to CI. Preserve existing required aggregate checks
      and root library validation; adjust integration only as required by the migration.
- [ ] Verify on the actual Node 22/24/26 matrix; Node 22 must be ≥22.17. Inspect the shared
      actions' actual commands before editing workflow integration. Keep root tooling scoped
      correctly; adjust root ignores only if evidence shows duplicate or invalid example checks.
- [ ] Run root format/lint/check/test/build and existing CI-equivalent coverage checks;
      use the example's own tooling for Svelte. Inspect the final diff for library source,
      export, release, version or unrelated formatting changes; none are intended.
- [ ] Do not add a library version bump solely for a private example migration. Preserve
      pending changesets and follow an explicit repository release requirement if discovered.
- [ ] Commit only task-owned changes, push the migration branch, and create a PR against
      the verified repository default branch. Include scope, validation, intentional route changes,
      type/config changes and any limitations. Do not use `scripts/push-update.sh`, which stages everything.
- [ ] Monitor CI at the latest PR SHA, fix migration regressions, and report the PR link
      and actual check results. Keep the PR open for the user's merge; no auto-merge or release.

## Completion criteria, risks and rollback

Complete when `examples/sveltekit` works with this checkout's built library after a clean
install, all seven chessboard examples and debug tools work at the numbered routes,
portable files/styles and simple navigation are in place, scaffold demos are absent,
the seven pages have been checked interactively, the old tracked example is removed,
and the PR's existing required checks pass. Vitest/Playwright/Tailwind tooling is installed
and configured; automated example tests are intentionally absent. A blocked or
unavailable check must be reported explicitly and remains unverified.

Primary risks are adapter/tooling peer compatibility, local package export resolution,
SSR/hydration differences, inherited TypeScript DOM types, timer cleanup, extracted CSS
losing component scoping or leaking into an embedding host, and root tooling
accidentally scanning two examples during the transition. Address these within example
configuration and manual verification first; library architecture and public contracts remain unchanged.
Cloudflare preview, production deployment and npm publication are outside this task.

Before final replacement, the old example remains the comparison source. After commits,
rollback uses a revert through the normal review flow, restoring the prior example path
and associated configuration without discarding later user changes.

## Execution log

### Setup: root instructions and browser tooling

- Preserved chessboard architecture instructions in the existing root AGENTS.md symlink
  target, docs/ai/chessboard-AGENTS.md, and added scoped SvelteKit/browser guidance.
- Copied both Playwright skill trees and Claude Svelte plugin settings; existing root
  Svelte MCP settings were already present. Added generated-skill formatting exclusions
  and ignored temporary Playwright output.
- Updated visual scope to the user's brief sanity-check requirement.
- Initial sandbox build compiled TypeScript but publint could not write the default npm
  cache. Network/npm operations use authorized execution outside the sandbox;
  no ownership or global npm configuration changes are needed.
