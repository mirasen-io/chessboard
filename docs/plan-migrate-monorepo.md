# Migration plan: `@mirasen/chessboard` + `@mirasen/react-chessboard` → npm-workspaces monorepo

> Status: **implementation complete on `migrate/monorepo`; PR #151 is open for owner review**. Both original histories are preserved. Updated 2026-11-02 after CI and the consolidated Quality Gate passed.
> Goal: consolidate core and React development and release workflows **while preserving both Git commit
> histories**, maintaining independent published package identities, and removing the manual cross-repository linking workflow.
> Companion doc: [`research-dependabot-monorepo-changesets.md`](./research-dependabot-monorepo-changesets.md)
> (Dependabot decision is FINAL — Outcome B; do not re-open it).

## 0. Decisions (current)

1. **Destination:** retain `mirasen-io/chessboard`. Do not touch either repository's `main` during preparation.
2. **Both Git histories must be preserved:** neither snapshot-only import nor squash/history rewrite. The React repository stays accessible for original GitHub releases/issues/PRs.
3. **Preparation branches:** `chessboard:migrate/monorepo` is the destination integration branch; prepare React moves on a separate dedicated branch from the current `react-chessboard/main`. Neither preparation branch is merged into its own `main` before integration.
4. **History-preserving integration:** the prepared React branch is merged into `migrate/monorepo` using a normal `--no-ff --allow-unrelated-histories` merge, without squash or history rewriting. The integration commit retains both original histories; canonical root workspace/workflow files come from core.
5. **Package folders:** `packages/chessboard` and `packages/react-chessboard`, corresponding exactly to npm names `@mirasen/chessboard` and `@mirasen/react-chessboard`. No artificial `core-` naming.
6. **Examples:** standalone root `examples/sveltekit`, `examples/colors`, `examples/react` (moved from React's `examples/app`), not workspace members.
7. **Package manager:** npm workspaces, private root orchestrator, single shared root lockfile, explicit members `["packages/chessboard", "packages/react-chessboard"]`. Package versions remain independent.
8. **Dependabot changesets:** attribute by changed `packages/*/package.json` manifests (companion research, Outcome B), not reported Dependabot directory.
9. **Git tags/releases:** both histories contain legacy unscoped `v*` tags; the React branch was fetched with `--no-tags`, so those tags were not imported. GitHub Releases do not move between GitHub repositories by merging commits. Validate package-specific future tag naming and React npm trusted publishing in the destination.
10. **Scope:** repository and release infrastructure migration only; no new Solid/Svelte adapters or unrelated features.
11. **Code quality and security analysis:** use one SonarQube Cloud project (`mirasen-io_chessboard`) and one scan for both packages. Keep independent package Vitest configurations and collect coverage from every Node.js matrix job through dynamically named artifacts. Use the existing single Socket.dev GitHub App integration for the consolidated repository.

**Do not pin current package versions in this plan.** Read `package.json`, lockfiles, Changesets and the current publication state from the actual branches at execution time. Historical version examples are not implementation baselines.

## 1. Workspace dependency semantics

- npm workspaces link local sibling packages into root `node_modules`, but the published internal dependency remains ordinary **semver** (not `workspace:*`).
- Verify the React package's **current** core dependency range satisfies the local core version before relying on local linking. If it does not, resolve explicitly during migration rather than silently falling back to registry resolution.
- React resolves core through its `exports` and built declarations: the orchestrator must build core before React checks/builds.
- For coordinated changes, include appropriate Changesets for both packages. Root Changesets versions and publishes affected packages in dependency order and updates internal ranges when required.
- For core-only changes, do not force a React release without a dependency-range or semantic reason; test how the installed Changesets version handles dependent changes.
- Keep independent versioning (`fixed: []`, `linked: []`) and the existing `updateInternalDependencies` policy. Use temporary, **non-publishing** changesets to test release orchestration before the first production publish.

## 2. Target structure

```text
chessboard/                           # existing GitHub destination
├── package.json                      # private npm-workspaces orchestrator
├── package-lock.json                 # shared workspace lockfile
├── README.md / LICENSE / AGENTS.md   # repository-wide
├── .changeset/                       # one shared configuration
├── .github/                           # one shared CI / release setup
├── .githooks/                        # one root hook configuration
├── docs/
├── examples/                         # standalone, not workspace members
│   ├── sveltekit/
│   ├── colors/
│   └── react/
└── packages/
    ├── chessboard/                   # @mirasen/chessboard
    │   ├── package.json
    │   ├── README.md / CHANGELOG.md / LICENSE
    │   ├── src/
    │   └── tests/
    └── react-chessboard/             # @mirasen/react-chessboard
        ├── package.json
        ├── README.md / CHANGELOG.md / LICENSE
        ├── src/
        └── tests/
```

Keep package-owned configuration, source, tests and published assets within each package; root configuration controls workspaces, workflows and releases. Root is private, never published.

**Preparation record:** the React preparation branch was not a second functioning monorepo. Its tracked package files were moved under `packages/react-chessboard/` and its React example to `examples/react/`. Temporary legacy root configs were staged under the package and consolidated after the history merge. The prepared React branch root contained only `packages/` and `examples/` trees; its transitional CI was not required to pass.

# PHASES (execution order)

## Phase 0A — ✅ DONE (2026-08-31) — PREREQUISITE: fix + test `dependabot-generate-changesets`

Rationale: the mis-attribution bug is **already live** in the single repo and must be fixed first, in
`kt-workflows/actions`, then verified, so the monorepo inherits a working automation.

**Verified existing bug (regression fixture):** commit `ae1574c` — _"dependabot: bump the minor-and-patch
group across 2 directories with 6 updates (#126)"_ — was a grouped update spanning `/` + `/examples/sveltekit`.
The old action (root `directory` fallback → root `package.json` name) generates a `@mirasen/chessboard`
changeset even when only the SvelteKit example's deps changed. The whole `#111–#128` "across 2 directories"
series has the same defect. Post-fix, such a PR (only `examples/**` + root lock changed, no
`packages/*/package.json`) must yield **NO changeset**.

**Attribution rule (FINAL — locally verified against changesets v3.0.1):** one changeset per Dependabot PR,
listing every discovered project package whose `package.json` changed, each `: patch`. Determined **purely from
changed manifests** — the lockfile is ignored, no dependency-graph/arborist analysis, no per-dependency loop, and
**no `private` check** (what actually versions/tags/publishes is decided by the repo's `.changeset/config.json`).

1. Rewrite the generator:
   - Inputs: `pr-number` + `token`. **Remove** `updated-dependencies-json` and `version-update-map`. **Drop** the
     dead `if: steps.find-comment.outputs.comment-id == ''` gate.
   - Retrieve changed files with **`gh api --paginate repos/$OWNER/$REPO/pulls/$PR/files --jq '.[].filename'`**
     (guaranteed full pagination). Do NOT use `gh pr view --json files` — it is GraphQL `files(first:100)` with no
     auto-pagination (fine for tiny PRs, but the shared action must be correct for any repo).
   - **Discover project packages from root `package.json`** (shared action → must handle every shape):
     - has `workspaces` (array **or** `{ "packages": [...] }`): expand entries → member dirs — explicit paths
       (`packages/chessboard`), globs (`packages/*` → `readdirSync`), and `.` (root-as-member). Each dir with a
       `package.json` is a member. The orchestrator root is **not** a member unless `.` is listed.
     - no `workspaces`: the single package **is** the root (`.`).
     - Normalize `.` → manifest path `package.json` (strip `./`) so it matches `gh api` output (azure-swa's `["."]`).
   - `AFFECTED` = `name` (read from the manifest) of every discovered package whose `<dir>/package.json` is in the
     changed-files list. No `private` filter. (Verified: emitting only discovered-package names never trips
     changesets' `Found changeset … not in the workspace` error; targeting the **orchestrator root** — a non-member —
     _does_ error and leaves a **stuck** changeset, so the root is never emitted. A **private member** targets fine:
     it versions and the changeset is consumed; tag/npm are governed by the repo's `privatePackages`/`ignore` config.)
   - Deterministic filename — **keep the `~` prefix** so Dependabot entries sort last in each CHANGELOG:
     `FILE=.changeset/~dependabot-pr-<PR>.md`. Compute it **before** branching on `AFFECTED`.
   - `AFFECTED` empty (lockfile-only / examples-only / root-tooling-only) → **`rm -f "$FILE"`** (delete any stale
     changeset from an earlier run) + emit `changesets-json=[]`. Else → write **one** changeset to `FILE`, each
     affected package `: patch`, body `dependabot: dependency updates for PR #<PR>` (keeps the `dependabot:` marker
     so `dependabot-auto-release` still detects it) + emit `changesets-json=["<FILE>"]`.
   - Commit step stages with **`git add -A .changeset`** (so a **deletion** is committed too). Idempotent in all
     directions: `A→A` · `A→A+B` · `A+B→B` · `A→none` (stale deleted) · `none→A`.
2. `dependabot-auto-merge`: pass `pr-number` (+ owner/repo/token) to the generator instead of
   `updated-dependencies-json`; keep `fetch-metadata` for the minor/patch **merge** gate (orthogonal to attribution).
3. **Prerequisite — `versioning-strategy: increase` in every consuming repo's `dependabot.yml`.** Because attribution
   is by changed **manifest**, an in-range direct bump that touches only the lockfile would otherwise produce no
   changeset (no release). `increase` makes Dependabot raise the declared range on every direct update, so the
   manifest always changes and the update is attributable. Roll this out to **all** active consumers **before** the
   action lands on `@main` (cloudflare-site is already app→`increase`; public libs need it explicit). Without it, a
   single-package library silently stops releasing on the common in-range case.
4. Keep ignoring internal packages in each repo's `dependabot.yml` (`@mirasen/chessboard`, `@mirasen/react-chessboard`)
   — Changesets owns the internal range; also redundant given the cross-bump behaviour (§1).
5. Test on live consumers before the migration (diverse canaries — see §Phase 16): **cloudflare-site** (single
   private, daily, `~` in prod), **npm-typescript-template** (single public), **svelte-adapter-azure-swa**
   (`workspaces: [".","tests/demo","tests/new-demo"]` — exercises `.`-normalization + a private member), **license-gate**.
   Cover idempotency directions `A→A`, `A→A+B`, `A+B→B`, `A→none` (stale deleted), `none→A`.

**Transition note:** repos carry pending old-scheme changesets (`~<PR>-<pkg>-<dep>.md`); these are valid and get
consumed on the next release. New PRs use `~dependabot-pr-<PR>.md`. If an old PR is **rebased** after the action lands,
its old files remain and a new deterministic file is added → a duplicate changeset for that PR (both `patch`,
aggregated → harmless). No manual cleanup needed.

`dependabot-auto-release`, `npm-release`, `create-github-app-token`, `get-associated-pr` — **no change**
(verified). `npm-release-upd-pkg-lock`, `major-release-tag` — **not referenced anywhere** (grep-confirmed), ignore.

**Completed (2026-08-31):**

- `versioning-strategy: increase` added to `dependabot.yml` in 7 active consumers: `cloudflare-site`, `license-gate`, `npm-typescript-template`, `digraph-js`, `typesafe-utilities`, `svelte-adapter-azure-swa`, `assert`.
- `kt-workflows/actions/dependabot-generate-changesets` — rewritten (commit `5fa8e77`): manifest-based attribution, `~dependabot-pr-<PR>.md`, no directory-based logic, single quotes in frontmatter.
- `kt-workflows/actions/dependabot-auto-merge` — updated (commit `a0e9bee`): `pr-number` wiring, `git add -A .changeset`.
- **Verified on live PRs:** single-package (`license-gate` #30 — CI green), multi-workspace with `.` and explicit paths (`svelte-adapter-azure-swa` #262–#267 — all changesets correct, per-manifest attribution verified).

## Phase 0B — ✅ DONE (2026-08-31): shared `npm-ci-sonar` root/base-directory support

Verified: `kt-workflows/actions/npm-ci-sonar` runs `sonarsource/sonarqube-scan-action@v7` **with no
`projectBaseDir`** (no `with:` at all) — it scans the repo root by default. Its `working-directory` input only
affects the npm run-script, not the scanner. The selected architecture uses one root-level scan for both packages;
the optional base-directory input remains available for consumers that need it:

1. Add an input `project-base-dir` (default `.`) to `npm-ci-sonar`.
2. Pass it to the scan step: `sonarsource/sonarqube-scan-action@v7` with `projectBaseDir: ${{ inputs.project-base-dir }}`.
3. Keep `working-directory` for npm commands — do NOT overload its meaning. The monorepo uses the default root scan.

This was a separate concern from the Dependabot fix (Phase 0A) and was completed before the monorepo CI was configured.

**Completed (2026-08-31):** `project-base-dir` input (default `.`) added to `npm-ci-sonar/action.yml`; passed to `sonarsource/sonarqube-scan-action@v7` as `projectBaseDir`. Commit `ef4ae8a`. All existing consumers unchanged (default `.`).

## Phase 0C — Previously completed: Snyk token prerequisite

The historical shared tooling and secrets setup is recorded below. Revalidate it when running the migrated CI; prior completion is not evidence the new workspace CI has passed.

## Phase 1 — Branch preparation and current baselines — complete

The latest destination `main` commit at preflight (`9e8a4bec`) was already an ancestor of `migrate/monorepo`; no main changes were needed. React preparation commit `f7a4d3e` was fetched with `--no-tags` and merged by the two-parent integration commit recorded in Phase 4. The package versions, manifests, lockfiles, workflows, and Changesets queue were inspected before integration. No pending Changesets were present. PR #151 is the review and CI gate; neither repository's `main` was changed during implementation.

## Phase 2 — Scaffold the workspace root — complete

1. Root `package.json` — **private orchestrator** (not published):
   ```jsonc
   {
   	"name": "mirasen-chessboard-workspace",
   	"private": true,
   	"type": "module",
   	"workspaces": ["packages/chessboard", "packages/react-chessboard"],
   	"engines": {/* determine from the current package/CI compatibility baseline */},
   	"scripts": {/* §Phase 6 */},
   	"devDependencies": {/* split rationale below */}
   }
   ```
2. **devDependency split (rationale):**
   - **Root (repo-wide orchestration + cross-cutting lint/format):** `@changesets/cli`, `prettier`,
     `eslint`, `@eslint/js`, `@eslint/compat`, `typescript-eslint`, `eslint-config-prettier`, `globals`.
     These drive root `format`/`lint`/`changeset:*` across all packages.
   - **Per package (keep in each `packages/*/package.json` so each builds/tests independently and its
     manifest is self-describing):** `typescript`, `vitest`, `@vitest/coverage-v8`, `jsdom`, `rimraf`,
     `publint`, plus package-unique runtime/dev deps (core: `chess.js`, `es-toolkit`, `type-fest`,
     `@ktarmyshov/assert`; React: `react`, `react-dom`, `@types/react*`, `@testing-library/react`).
   - Principle: build-critical tooling stays visible in the package that needs it (no "works only by
     hoist accident"); truly repo-wide tooling is hoisted once. npm dedupes either way.
3. Root config: single `.prettierrc`, `.prettierignore`, `.npmrc` (`engine-strict=true`),
   `eslint.config.js` (root flat config linting all packages). **Do NOT promote `tsconfig.base.json` to root** — it stays inside `packages/chessboard/` (core's `tsconfig.json` extends `./tsconfig.base.json`; moving it up would break that relative path). No TypeScript-config redesign in this migration; a shared root tsconfig can be a separate cleanup later if ever needed.
4. **Root `README.md` + `LICENSE`** (NEW): README describes the platform + both packages; LICENSE = MIT.

## Phase 3 — Move core into `packages/chessboard` (`git mv`, history-preserving) — complete

1. `git mv` core content into `packages/chessboard/`: `src/`, `tests/`, `package.json`,
   `tsconfig.base.json`, `tsconfig.json`, `tsconfig-release.json`, `tsconfig-test.json`, `vitest.config.ts`, `assets/`,
   `openspec/`, `README.md`, `CHANGELOG.md`, and `LICENSE`. Keep core's package-relative tsconfig (`rootDir ./src`, `outDir ./dist`) as-is. SonarQube configuration is repository-level and covers both packages.
   - `docs/` and `AGENTS.md`: keep at **repo root** (repo-wide), not under the package.
2. **DELETE the legacy npm-link workflow (not optional):** remove core's
   `"prepare": "bash ./scripts/npm-link.sh"` script entry AND delete `scripts/npm-link.sh`. Workspace
   symlinking is the sole local-linking mechanism now. Remove any doc/README mention of `npm link`.
3. Remove core's `changeset:version`/`changeset:publish` from the package (root-driven now); keep
   `build`, `build:release`, `test`, `coverage`, `lint`, `check`, `check:test`, `prepack` (publint).
4. `.githooks/` → do NOT move under the package (see Phase 9).

## Phase 4 — React preparation branch and history-preserving merge — complete

React was prepared on `mirasen-io/react-chessboard:migrate/monorepo` at
`f7a4d3e21ccc31c43cecbc46670eb34b6d80d959`, with package content under `packages/react-chessboard/` and its
example under `examples/react/`. The destination fetched that branch with `--no-tags` and merged it into
`migrate/monorepo` using `git merge --no-ff --allow-unrelated-histories`. The integration commit is
`d0e1701799afb163e7bcc23dedeae66f01816693`; its first parent is the prepared core history and its second
parent is the prepared React history. The merge had no file conflicts. No React tags were imported.

After integration, canonical repository automation and Changesets configuration were retained from the core
repository. Redundant staged React root configuration and the obsolete npm-link script were removed; React package
source, tests, package metadata, documentation and the standalone example were preserved. Any pending React
changesets were to be preserved, but the prepared branch contained none.

## Phase 5 — Workspace-linking checkpoint — complete

Root `npm ci` and `npm ls` pass; npm links both workspaces to their local package directories. Ordered core-then-React builds and React tests pass.

## Phase 6 — Root scripts & build order — complete

React's `tsc` resolves `@mirasen/chessboard` via `exports` → core `dist/*.d.ts`, so **core must build
first** (verified: bare specifier, nodenext, exports→dist; not raw-source). Explicit order — no bare
`--workspaces` for build:

```jsonc
{
	"build:core": "npm run build -w @mirasen/chessboard",
	"build": "npm run build -w @mirasen/chessboard && npm run build -w @mirasen/react-chessboard",
	"build:release": "npm run build:release -w @mirasen/chessboard && npm run build:release -w @mirasen/react-chessboard",
	"check": "npm run build:core && npm run check --workspaces --if-present",
	"test": "npm run build:core && npm run test --workspaces --if-present",
	"coverage": "npm run build:core && npm run coverage --workspaces --if-present",
	"lint": "prettier --check . && eslint .",
	"format": "prettier --write .",
	"changeset:version": "changeset version && npm install && npm run format && git add --all",
	"changeset:publish": "changeset publish"
}
```

`changeset:version` regenerates the root lockfile via `npm install` (this is why
`npm-release-upd-pkg-lock` is unnecessary).

**Self-contained after a clean `npm ci` (required invariant):** after a fresh install
`packages/chessboard/dist` does not exist, and React's `check:test` (tsc) resolves `@mirasen/chessboard`
via `exports`→`dist`. So `check`/`test`/`coverage` each run `build:core` first — a fresh
`npm ci && npm run check` (and `test`/`coverage`) works with no separate build step, matching what
`npm-ci-check` and `.githooks/pre-push` do by default. Core's own tests/coverage read `../src` (no dist
needed); only React needs core `dist` d.ts, which `build:core` provides, and React is not rebuilt for
coverage (vitest runs on `src`). CI test jobs run `npm run coverage` to produce both package reports. The Sonar
job consumes those matrix artifacts, clean-installs the root and standalone examples, then runs `npm run check`
and the SvelteKit check before scanning so all TypeScript dependencies and generated Kit configuration are
available without a separate build command.

## Phase 7 — Repository metadata (both packages) — complete

Keep npm names unchanged, but point both publishable package manifests to the consolidated repository using `repository.directory`:

```jsonc
// packages/chessboard/package.json
"repository": {
  "type": "git",
  "url": "git+https://github.com/mirasen-io/chessboard.git",
  "directory": "packages/chessboard"
}
// packages/react-chessboard/package.json
"repository": {
  "type": "git",
  "url": "git+https://github.com/mirasen-io/chessboard.git",
  "directory": "packages/react-chessboard"
}
```

- Set React `repository.url` and `bugs.url` to the consolidated GitHub repository.
- Preserve **current** published-package homepage URLs pointing to the working Worker origin; do not restore obsolete `mirasen.io` canonical links from the historical plan.
- Keep npm package names, exported API, license, peer dependencies and actual package versions unchanged unless the migration requires an explicitly justified release.
- Use lowercase `mirasen` author branding. Verify per-package README, LICENSE and `files` metadata from the **current** manifests, then include CHANGELOG in the React npm tarball only if that is the intended package policy.

## Phase 8 — Examples (top-level, standalone) — complete

`examples/sveltekit`, `examples/colors`, and `examples/react` are top-level, standalone projects with their own lockfiles. The React example is already in `examples/react` after the React preparation branch's tracked move; **do not import it a second time**.

1. Validate the current `file:` dependencies and change their relative paths to:
   - `examples/sveltekit`: `"@mirasen/chessboard": "file:../../packages/chessboard"`.
   - `examples/react`: `"@mirasen/react-chessboard": "file:../../packages/react-chessboard"`.
2. Regenerate each standalone example's lockfile after `file:` path updates, and verify a fresh example install/build.
3. Verify Vite `server.fs.allow` relative to the example's current working directory; remove obsolete extra paths without breaking module resolution.
4. Keep `examples/*` outside npm `workspaces`. In CI, preserve working SvelteKit example checks and decide explicitly whether to add React example build coverage. Check any current path references instead of assuming the old `examples/app` location still exists.

## Phase 9 — `.githooks` at repo root — complete

Verified: `.githooks/pre-push` runs `npm ci && npm run check && npm run lint`; **`core.hooksPath` is NOT
configured anywhere** (git config, package.json, CI) — the hook is opt-in only.

1. Keep one `.githooks/` at repository root (core's). The React preparation branch temporarily parks its legacy hook under `packages/react-chessboard/.githooks/`; remove that redundant copy after the history merge. Confirm root hook behavior against the new workspace scripts.
2. `pre-push`'s `npm ci && npm run check && npm run lint` now works **self-contained**: root `check` runs
   `build:core` first (Phase 6), so React's typecheck resolves core `dist` after a clean install. No change
   to the hook body is needed beyond confirming it calls the root workspace scripts.
3. Since nothing auto-sets `hooksPath`, no wiring change is required; document `git config core.hooksPath .githooks`
   in root `CONTRIBUTING.md` for contributors who want it.

## Phase 10 — Changesets consolidation — complete

- Use one shared root `.changeset/config.json` (from core), keeping independent package versions (`fixed: []`, `linked: []`) and current changelog generation.
- After the history merge, remove React's **nested staged** `.changeset/config.json`. Migrate any real pending React changeset files into the root queue without duplicating or discarding release intent.
- Keep per-package `CHANGELOG.md` inside `packages/chessboard` and `packages/react-chessboard`. Root `changeset version` / `changeset publish` run for both packages.
- The directory restructure alone should not cause a release. Confirm the live root Changesets queue and existing Version Packages PRs are clear (or handled deliberately) before final PR merge.
- Use temporary **non-publishing** Changesets to verify independent and coordinated package versioning, then restore the pre-test working tree.

## Phase 11 — Workflows consolidation (single `.github/workflows/`) — complete

Use core's workflows (repo stays `mirasen-io/chessboard` → all `github.repository` guards remain TRUE;
no guard edits). Drop React's copies.

- **`ci.yml`**: the clean-checkout workspace and standalone-example installation, build, check, coverage, and artifact paths pass on PR #151. Each Node.js matrix job uploads both packages' native root-relative LCOV reports in a dynamically named artifact; the single Sonar scan verifies and imports every artifact. The Sonar shared action installs the root and both examples when its cache misses and runs the existing SvelteKit `check` command after cache restore so generated Kit configuration is present on every scan.
- **`snyk` job (NEW):** add a Snyk dependency-scan job (see §Security integrations) —
  `snyk/actions/node@master` with `SNYK_TOKEN`, `args: --all-projects --detection-depth=2 --exclude=examples`,
  after root `npm ci`, parallel to `check`/`test`, no `npm run build` needed.
- **`release.yml`**: uses the core workflow at the workspace root. The shared `npm-release@main` wrapper has been checked against Changesets action v2 outputs and package-qualified tag events; it handles both independently versioned packages without making the private root a workspace member. No real release was run.
- **`auto-merge.yml`**: unchanged in wiring; correctness now comes from the Phase 0A action rewrite.
- **`auto-release.yml`**: preserve the existing monthly Dependabot-only release policy; verify it works for either package and does not trigger an immediate migration release.
- **`codeql.yml`, `contribution-reset.yml`, `contribution-update.yml`**: keep core's `main`/`contribution` branch model. Open the migration PR after implementation; PR CI is the full integration gate.
- Re-audit `working-directory`, `paths:`, `cd`, `--prefix` and `cache-dependency-path` after restructuring: old single-package audits do not prove new workspace paths are correct. Keep working SvelteKit paths where still valid.
  Cache actions default `cache-dependency-path: **/package-lock.json`. The repo will have **multiple**
  lockfiles by design — one root workspace `package-lock.json` plus each standalone example's own
  (`examples/sveltekit/`, `examples/react/`). Workspace packages share the single root lockfile; the `**`
  glob hashes root + example lockfiles together, so changing an example lockfile may invalidate the cache —
  acceptable, not a blocker.

## Phase 12 — `.github/dependabot.yml` — complete

Adopt the accepted config (research report). Note attribution no longer depends on this matching workspaces:

```yaml
version: 2
updates:
  - package-ecosystem: 'npm'
    directories: ['/', '/packages/*'] # examples/* optionally added as their own scope (they have own lockfiles)
    schedule: { interval: 'weekly', time: '03:18', timezone: 'Europe/Berlin' }
    versioning-strategy: increase
    open-pull-requests-limit: 10
    groups:
      minor-and-patch: { patterns: ['*'], update-types: ['minor', 'patch'] }
      major: { patterns: ['*'], update-types: ['major'], group-by: dependency-name }
    ignore:
      - dependency-name: '@mirasen/chessboard' # internal — Changesets owns it
      - dependency-name: '@mirasen/react-chessboard'
      - dependency-name: 'npm'
        versions: ['<10.0.0', '>=11.0.0']
    commit-message: { prefix: 'dependabot', prefix-development: 'dependabot' }
  # Optional standalone example scopes (own lockfiles); preserve current example tracking if appropriate:
  # - package-ecosystem: "npm"
  #   directories: ["/examples/sveltekit", "/examples/react"]
  #   ... (own group/ignore) ...
```

## Phase 13 — One SonarQube Cloud project and dynamic coverage collection — complete

**Updated final decision:** retain only the existing core project, `mirasen-io_chessboard`, and analyze both
publishable packages in one root-level scan. Do not use or recreate `mirasen-io_react-chessboard`.

1. Keep one root `sonar-project.properties` with both package source trees and test trees. Exclude standalone
   examples, generated `dist` and coverage output, dependencies, and other irrelevant files. Package source and
   test files remain scoped by the explicit `sonar.sources` and `sonar.tests` paths.
2. Keep independent `vitest.config.ts`, test suites, coverage configuration, and generated coverage directories
   inside each package. Do not create a root Vitest configuration.
3. Every Node.js matrix test job runs `npm run coverage`, producing one LCOV report per package. Upload both
   reports in one artifact named `coverage-node-${{ matrix.node-version }}`. The artifact name is derived from
   the matrix value; do not list Node versions in the workflow or Sonar configuration.
4. The Sonar job downloads every artifact matching `coverage-node-*` without merging artifact directories, so
   each report remains at a unique path. The root Sonar configuration imports all LCOV reports below
   `coverage-reports/**/packages/chessboard/coverage-test/lcov.info` and
   `coverage-reports/**/packages/react-chessboard/coverage-test/lcov.info`. For the current three-version matrix this yields six LCOV files; matrix changes require
   no coverage or scanner configuration edits.
5. Each package's Vitest V8 LCOV reporter uses its supported `projectRoot` option to write monorepo-relative
   `SF:packages/<name>/src/...` paths directly. A local experiment with the installed Vitest 5.0.5 generated
   the same source mapping and coverage statistics as the former path rewrite, so CI no longer edits LCOV files.
   SonarJS processes all six reports in one sensor run: execution counts are
   summed per source line while source lines remain unique, and branch records are normalized and deduplicated
   across reports. Repeated matrix runs of the same tests therefore do not multiply lines-to-cover or inflate the
   coverage percentage. The CI job checks that every dynamic artifact contains both reports. The completed PR
   analysis imported six LCOV reports and passed the Quality Gate with 94.8% coverage on new code.
6. Run one `npm-ci-sonar` action from the repository root for project `mirasen-io_chessboard`. Clean-install the
   root workspaces and both standalone examples on cache misses. On cache hits, always run the root workspace check
   and `npm --prefix examples/sveltekit run check`; the latter synchronizes SvelteKit's generated tsconfig before
   scanning, independently of the npm install lifecycle. Keep automatic TypeScript configuration discovery.
   The completed scan passed and indexed both package source trees; standalone examples remain excluded as sources.
7. After the consolidated analysis is verified, the owner may retire the obsolete React SonarQube Cloud project and any duplicate Socket.dev integration. The migration must not delete external projects or alter GitHub App settings.

## Security integrations — Socket.dev (App) · Snyk (CI/CLI) · SonarQube Cloud

**FINAL model (do not reopen):**

```
Socket.dev → GitHub App only        (no CLI, no CI job)
Snyk       → GitHub Actions / CLI    (workspace-aware scan from monorepo root)
SonarQube → one existing project, one scan for both packages (Phase 13)
```

Verified **in repository source**: no `socket.yml`/`.socket.yml`; no `.snyk`; no Snyk workflow/action; no
in-repo `SNYK_TOKEN` reference; no related README badge/config. Repository source **cannot** prove whether an
Actions or Dependabot secret named `SNYK_TOKEN` already exists in GitHub settings. Consequence: the Snyk→CI
move adds a new workflow job and requires `SNYK_TOKEN` to be available in **both** the Actions and Dependabot
secret contexts — reuse existing repo/org secrets where available, otherwise **create them manually via the
GitHub Web UI** (secrets are created by a maintainer in the UI; the CLI is used only to verify, never to create).

### Socket.dev — GitHub App only. No CLI. No CI migration.

`Socket.dev requires no CI migration. Post-migration verification only.`

- Keep the GitHub App enabled on `mirasen-io/chessboard`. Do **not** add Socket CLI, a Socket Actions job,
  or manually-created Socket projects. No `socket.yml` exists — do **not** create monorepo-specific config
  if default discovery works.
- **Post-migration verification (no code change):** confirm Socket sees root `package.json` + root
  `package-lock.json` + `packages/chessboard/package.json` + `packages/react-chessboard/package.json`; on the
  first dependency PR the Socket status check runs and reflects both core and React dependency changes; the
  internal edge `@mirasen/react-chessboard → @mirasen/chessboard` is not mis-interpreted; standalone
  `examples/*` stay under default discovery only if they already are. If a Socket config file later appears,
  fix its paths after relocation.

### Snyk — GitHub Actions / Snyk CLI from monorepo root (workspace-aware)

`GitHub Actions / CLI from monorepo root. Workspace-aware dependency scan.`

- **Auth (`SNYK_TOKEN`) — must exist in TWO secret stores.** Per GitHub docs, _"when a Dependabot event
  triggers a workflow, the only secrets available to the workflow are Dependabot secrets. GitHub Actions
  secrets are not available"_ — and CI also runs on Dependabot PRs (they feed the auto-merge/auto-release
  flow). So `SNYK_TOKEN` must be present as **both** an **Actions** secret (normal PRs) and a **Dependabot**
  secret (Dependabot PRs). Same name → the workflow stays `env: { SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }} }`
  unchanged; each trigger resolves it from its own store. Repository source cannot prove a secret exists.
  **Create `SNYK_TOKEN` manually via the GitHub Web UI** — Settings → Secrets and variables → **Actions**,
  and Settings → Secrets and variables → **Dependabot** — do **not** create secrets via CLI. Reuse an existing
  repo/org value if present. Use the CLI **only to verify** presence in both stores:
  ```bash
  gh secret list --app actions       # expect SNYK_TOKEN listed
  gh secret list --app dependabot     # expect SNYK_TOKEN listed
  ```
  (An existing organization-level secret covering this repo may be reused instead of a repo-level secret.)
- **Method / exact command** (official `snyk/actions/node@master`; inputs verified: `command` default `test`,
  `args`, `json`):
  ```yaml
  - name: Snyk dependency scan
    uses: snyk/actions/node@master
    env: { SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }} }
    with:
      command: test        # point-in-time; NOT monitor
      args: --all-projects --detection-depth=2 --exclude=examples
  ```
  `--all-projects` is Snyk's documented mechanism to "auto-detect all projects in the working directory"
  (the monorepo / multi-manifest scan mode); `--detection-depth=2` reaches `packages/*/package.json`, and
  `--exclude=examples` drops the standalone example apps. Per the docs, `--exclude` takes comma-separated
  **basenames** and **cannot include a path** — so it is `examples`, not `examples/*`. Runs after a single
  root `npm ci`; do **not** install separately inside the packages — they share the root lockfile.
- **`test` vs `monitor` (Free-plan sizing, source-backed):** `snyk test` is point-in-time and does **not**
  create a persistent Snyk Project; only `snyk monitor` creates/updates a dashboard Project (per the
  `snyk/actions` README). The Snyk **Free plan** allows **200 Open Source (SCA) tests/month and 5 Projects**
  (snyk.io/plans, Aug 2026); because we use `test` only, **no Projects are created**, so the 5-Project cap is
  irrelevant — only the 200 tests/month applies (one scan per PR/push, comfortably within budget at this
  repo's volume; Snyk also runs a free program for open-source maintainers if more is ever needed).
  **Do NOT add `snyk monitor`** — we need a CI gate, not a dashboard/history migration; that is a separate
  later task if ever wanted.
- **Project scope:** the two publishable packages (`@mirasen/chessboard`, `@mirasen/react-chessboard`). Root
  is a private orchestrator; standalone `examples/*` are excluded via `--exclude=examples` so they never become
  separate Snyk targets.
- **PR check behavior:** `snyk/actions` fails the job by default on findings → the GitHub check fails,
  acting as the dependency-change security gate. **Preserve current policy:** if the Snyk check is currently
  required in branch protection, keep it required; if advisory, add `continue-on-error: true`. Do not silently
  change the gate during migration.
- **Severity/policy:** no `.snyk` file exists (verified) — nothing to relocate. Preserve org-level
  policy/threshold; do not raise/lower it as part of the migration. Any future `.snyk` keeps package-relative paths.
- **Internal workspace edge:** external deps of both core and React must be analyzed; the internal
  `@mirasen/react-chessboard → @mirasen/chessboard` edge must not double-count/break the graph, and the
  published core version must not override the local workspace interpretation during the scan. Do **not** add
  an ignore for the internal package unless a proven mis-scan appears.
- **Workflow location:** a dedicated **`snyk` job in `ci.yml`** (it is a per-PR security gate → belongs with
  the required checks), parallel to `check`/`test` after the shared install/setup. Needs `npm ci` at root but
  **not** `npm run build` (Open Source scanning analyzes the dependency graph, not build output).

### Prerequisite ordering

- **Phase 0A** — fix `dependabot-generate-changesets` (before migration).
- **Phase 0B** — add `npm-ci-sonar` `project-base-dir` support (before CI/Sonar merge).
- **Phase 0C / CI prerequisite** —
  1. Wire the Snyk job into `ci.yml`.
  2. Create `SNYK_TOKEN` for ordinary Actions workflows in the **Actions** secret store — **manually via the
     GitHub Web UI** (Settings → Secrets and variables → Actions).
  3. Create `SNYK_TOKEN` for Dependabot-triggered workflows in the **Dependabot** secret store — **manually via
     the Web UI** (Settings → Secrets and variables → Dependabot).
  4. Reuse an existing repo/org value if already configured. Confirm both are present via CLI (verify only, do
     not create): `gh secret list --app actions` and `gh secret list --app dependabot`.
  5. Verify runs: a normal (non-Dependabot) PR → Snyk succeeds; a Dependabot PR → Snyk receives the token and succeeds.

  **Completed (2026-08-31):** `kt-workflows/actions/npm-ci-snyk` action created (commit `c2ceb0b`). `SNYK_TOKEN` org secret created in Actions + Dependabot stores for both `mirasen-io` and `kt-npm-modules` orgs, visibility `ALL`. Verified via CLI.

  This is a **prerequisite for Dependabot auto-merge**, not optional hardening: a missing Dependabot
  `SNYK_TOKEN` would leave the required Snyk check red on every Dependabot PR and therefore **stop the
  Dependabot auto-merge / auto-release flow**. Do not consider the monorepo CI ready until Snyk passes on a
  Dependabot PR. (The Snyk job must not introduce an authentication-only failure on Dependabot PRs.)

- **Socket.dev** — no prerequisite code change; verification only.

### Security verification matrix (first post-migration PRs; use a temp branch/fixture, never a permanent vulnerable dep)

| Scenario                         | Socket (App)             | Snyk (CI/CLI)                                                                                                           |
| -------------------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| Core dep patch                   | App status check detects | root scan detects                                                                                                       |
| React dep patch                  | App detects              | root scan detects                                                                                                       |
| Both packages changed            | one repo check           | one workspace scan covers both                                                                                          |
| Root tooling dep change          | handled normally         | no false per-package project                                                                                            |
| Internal React→core edge         | not mis-interpreted      | valid workspace graph, no double-count                                                                                  |
| Lockfile-only update             | status check runs        | root lockfile analyzed                                                                                                  |
| Example-only update              | default App behavior     | excluded (`--exclude=examples`)                                                                                         |
| Known-vuln fixture (temp branch) | finding appears          | CI fails per current policy                                                                                             |
| Normal (non-Dependabot) PR       | existing App behavior    | Actions `SNYK_TOKEN` available; scan succeeds                                                                           |
| Dependabot PR                    | App status works         | Dependabot `SNYK_TOKEN` available; scan succeeds — a missing Dependabot token would fail auth-only and block auto-merge |

**First Snyk CI run must confirm (then the configuration is final):**

1. `@mirasen/chessboard` is detected;
2. `@mirasen/react-chessboard` is detected;
3. the shared root `package-lock.json` is used/resolved correctly for both;
4. `examples/*` are excluded from the scan;
5. the internal `@mirasen/react-chessboard → @mirasen/chessboard` workspace edge does not break or
   double-count the graph;
6. no out-of-sync warning occurs;
7. the expected GitHub check status is produced;
8. a normal (non-Dependabot) PR receives `SNYK_TOKEN` (Actions secret) and the scan succeeds;
9. a Dependabot PR receives `SNYK_TOKEN` (Dependabot secret) and the scan succeeds — no auth-only failure that
   would block auto-merge.

**Runtime contingency (NOT default config):** `--all-projects` is the documented multi-manifest/monorepo scan
mode; the CLI docs name Yarn workspaces explicitly and do not separately document npm-workspace resolution, so
#3/#6 above are the only runtime-dependent points. If — and only if — the first real run shows a concrete
shared-root-lockfile out-of-sync issue, investigate, confirm against current Snyk docs, then add
`--strict-out-of-sync=false` if justified. Do not add it (or any other workaround) pre-emptively.

## Phase 14 — Pre-release dry-run checklist — migration verification complete; still applies before first release

```bash
npm ci
npm ls                        # confirm both workspaces link locally
npm run build                 # ordered core -> React
npm test
npm run check
npm run lint
npm pack --workspace @mirasen/chessboard
npm pack --workspace @mirasen/react-chessboard
```

Check each tarball for its own `dist/`, assets if applicable, README, LICENSE, CHANGELOG if intended, correct exports and publishable semver dependency ranges; no tests/examples/monorepo-only files.

**Changesets rehearsal (no publish):** create temporary changesets for core-only, React-only and coordinated releases. Run root `changeset version`, verify the relative version changes, root lockfile, internal dependency range, changelogs and intended package-qualified tag behavior. Reset all version/lock/changelog changes and remove the temporary changesets afterward.

**History and CI checkpoint:** check that Git history includes both original graphs, every expected folder exists, no nested redundant React CI configuration remains, and the final migration PR passes current CI, CodeQL, the single SonarQube Quality Gate, Snyk and Socket checks. Never publish while testing the migration.

## Phase 15 — First release from the monorepo

1. The final migration merge into `chessboard/main` should be **release-neutral if no pending changesets exist**. Recheck the actual queue and any Version Packages PRs immediately beforehand; do not rely on the historical assumption of an empty queue.
2. The history-preserving React merge is complete on the preparation branch. The owner decides when to merge the validated final migration PR; the implementation agent must not merge it.
3. Before the first **intentional** npm publication from the monorepo, configure and verify trusted publishing/provenance for **both** existing npm packages and the new source repository. React's existing trusted-publishing setup does not transfer through Git history alone.
4. Changesets CLI 3.0.3 `publish` emits package-qualified tag events for packages it successfully publishes; `changesets/action@v2` consumes those events to push matching tags and create package GitHub Releases. Its v2 outputs are `published`, `has-changesets`, and `pr-number`. The shared wrapper uses those names, reports partial publication, and only attempts npm-token fallback after a failed primary action that did not report publication; successful no-publication runs do not trigger fallback. It does not publish or tag an unchanged workspace. The private root is not a workspace member. Isolated core-only, React-only, and coordinated `publish-plan` rehearsals planned only the requested packages, in core-before-React order. Version/changelog/lockfile simulations passed; no publish command was run.
5. Leave historical React GitHub Releases in the React repository; they cannot be transferred through a normal Git merge.

## Phase 16 — Dependabot post-migration verification (test matrix — required)

Run/observe these on the first live Dependabot PRs (from research report):

| #   | Scenario                                                               | Expected changeset                             | Auto-merge | Release     |
| --- | ---------------------------------------------------------------------- | ---------------------------------------------- | ---------- | ----------- |
| 1   | core dep patch                                                         | `@mirasen/chessboard: patch`                   | yes        | core patch  |
| 2   | React dep patch                                                        | `@mirasen/react-chessboard: patch`             | yes        | react patch |
| 3   | grouped PR touching both                                               | both `: patch` (one changeset)                 | yes        | both patch  |
| 4   | root private tooling only                                              | none                                           | yes        | none        |
| 5   | lockfile-only transitive                                               | none                                           | yes        | none        |
| 6   | internal dep (`@mirasen/chessboard` in React)                          | N/A (ignored)                                  | —          | —           |
| 7   | security manifest update (patch)                                       | affected pkg `: patch`                         | yes        | patch       |
| 8   | Dependabot rebase / action re-run                                      | overwrite `~dependabot-pr-<n>.md` (idempotent) | unchanged  | unchanged   |
| 9   | existing deterministic changeset present                               | same file overwritten (no dup)                 | unchanged  | unchanged   |
| 10  | no publishable manifest changed (e.g. examples-only, the #126 fixture) | none                                           | yes        | none        |

Scenario 10 is the concrete regression fixture: a #126-style "across N directories" PR that changes only
`examples/**` + root lock must produce **no `@mirasen/chessboard` changeset** (the current bug).

## Phase 17 — Retire the old React repository (only after successful release verification)

- Keep `mirasen-io/react-chessboard` accessible for original issue/PR links, old tags and GitHub Releases. Retain it until publication is verified from the consolidated repository.
- After successful validation, optionally add a README banner pointing to `mirasen-io/chessboard/tree/main/packages/react-chessboard`, update repository description and archive the old repo. No further releases from the archived repository.
- Do not delete its GitHub releases or repository merely because all Git commits are now reachable from the monorepo.

## Tags / releases behavior

- **Git commits:** the `--no-ff --allow-unrelated-histories` integration merge has both histories as parents/ancestors; no squash, so original commits are retained.
- **Old tags:** the two standalone repositories already use overlapping `v*` tag names. Fetch only the React preparation branch with `--no-tags`, **not** `git fetch --tags`. Do not rename or overwrite existing core tags during import. Leave original React tags in its own repository.
- **Old GitHub Releases:** release objects remain associated with their original GitHub repository, even when Git commits are imported. React's old Release URLs stay valid while the old repository stays accessible.
- **New tags and releases:** after workspace migration, verify the installed Changesets/action tooling generates **distinct package-qualified** tag names (e.g., `@mirasen/chessboard@<version>` and `@mirasen/react-chessboard@<version>`). Test before the first actual publication.
- **npm:** names and independent semver histories stay unchanged; move React's authorized publishing origin/workflow to the destination as a separate setup/check.

## Verification status — 2026-11-02

**Completed and verified:** the history-preserving merge and both ancestry checks; clean root install and local workspace links; independent package builds, checks, tests, coverage, lint, release builds, and package tarballs; SvelteKit and React example installation/build validation; isolated Changesets version and publish-plan rehearsals; and the empty root Changesets queue. The migration branch leaves both published versions unchanged (`@mirasen/chessboard` 1.5.3 and `@mirasen/react-chessboard` 2.0.1), which match the npm registry. No version, changelog, or release changeset was introduced by the migration.

PR #151 passes CI on Node.js 22, 24, and 26, including the workspace/example checks; CodeQL; Snyk; both Socket.dev checks; Dependabot configuration validation; and the required aggregate checks. The single `mirasen-io_chessboard` Sonar analysis imported six LCOV reports, passed its Quality Gate, and reported 94.8% coverage on new code. The SvelteKit `check` command ran before scanning to generate and validate the Kit TypeScript configuration.

**Owner-controlled follow-up:** preserve the imported histories when merging PR #151; verify React npm trusted publishing for `mirasen-io/chessboard` before the first release; and manually retire the old React SonarQube Cloud project and any duplicate Socket.dev integration after the consolidated checks are verified. The current GitHub token could not read the Dependabot secret store (403); the normal Actions Snyk scan passed, but verify `SNYK_TOKEN` availability in Dependabot's secret context before the first Dependabot-triggered run. No production release has been run.

**Out of scope:** developing new adapters or features, automatic merging into `main`, rewriting original Git histories, moving GitHub Release objects, and publishing npm versions only because files were reorganized.
