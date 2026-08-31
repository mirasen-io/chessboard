# Migration plan: `@mirasen/chessboard` + `@mirasen/react-chessboard` → npm-workspaces monorepo

> Status: **plan / not started** — verified & hardened runbook, ready for a coding agent to execute
> phase-by-phase without architectural guesswork.
> Goal: consolidate the two repos so a core feature and its React-wrapper prop are developed and
> released together, removing the manual "bump the wrapper to an unreleased core version" and the
> global `npm link` dev workflow.
> Companion doc: [`research-dependabot-monorepo-changesets.md`](./research-dependabot-monorepo-changesets.md)
> (Dependabot decision is FINAL — Outcome B; do not re-open it).

## 0. Decisions (locked)

| #   | Decision                         | Choice                                                                                                                                                                                                                                                                                                                                                                                                                |
| --- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Where the monorepo lives         | **Reuse `mirasen-io/chessboard`.** Core stays; React is brought in. Preserves stars/issues/npm-continuity and keeps all `github.repository == 'mirasen-io/chessboard'` workflow guards TRUE.                                                                                                                                                                                                                          |
| 2   | React git history                | **Not preserved.** React copied in as a snapshot on the dedicated migration branch `migrate/monorepo`. Core history preserved via `git mv` (rename-tracked). Old `react-chessboard` repo kept as archive.                                                                                                                                                                                                             |
| 3   | Package folder names             | `packages/chessboard` + `packages/react-chessboard`. npm names unchanged: `@mirasen/chessboard`, `@mirasen/react-chessboard`.                                                                                                                                                                                                                                                                                         |
| 4   | Package manager                  | **npm workspaces.** Single root `package-lock.json`.                                                                                                                                                                                                                                                                                                                                                                  |
| 5   | Examples placement               | **Top-level `examples/`** (`examples/sveltekit`, `examples/colors`, `examples/react`). Standalone (own lockfiles, `file:` deps), **not** workspace members, **not** under `packages/*`.                                                                                                                                                                                                                               |
| 6   | Root `workspaces` value          | **Explicit: `["packages/chessboard", "packages/react-chessboard"]`** — chosen for a curated 2-package repo (self-documenting, no silent inclusion of a stray `packages/*` dir). A `["packages/*"]` glob also works: the old "concrete-paths-for-Dependabot" constraint is gone (Outcome B attributes by changed manifest, not by literal `workspaces[]` match), so this is now a free style choice, not a workaround. |
| 7   | Dependabot changeset attribution | **By changed `packages/*/package.json` files** (Outcome B), NOT by Dependabot `directory`.                                                                                                                                                                                                                                                                                                                            |

## 1. Workspace dependency semantics (precise model — do not paraphrase as "by files not versions")

- npm workspaces **symlink** the sibling package into `node_modules`; React resolves `@mirasen/chessboard`
  through that symlink **to the package's `exports` → `dist`** (see §Build order — it is NOT raw-source resolution).
- The **declared semver range still governs**: React's `"@mirasen/chessboard": "^1.4.0"` must be satisfied
  by the on-disk core version (`1.4.0`) for npm to link the workspace copy. If the range no longer
  matches the local version, npm falls back to the registry.
- **During feature development you do NOT hand-edit the range to a future unpublished version.** You
  keep `^1.4.0` (satisfied by the local `1.4.0` build, which already contains the new source), add a
  changeset per package, and let release-time tooling do the bump.
- **Coordinated feature (touches both packages):** add a changeset for **each** package in the same PR
  (`core: minor` + `react: minor` — one file listing both, or two files; equivalent, verified). `changeset version`
  then, in one commit, bumps both **and rewrites React's internal range to the just-bumped core version** (e.g.
  `^1.4.0 → ^1.5.0`). This range rewrite happens whenever React is itself in the release and is governed by
  `updateInternalDependencies: "patch"` (already set) — it fires even though `^1.4.0` already satisfied `1.5.0`.
  `changeset publish` then publishes **core first, then React** (dependency order, one run), so React@new ships
  already declaring the just-published core — no broken window, no hand-editing, no serial cross-repo release.
- **Core-only change (e.g. Dependabot bumps a core dependency):** only `core` gets a changeset. React is **not**
  bumped and its range is **not** rewritten — an in-range core bump (`^1.4.0` still satisfies the new core) leaves
  React's published artifact unaffected, so no React release is warranted. React auto-bumps from core **only** when
  core moves **out** of React's caret range (a core **major**), which forces `react: patch` + range `→ ^2.0.0`.
  React therefore stays current via **its own** dependency updates, not core's. (All of the above verified locally
  against changesets v3.0.1.)

## 2. Target structure (verified)

```
chessboard/                          (repo root = private workspace orchestrator)
├── package.json                     NEW: { private:true, workspaces:["packages/chessboard","packages/react-chessboard"], orchestration scripts }
├── package-lock.json                single root lockfile (regenerated)
├── README.md                        NEW root landing page (repo/platform + links to both packages)
├── LICENSE                          root LICENSE (MIT) — GitHub license detection
├── .changeset/                      single shared dir (config.json identical in both repos today)
├── .githooks/                       ONE at repo root (pre-push) — NOT nested per package
├── .github/workflows/               chessboard's workflows, made workspace-aware
├── .github/dependabot.yml           directories: ["/","/packages/*", (+examples if watched)]
├── docs/                            (this plan + research report live here)
├── examples/                        standalone apps (own lockfiles; NOT workspace members)
│   ├── sveltekit/                   file: → ../../packages/chessboard   (was ../..)
│   ├── colors/                      static index.html (no package.json)
│   └── react/                       (renamed from react-chessboard/examples/app) file: → ../../packages/react-chessboard
└── packages/
    ├── chessboard/                  today's core repo content (src, tests, tsconfig*, package.json,
    │   ├── README.md · LICENSE · CHANGELOG.md   assets, openspec, .sonarcloud.properties, vitest.config)
    │   └── ...
    └── react-chessboard/            today's react repo content
        ├── README.md · LICENSE · CHANGELOG.md
        └── ...
```

Invariants (verified): npm names unchanged; each package keeps its own `README.md`+`LICENSE`(+`CHANGELOG.md`)
so `npm pack` ships the correct ones (npm shows the in-tarball README per package); root README/LICENSE
are for GitHub only (root is `private`, never published).

---

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

## Phase 0B — ✅ DONE (2026-08-31): tooling prerequisite: `npm-ci-sonar` `project-base-dir` support

Verified: `kt-workflows/actions/npm-ci-sonar` runs `sonarsource/sonarqube-scan-action@v7` **with no
`projectBaseDir`** (no `with:` at all) — it always scans the repo root. Its `working-directory` input only
affects the npm run-script, not the scanner. The monorepo needs per-package scans (Phase 13), so:

1. Add an input `project-base-dir` (default `.`) to `npm-ci-sonar`.
2. Pass it to the scan step: `sonarsource/sonarqube-scan-action@v7` with `projectBaseDir: ${{ inputs.project-base-dir }}`.
3. Keep `working-directory` for npm commands — do NOT overload its meaning.

This is a separate concern from the Dependabot fix (Phase 0A) but is likewise a **prerequisite**: it must
land on `kt-workflows/actions@main` before the monorepo CI (Phases 11/13) references the new input.

**Completed (2026-08-31):** `project-base-dir` input (default `.`) added to `npm-ci-sonar/action.yml`; passed to `sonarsource/sonarqube-scan-action@v7` as `projectBaseDir`. Commit `ef4ae8a`. All existing consumers unchanged (default `.`).

## Phase 0C — NEXT: `SNYK_TOKEN` prerequisite

1. Work on the dedicated migration branch `migrate/monorepo` (per decision #2 — a one-off branch for this large change, not the usual `contribution` flow). Clean tree.
2. Note current SHAs of both repos (react repo becomes an archive).
3. **Clean starting point (verified):** both packages fully released, **no pending changesets** — core
   `1.4.0`, React `1.1.0` (released in "Version Packages (#60)"). Nothing to migrate/freeze.

## Phase 2 — Scaffold the workspace root

1. Root `package.json` — **private orchestrator** (not published):
   ```jsonc
   {
   	"name": "mirasen-chessboard-workspace",
   	"private": true,
   	"type": "module",
   	"workspaces": ["packages/chessboard", "packages/react-chessboard"],
   	"engines": { "node": ">=20" },
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

## Phase 3 — Move core into `packages/chessboard` (`git mv`, history-preserving)

1. `git mv` core content into `packages/chessboard/`: `src/`, `tests/`, `package.json`,
   `tsconfig.base.json`, `tsconfig.json`, `tsconfig-release.json`, `tsconfig-test.json`, `vitest.config.ts`, `assets/`,
   `openspec/`, `README.md`, `CHANGELOG.md`, `LICENSE`, `.sonarcloud.properties` (+ `sonar-project.properties`
   symlink). Keep core's package-relative tsconfig (`rootDir ./src`, `outDir ./dist`) as-is.
   - `docs/` and `AGENTS.md`: keep at **repo root** (repo-wide), not under the package.
2. **DELETE the legacy npm-link workflow (not optional):** remove core's
   `"prepare": "bash ./scripts/npm-link.sh"` script entry AND delete `scripts/npm-link.sh`. Workspace
   symlinking is the sole local-linking mechanism now. Remove any doc/README mention of `npm link`.
3. Remove core's `changeset:version`/`changeset:publish` from the package (root-driven now); keep
   `build`, `build:release`, `test`, `coverage`, `lint`, `check`, `check:test`, `prepack` (publint).
4. `.githooks/` → do NOT move under the package (see Phase 9).

## Phase 4 — Bring React into `packages/react-chessboard` (snapshot copy)

1. Copy React content (no history) into `packages/react-chessboard/`: `src/`, `tests/`,
   `package.json`, `tsconfig.json`, `tsconfig-release.json`, `tsconfig-test.json`, `vitest.config.ts`,
   `openspec/`, `README.md`, `LICENSE`, `CHANGELOG.md`, `.sonarcloud.properties` (+ symlink).
2. **Delete React's `scripts/npm-link.sh`** (orphaned — React has no `prepare` hook; verified). Do not carry it over.
3. Keep React `package.json` name/version (`1.1.0`)/exports/peerDeps; keep
   `"@mirasen/chessboard": "^1.4.0"` (do NOT switch to `workspace:*`); remove its `changeset:*` scripts;
   fix the dangling `npm run example` reference in its README. **Add `"CHANGELOG.md"` to its `files` array**
   — verified currently `["dist", …, "README.md", "LICENSE"]` (no `CHANGELOG.md`), so React's changelog would
   otherwise be excluded from the npm tarball (core already lists it; React does not).
4. Do NOT carry over React's workflows, `dependabot.yml`, or `.changeset/config.json` (root already has an
   identical config). React's `.changeset/` has no pending files (verified).

## Phase 5 — Workspace-linking checkpoint (go/no-go, before CI work)

1. Root `npm install`. Confirm `node_modules/@mirasen/chessboard` is a **symlink** to `packages/chessboard`.
2. `npm run build -w @mirasen/chessboard` then `npm run build -w @mirasen/react-chessboard`.
3. `npm test -w @mirasen/react-chessboard` (React mocks the board and imports core **types** only —
   still needs core `dist/*.d.ts`).
4. If linking + ordered build pass here, the rest is config plumbing.

## Phase 6 — Root scripts & build order (verified mandatory ordering)

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
coverage (vitest runs on `src`). Therefore the CI `test`/`sonar` `run-script` is just `npm run coverage`
(self-contained) — drop the previous separate `npm run build` step to avoid a redundant second core build.

## Phase 7 — Repository metadata (both packages)

Set `repository.directory` on each publishable package and point both at the monorepo:

```jsonc
// packages/chessboard/package.json
"repository": { "type": "git", "url": "git+https://github.com/mirasen-io/chessboard.git", "directory": "packages/chessboard" }
// packages/react-chessboard/package.json
"repository": { "type": "git", "url": "git+https://github.com/mirasen-io/chessboard.git", "directory": "packages/react-chessboard" }
```

- **React `bugs.url`/`homepage`/`repository.url`** currently point at `mirasen-io/react-chessboard` — update
  `repository.url` + `bugs.url` to `mirasen-io/chessboard`. Keep `homepage` (`https://mirasen.io/chessboard/`) as-is.
- Core metadata already targets `mirasen-io/chessboard`; just add `directory`.
- Re-check `keywords`, `license` (MIT both), `author` (Mirasen), `funding` (none present). No renames of npm names.

## Phase 8 — Examples (top-level, standalone) — corrected `file:` depth

Verified current: `examples/sveltekit` (name `sveltekit`, `file:../..`, vite `fs.allow:['../..']`),
`examples/colors` (static `index.html`, no manifest), React `examples/app` (name `react-chessboard-example`,
`file:../..`, vite `optimizeDeps.exclude:['@mirasen/chessboard']`, `fs.allow:['../..','../../..']`).

1. Move to top-level: `examples/sveltekit`, `examples/colors`, and React's `examples/app` → **`examples/react`**.
2. **Fix `file:` deps (depth corrected):** from `examples/<x>/package.json` the package is two levels up + into `packages/`:
   - `examples/sveltekit`: `"@mirasen/chessboard": "file:../../packages/chessboard"` (was `file:../..`).
   - `examples/react`: `"@mirasen/react-chessboard": "file:../../packages/react-chessboard"` (was `file:../..`).
3. **Regenerate each example's standalone `package-lock.json`** (`npm install` inside each example dir) after the `file:` change.
4. Vite `server.fs.allow`: `['../..']` from a top-level `examples/<x>` already resolves to the **monorepo
   root** (which contains `packages/`), so it keeps working; drop the now-redundant `'../../..'` in the React example.
5. **CI `--prefix` paths are UNCHANGED**: `examples/sveltekit` is still at repo-root-relative
   `examples/sveltekit`, so `npm ci --prefix examples/sveltekit` stays valid. Optionally add
   `npm ci --prefix examples/react` if CI should also install/build the React example (React's old CI did not).
6. Keep examples **standalone** (own lockfiles; not workspace members); glob `packages/*` does not match `examples/*`.

## Phase 9 — `.githooks` at repo root

Verified: `.githooks/pre-push` runs `npm ci && npm run check && npm run lint`; **`core.hooksPath` is NOT
configured anywhere** (git config, package.json, CI) — the hook is opt-in only.

1. Keep a single `.githooks/` at repo root (core's — do not nest under packages). React's
   `.githooks/pre-push` is **identical** (both are `npm ci && npm run check && npm run lint`) and is **not**
   carried over (Phase 4's copy list already excludes it) — one root copy covers the whole workspace.
2. `pre-push`'s `npm ci && npm run check && npm run lint` now works **self-contained**: root `check` runs
   `build:core` first (Phase 6), so React's typecheck resolves core `dist` after a clean install. No change
   to the hook body is needed beyond confirming it calls the root workspace scripts.
3. Since nothing auto-sets `hooksPath`, no wiring change is required; document `git config core.hooksPath .githooks`
   in root `CONTRIBUTING.md` for contributors who want it.

## Phase 10 — Changesets consolidation

- One root `.changeset/config.json` (core's; identical to React's — verified: `access:public`,
  `baseBranch:main`, `updateInternalDependencies:patch`, `changelog:@changesets/cli/changelog`). No pending files to move.
- Independent versions retained (`fixed:[]`, `linked:[]`). Per-package `CHANGELOG.md` generated in each package dir.
- `changeset version` bumps only changed packages; React's internal core range auto-rewrites on a coordinated release.
- `changeset publish` publishes each workspace package needing a release, in dependency order.

## Phase 11 — Workflows consolidation (single `.github/workflows/`)

Use core's workflows (repo stays `mirasen-io/chessboard` → all `github.repository` guards remain TRUE;
no guard edits). Drop React's copies.

- **`ci.yml`**: `install-script` stays `npm ci && npm ci --prefix examples/sveltekit` (path unchanged; add
  `&& npm ci --prefix examples/react` only if building that example). `test`/`sonar` `run-script` =
  `npm run coverage` (self-contained via `build:core`, Phase 6). Produce **package-specific** coverage
  artifacts and run **two** Sonar scans (core + React) — both per Phase 13. Confirm branch-protection
  required-check names still match `required-main`/`required-contribution`.
- **`snyk` job (NEW):** add a Snyk dependency-scan job (see §Security integrations) —
  `snyk/actions/node@master` with `SNYK_TOKEN`, `args: --all-projects --detection-depth=2 --exclude=examples`,
  after root `npm ci`, parallel to `check`/`test`, no `npm run build` needed.
- **`release.yml`**: unchanged (wraps `npm-release` → `changesets/action@v2`, monorepo-native; only root
  scripts changed).
- **`auto-merge.yml`**: unchanged in wiring; correctness now comes from the Phase 0A action rewrite.
- **`auto-release.yml`**: unchanged (changeset-file/package-agnostic).
- **`codeql.yml`, `contribution-reset.yml`, `contribution-update.yml`**: unchanged; `main`/`contribution`
  model kept; the migration itself is done on the dedicated `migrate/monorepo` branch (then PR'd to `main`).
- No `working-directory`/`paths:`/`cd`/extra `--prefix`/`cache-dependency-path` assumptions to fix beyond the
  above (grep-verified: only the two `--prefix examples/sveltekit` lines exist, and they stay valid).
  Cache actions default `cache-dependency-path: **/package-lock.json`. The repo will have **multiple**
  lockfiles by design — one root workspace `package-lock.json` plus each standalone example's own
  (`examples/sveltekit/`, `examples/react/`). Workspace packages share the single root lockfile; the `**`
  glob hashes root + example lockfiles together, so changing an example lockfile may invalidate the cache —
  acceptable, not a blocker.

## Phase 12 — `.github/dependabot.yml`

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
  # Optional standalone example scopes (own lockfiles), mirroring today's /examples/sveltekit tracking:
  # - package-ecosystem: "npm"
  #   directories: ["/examples/sveltekit", "/examples/react"]
  #   ... (own group/ignore) ...
```

## Phase 13 — Sonar / coverage / paths (two projects, two scans — decided)

**Decision (final): keep the two existing SonarCloud projects and run two CI scans, one per package.** Do
NOT merge the two npm packages' coverage / issues / quality-gate / history into a single project — core and
the React wrapper need independent coverage, Quality Gate, issues, and trends.

```
mirasen-io/chessboard (one GitHub repo)
├── packages/chessboard        → SonarCloud project  mirasen-io_chessboard
└── packages/react-chessboard  → SonarCloud project  mirasen-io_react-chessboard
```

CI-based analysis is already in use, so SonarCloud's lack of monorepo Automatic Analysis is irrelevant.

1. **Per-package scan via `project-base-dir`** (requires the Phase 0B action change): the `sonar` job runs
   `npm-ci-sonar` twice — `project-base-dir: packages/chessboard`, then `project-base-dir: packages/react-chessboard`.
   Each package keeps its own `.sonarcloud.properties` (+ its `sonar-project.properties` symlink), read by the
   scanner relative to the base dir; its relative `sonar.sources=src` / `sonar.tests=tests` stay correct under
   that base dir. Verify the exact config filename the scanner consumes today (`sonar-project.properties` →
   symlink → `.sonarcloud.properties`) and preserve the working form after the move.
2. **Package-specific coverage artifacts (avoid name collisions).** Today the matrix uploads
   `coverage-test-node<ver>`. Use package-scoped names so core's Sonar project never ingests React's LCOV and
   vice-versa, e.g. `coverage-chessboard-node22/24` and `coverage-react-chessboard-node22/24` (or equivalent).
3. `npm run coverage --workspaces` writes `packages/chessboard/coverage-test` and
   `packages/react-chessboard/coverage-test`; upload each under its package-scoped artifact name; on the sonar
   job, download and place them so each package's `sonar.javascript.lcov.reportPaths` glob resolves ONLY its
   own LCOV. Adjust `reportPaths` per package if the downloaded layout differs from the in-package
   `coverage*/**/lcov.info` default.
4. Non-blocking overall (Sonar gated on `SONAR_TOKEN`), but the `project-base-dir` input (Phase 0B) and the
   artifact naming must be in place before the CI/Sonar merge.
5. No other repo-wide path assumptions: tests import core via relative `../src/*` (move together);
   `.prettierignore`/`.gitignore` entries are package-relative and move with the package; standalone
   `examples/*` must NOT enter either package's Sonar source tree (`sonar.sources=src` scoped by base dir
   keeps them out).

## Security integrations — Socket.dev (App) · Snyk (CI/CLI) · Sonar (per-package)

**FINAL model (do not reopen):**

```
Socket.dev → GitHub App only        (no CLI, no CI job)
Snyk       → GitHub Actions / CLI    (workspace-aware scan from monorepo root)
Sonar      → two projects, two scans (per package — Phase 13)
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

## Phase 14 — Pre-release dry-run checklist (mandatory before first release)

```
npm ci
npm ls                         # confirm @mirasen/chessboard resolves to the workspace symlink
npm run build                  # ordered core → react
npm test
npm run check                  # typecheck all
npm run lint
npm pack --workspace @mirasen/chessboard
npm pack --workspace @mirasen/react-chessboard
# publint runs via each package's prepack; also inspect both tarballs:
#   @mirasen/chessboard:        dist/, assets/, README.md, LICENSE, CHANGELOG.md, package.json
#   @mirasen/react-chessboard:  dist/, README.md, LICENSE, CHANGELOG.md, package.json  (CHANGELOG needs the Phase 4 files fix)
#   both: NO tests/examples/monorepo-only files; react's @mirasen/chessboard range is plain semver (no "workspace:").
```

Changesets dry-run (no publish): add a temporary `core: minor` + `react: minor` changeset, run
`npm run changeset:version`, verify core `1.4.0→1.5.0`, react bumped, react's `^1.4.0→^1.5.0`, and per-package
changelogs; then **revert** the versioning + delete the temp changeset.

## Phase 15 — First release from the monorepo

Merging the migration to `main` is **release-neutral** (no pending changesets → `changesets/action` no-ops or
opens an empty version PR). Prove CI-green first, publish nothing by accident. The first real release comes with
the next feature's changeset → `release.yml` → `npm-release` bumps + publishes affected packages in order with
per-package tags + GitHub releases.

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

- npm package `@mirasen/react-chessboard` is **not renamed** — it simply publishes from `mirasen-io/chessboard` now.
- Archive `mirasen-io/react-chessboard`: README banner pointing to the monorepo, repo description updated,
  no further releases, GitHub "Archive" toggle. Do this only after Phase 14–16 pass.

---

## Tags / releases behavior (verified)

`changesets/action` (via `npm-release`, `create-github-releases: true`) creates **per-package** git tags
and GitHub Releases: `@mirasen/chessboard@X.Y.Z`, `@mirasen/react-chessboard@A.B.C`. Distinct names → no
collisions. Per-package `CHANGELOG.md`. **No downstream coupling to break:** `cloudflare-site` consumes
`@mirasen/chessboard` from the npm registry and triggers on its own CI (verified in its `release.yml`), not on
chessboard tags/releases. Monthly `auto-release` aggregates dependabot patch changesets across both packages
transparently.

## Verified vs. still-unknown

**Verified against current source/config/history:** package.json scripts & deps (both); tsconfigs (nodenext,
no paths/references → build-order dependency); `.changeset/config.json` identical in both repos; examples’
`file:../..` + vite `fs.allow` + names/privacy; `core.hooksPath` unset anywhere; `scripts/npm-link.sh` present
in both + `prepare` wired only in core; the #126 mis-attribution + the whole "across 2 directories" series;
`npm-release-upd-pkg-lock`/`major-release-tag` unreferenced; CI `--prefix examples/sveltekit` (×2) is the only
path assumption and stays valid; cache-dependency-path `**/package-lock.json` hashes the root workspace
lockfile plus standalone example lockfiles (multiple lockfiles by design);
`cloudflare-site` decoupled (npm-registry consumer).

**Still unknown / validate on first live runs:** whether Dependabot splits `directories:["/","/packages/*"]`
grouped updates into per-directory PRs vs one combined PR at our 2-package scale (changed-files algorithm is
correct either way; affects only PR volume); interaction of `open-pull-requests-limit` with grouped
multi-directory updates. (Sonar is no longer an unknown — decided in Phase 13: two projects, two scans.)
`gh pr view --json files` 100-file cap is inference (undocumented) — mitigated by using `gh api --paginate`.
</content>
