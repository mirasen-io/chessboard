# Migration plan: `@mirasen/chessboard` + `@mirasen/react-chessboard` → npm-workspaces monorepo

> Status: **plan / not started**. This is a runbook, not executed work.
> Author context: consolidate the two separate repos into one monorepo so that a
> core feature and its React-wrapper prop can be developed and released together,
> removing the manual "bump the wrapper to an unreleased core version" step.

## 0. Decisions (locked)

| # | Decision | Choice |
|---|----------|--------|
| 1 | Where the monorepo lives | **Reuse the existing `mirasen-io/chessboard` repo.** Core stays put, React is brought in. Keeps stars/issues/npm-continuity of the core repo. |
| 2 | React git history | **Not preserved.** React is copied in as a normal feature on the current `contribution` branch. The old `react-chessboard` repo remains as a history archive. |
| 3 | Package folder names | **`packages/chessboard` + `packages/react-chessboard`** (match current repo names). npm package names **do not change**: `@mirasen/chessboard`, `@mirasen/react-chessboard`. |
| 4 | Package manager | **npm workspaces** (same as today, same as plywise). No pnpm. |
| 5 | Examples placement | **Top-level `examples/`** (`examples/sveltekit`, `examples/colors`, `examples/react`), standalone installs (own lockfiles, `file:` deps), **not** workspace members and **not** under `packages/*`. |

## 1. Why the monorepo actually solves the pain (mechanism)

Today React depends on the **published** `@mirasen/chessboard` (`^1.4.0` resolved from
npm). So a cross-package feature is forced serial: release core → wait → bump the
wrapper. In a workspace, React's dependency resolves to the **on-disk** core package
(npm symlinks the local workspace package because its version satisfies the range),
so:

- Core feature + React prop live in one PR; React sees the new core **source** immediately (resolution is by files, not by version number).
- You never hand-write an unreleased version. At release, `changeset version` bumps
  core and rewrites React's internal range in the **same commit**
  (`updateInternalDependencies: "patch"` is already set), then `changeset publish`
  publishes core first, then React — in one command.

Confirmed by inspecting plywise's published tarball: their repo uses **plain npm
workspaces + a concrete semver range** (`"@plywise/chessboard": "^0.4.0"`), NOT the
`workspace:` protocol. Local linking works purely because the on-disk version
satisfies the range. We replicate that.

## 2. Target structure

```
chessboard/                         (repo root; becomes the workspace root — private)
├── package.json                    NEW root: private, "workspaces": ["packages/chessboard","packages/react-chessboard"]
├── package-lock.json               single root lockfile (regenerated)
├── .changeset/                     single shared changeset dir (core's config + React's pending changesets moved in)
├── .github/workflows/              chessboard's workflows, made workspace-aware
├── .github/dependabot.yml          multi-directory (per package)
├── examples/
│   ├── sveltekit/                  moved from packages-less root; file: → ../packages/chessboard
│   ├── colors/                     static HTML (no deps)
│   └── react/                      moved from react-chessboard/examples/app; file: → ../packages/react-chessboard
├── packages/
│   ├── chessboard/                 == today's chessboard repo content (src, tests, tsconfig*, package.json, assets, openspec, scripts, .githooks)
│   └── react-chessboard/           == today's react-chessboard repo content (src, tests, tsconfig*, package.json, openspec)
├── docs/
└── ...
```

Key invariants:
- **npm package names unchanged** → no consumer breakage, npm continuity preserved.
- React's `import ... from '@mirasen/chessboard'` (bare specifier, nodenext) resolves
  to the workspace symlink → core's `dist` via its `exports` map. **Core must be built
  before React typechecks/builds** (see §5 build order).

---

## Phase A — Prep (reversible, do first)

1. Work on the existing `contribution` branch (per decision #2). Confirm clean tree.
2. Snapshot the current state of both repos (tag or note commit SHAs) so the old
   `react-chessboard` repo stays a usable archive.
3. **Clean starting point (verified after latest pull):** both packages are fully
   released with **no pending changesets** — core `@mirasen/chessboard` is `1.4.0`,
   React `@mirasen/react-chessboard` is now `1.1.0` (the `expose-core-extensions`
   minor + dependabot patches were released in the "Version Packages (#60)" commit).
   So there is **no changeset backlog to migrate** (this was a concern earlier when
   React sat at `1.0.3` with 19 pending changesets — no longer the case). The monorepo
   starts from a synchronized, released state. Nothing to freeze.

---

## Phase B — Scaffold the workspace root

1. Create the **root `package.json`** (private, not published):
   ```json
   {
     "name": "mirasen-chessboard-workspace",
     "private": true,
     "type": "module",
     "workspaces": ["packages/chessboard", "packages/react-chessboard"],
     "engines": { "node": ">=20" },
     "scripts": { /* see §5 */ },
     "devDependencies": { /* shared tooling, see below */ }
   }
   ```
   **Use concrete workspace paths, NOT the `packages/*` glob.** This is required for the
   dependabot-changeset action to attribute changesets to the right package (see §9 /
   Phase H). Two packages only — the glob buys nothing and breaks the tooling.

2. Shared devDependencies at root (hoisted): `@changesets/cli`, `prettier`,
   `eslint` + `@eslint/js` + `@eslint/compat` + `typescript-eslint` +
   `eslint-config-prettier` + `globals`, `typescript`, `rimraf`, `publint`,
   `vitest` + `@vitest/coverage-v8`, `jsdom`. Keep **package-unique** deps in each
   package (`chess.js`, `es-toolkit`, `type-fest`, `@ktarmyshov/assert` in core;
   `react`, `react-dom`, `@types/react*`, `@testing-library/react` in React).
   - Minimal-churn alternative: leave devDeps in each package and only add
     `@changesets/cli` + `prettier` at root. npm dedupes either way; hoisting is the
     cleaner end state but more churn. Pick one; the runbook assumes hoisting.

3. Root config files: move/keep a single `.prettierrc`, `.prettierignore`, `.npmrc`
   (`engine-strict=true`), `eslint.config.js` (root flat config that lints all
   packages), `tsconfig.base.json` (already exists in core — promote to root).

---

## Phase C — Move core into `packages/chessboard`

Core currently **is** the repo root. Move its package content down one level.

1. `git mv` (or plain move on `contribution`) the core package files into
   `packages/chessboard/`: `src/`, `tests/`, `package.json`, `tsconfig.json`,
   `tsconfig-release.json`, `tsconfig-test.json`, `vitest.config.ts`, `assets/`,
   `openspec/`, `scripts/`, `.githooks/`, `README.md`, `CHANGELOG.md`, `LICENSE`,
   `.sonarcloud.properties` (+ its `sonar-project.properties` symlink),
   `AGENTS.md` (+ `docs/ai/chessboard-AGENTS.md` target — decide whether docs stay at
   repo root or move under the package).
2. Core's `tsconfig.base.json` → either keep a copy in the package or `extends` the
   root one. Core's `tsconfig.json` (`rootDir ./src`, `outDir ./dist`) stays valid
   because paths are package-relative.
3. Core `package.json` stays essentially unchanged (name, version `1.4.0`, exports,
   scripts). It keeps its own `build`, `build:release`, `test`, `coverage`, `lint`,
   `check`, `prepack` (publint). **Remove** its root-level `changeset:version` /
   `changeset:publish` scripts — changesets is driven from the workspace root now.
4. Its `"prepare": "bash ./scripts/npm-link.sh"` is a dev convenience for globally
   `npm link`-ed deps; with workspaces it is largely redundant. Keep, drop, or move to
   root — low priority, decide during the move.

**No URL/identity change needed** for core: `homepage`, `repository.url`,
`bugs.url` still point at `mirasen-io/chessboard`, which is still the repo.

---

## Phase D — Bring React into `packages/react-chessboard`

1. Copy React's package content (no history, per decision #2) into
   `packages/react-chessboard/`: `src/`, `tests/`, `package.json`,
   `tsconfig.json`, `tsconfig-release.json`, `tsconfig-test.json`,
   `vitest.config.ts`, `openspec/`, `scripts/`, `.githooks/`, `README.md`,
   `LICENSE`, `.sonarcloud.properties` (+ symlink).
2. React `package.json`:
   - Keep name `@mirasen/react-chessboard`, version `1.1.0`, exports, peerDeps.
   - Keep `"@mirasen/chessboard": "^1.4.0"` — this range is satisfied by the on-disk
     core `1.4.0`, so npm links the workspace package. **Do not** change it to
     `workspace:*`; plain range is what plywise uses and what our tooling expects.
   - **Remove** its `changeset:version` / `changeset:publish` scripts (root-driven now).
   - Note the dangling `npm run example` reference in its README — fix or drop.
3. React's `.changeset/` currently holds **only `config.json` + `README.md`** (no
   pending changes — verified after the latest pull). So there is **nothing to move**.
   If any new changeset appears before migration, move its `.md` into the root
   `.changeset/`.
4. Do **not** bring React's `.changeset/config.json` (root already has core's; they are
   identical: `baseBranch: main`, `updateInternalDependencies: patch`, `access: public`).
5. Do **not** bring React's workflows or `dependabot.yml` — the repo uses core's
   (see Phase G/H). React's workflows are guarded on `mirasen-io/react-chessboard` and
   would be dead here anyway.

---

## Phase E — Verify workspace linking (checkpoint, before touching CI)

1. From repo root: `npm install`. Confirm `node_modules/@mirasen/chessboard` is a
   **symlink** to `packages/chessboard` (not a registry install).
2. `npm run build -w @mirasen/chessboard` then
   `npm run build -w @mirasen/react-chessboard` — React must typecheck against core's
   freshly built `dist/*.d.ts`.
3. `npm test -w @mirasen/react-chessboard` — React tests currently mock the board and
   import `@mirasen/chessboard` types only; confirm they resolve from the workspace.
4. This is the **go/no-go checkpoint**: if linking + build order work here, the rest is
   config plumbing.

---

## Phase F — Root scripts & build ordering

Core-before-React ordering is **mandatory**: React's `tsc` resolves `@mirasen/chessboard`
to core's `dist` via `exports`, so core's `dist` must exist first. Do **not** use a bare
`--workspaces` fan-out for build (order not guaranteed). Explicit ordering:

```jsonc
// root package.json scripts
{
  "build":          "npm run build -w @mirasen/chessboard && npm run build -w @mirasen/react-chessboard",
  "build:release":  "npm run build:release -w @mirasen/chessboard && npm run build:release -w @mirasen/react-chessboard",
  "test":           "npm run test --workspaces --if-present",       // order-independent
  "coverage":       "npm run coverage --workspaces --if-present",    // see §Sonar for per-pkg lcov
  "lint":           "prettier --check . && eslint .",
  "format":         "prettier --write .",
  "check":          "npm run check --workspaces --if-present",
  "changeset:version": "changeset version && npm install && npm run format && git add --all",
  "changeset:publish": "changeset publish"
}
```

Notes:
- `changeset:version` mirrors core's current script (regenerates the root lockfile via
  `npm install`, reformats, stages). This is why **`npm-release-upd-pkg-lock` is not
  needed** — the lockfile is regenerated, not hand-patched.
- `changeset publish` natively publishes every workspace package that has a pending
  version, in dependency order, and creates per-package git tags + GitHub releases.

---

## Phase G — Consolidate workflows (single `.github/workflows/`)

Use **core's** workflows (repo is still `mirasen-io/chessboard`, so all
`if: github.repository == 'mirasen-io/chessboard'` guards stay TRUE — no guard edits
needed). Discard React's copies. Make these workspace-aware:

- **`ci.yml`**
  - `check` / `test` jobs `install-script`: today
    `npm ci && npm ci --prefix examples/sveltekit`. Update the example prefix to the
    new location: `npm ci && npm ci --prefix examples/sveltekit` (top-level `examples/`
    keeps the same relative path from root — verify; if examples stay nested it becomes
    `packages/chessboard/examples/sveltekit`).
  - `run-script` currently `npm run build; npm run coverage; mv coverage-test ...`.
    With two packages producing coverage, the single `coverage-test` dir no longer
    holds both. Decide coverage strategy (see Sonar below): either aggregate lcov from
    both packages, or run Sonar per package.
  - `required-main` / `required-contribution` aggregate gates stay; they map to branch
    protection. Confirm branch-protection required-check names still match.
- **`release.yml`** — unchanged. It calls `kt-workflows/actions/npm-release@main`,
  which wraps `changesets/action@v2` (monorepo-native). The action needs **no change**;
  only the root scripts it invokes (`build:release`, `changeset:*`) needed updating (Phase F).
- **`auto-release.yml` / `auto-merge.yml`** — unchanged in wiring; correctness depends
  on the dependabot-changeset attribution fix (Phase H). Merge React's cron time is
  irrelevant (React's workflow is dropped).
- **`codeql.yml`** — unchanged (repo-level scan).
- **`contribution-reset.yml` / `contribution-update.yml`** — unchanged; the
  `main`/`contribution` branch model is kept and the migration happens on `contribution`.

---

## Phase H — Dependabot (per-package directories + attribution)

1. **`dependabot.yml`**: expand to cover each package. Core today uses
   `directories: ['/', '/examples/sveltekit']`. New:
   ```yaml
   directories:
     - '/packages/chessboard'
     - '/packages/react-chessboard'
     - '/examples/sveltekit'
     - '/examples/react'
   ```
   (Root `/` no longer holds runtime deps — the root package is private tooling; decide
   whether to also watch `/` for the shared devDeps.)
2. **Attribution fix — the one real action gotcha.** `dependabot-generate-changesets`
   maps a dependabot update directory to a workspace package by a **literal string
   compare** against `jq -r '.workspaces[]' ./package.json`. Consequences (verified):
   - With **concrete** workspace paths (Phase B.1), a dependabot dir like
     `/packages/react-chessboard` (normalized to `packages/react-chessboard`) matches
     exactly → correct changeset. **This is why we avoid the `packages/*` glob.**
   - With a **glob** entry (`packages/*`), no match → falls back to the **root** package
     name → changeset mis-attributed to the private root → `changeset version` would try
     to bump the wrong thing. Avoid.
3. **Unknown to validate on first dependabot run:** confirm what `directory` dependabot
   actually reports for npm-workspace member manifests (it may report the member dir, or
   collapse to the workspace root `/`). If it reports `/`, the attribution falls back to
   root even with concrete paths — in that case the fix is in the action
   (`dependabot-generate-changesets`): expand globs / walk up to the nearest
   `package.json`. Treat the first post-migration dependabot PR as a test; don't assume.

---

## Phase I — Sonar (two projects today)

Core and React each have their own SonarCloud project
(`mirasen-io_chessboard`, `mirasen-io_react-chessboard`) with
`sonar.sources=src`, `sonar.tests=tests`, `sonar.javascript.lcov.reportPaths=coverage*/**/lcov.info`.

Options (decision needed, config-only — not blocking):
- **Keep two projects**, run the Sonar scan per package with per-package
  `sonar.sources`/`sonar.tests`/lcov paths (e.g. `packages/chessboard`,
  `packages/react-chessboard`). Requires the CI `sonar` job to scan twice or use
  SonarCloud monorepo mode.
- **One project** with modules. Simpler CI, coarser reporting.
Recommend keeping two projects (preserves history/badges); wire per-package lcov paths
in the CI `sonar` job. This is the messiest CI change and can be deferred (Sonar is
gated on `SONAR_TOKEN` and won't block release).

---

## Phase J — Examples (top-level, standalone)

1. Move `examples/sveltekit`, `examples/colors` (from core) and
   `examples/app` → `examples/react` (from React) to a **top-level `examples/`** dir.
2. Fix each example's `file:` dependency to point at the package under `packages/`:
   - `examples/sveltekit/package.json`: `"@mirasen/chessboard": "file:../packages/chessboard"` (was `file:../..`).
   - `examples/react/package.json`: `"@mirasen/react-chessboard": "file:../packages/react-chessboard"` (was `file:../..`).
3. Fix Vite `server.fs.allow` in each example so it can read the linked package source
   (`../packages/chessboard` etc.). SvelteKit example also has `optimizeDeps`/allow list.
4. Keep them **standalone** (own `package.json` + `package-lock.json`, installed via
   `npm ci --prefix examples/<x>`), **not** workspace members — avoids react/tooling
   version hoist conflicts with the root.
5. Update `.prettierignore` (currently ignores `examples/sveltekit`) and any CI
   `--prefix` paths to the new locations.
6. **Alternative (less churn):** keep each example nested under its package
   (`packages/chessboard/examples/sveltekit`, `packages/react-chessboard/examples/react`).
   Then `file:../..` stays valid with zero dependency edits; only CI `--prefix` paths
   change. Choose this if the `file:`/vite edits above aren't worth it.

---

## Phase K — First release from the monorepo

1. Merge the `contribution` migration into `main` via PR (existing CI gates apply).
2. Because both packages start with **no pending changesets** (Phase A.3), the
   migration merge itself **publishes nothing** — the restructure is release-neutral.
   `changesets/action` sees no changes and simply no-ops (or opens an empty version PR).
   That is the desired outcome: prove the monorepo builds/tests/CI-green first, ship
   nothing by accident.
3. The **first real monorepo release** happens on your next feature: add a changeset for
   core and/or React, merge to `main`, and `release.yml` → `npm-release` →
   `changesets/action`:
   - `changeset version` bumps the changed packages and rewrites React's internal
     `@mirasen/chessboard` range in the same commit (`updateInternalDependencies: patch`).
   - `changeset publish` publishes them in dependency order (core first) with per-package
     tags + GitHub releases.
4. Verify on npm that any newly published `@mirasen/react-chessboard` tarball contains a
   plain semver range for `@mirasen/chessboard` (no `workspace:` — we never used it).

---

## Actions that DO / DON'T need changes (verified)

| Action | Wired into these repos? | Monorepo change |
|--------|-------------------------|-----------------|
| `npm-release` | Yes (`release.yml`) | **None** — wraps `changesets/action@v2` (monorepo-native). Only root scripts changed. |
| `npm-run-script`, `-cache-key`, `-cache-delete`, `setup-node-minmax` | Yes (via ci actions) | **None** — single root lockfile + `**/node_modules` cache + `**/package-lock.json` hash all correct for npm workspaces. |
| `npm-ci-check` / `-test` / `-sonar` | Yes (`ci.yml`) | **None in the action** — consumer root scripts must be workspace-aware (Phase F). |
| `dependabot-auto-merge` / `-auto-release` | Yes | **None** in wiring — depend on correct changeset attribution (Phase H). |
| `dependabot-generate-changesets` | Yes (inside auto-merge) | **Conditional** — OK with concrete workspace paths; needs a glob/walk-up fix only if dependabot reports `/` for members (Phase H.3). |
| `npm-release-upd-pkg-lock` | **NO** (grep: not referenced) | **N/A** — not in the release path; ignore. `changeset:version` regenerates the lockfile via `npm install`. |
| `major-release-tag` | **NO** (grep: not referenced) | **N/A** — ignore. |
| `create-github-app-token`, `get-associated-pr` | Yes | **None** — repo/identity only. |

---

## Risks & rollback

- **Highest-uncertainty item:** dependabot's reported `directory` for workspace members
  (Phase H.3). Everything else is deterministic. Validate on the first dependabot PR.
- **Build-order dependency** (core before React): a bare `--workspaces` build will
  intermittently fail. Enforce explicit order (Phase F).
- **Rollback:** the migration is a set of commits on `contribution`. Until the PR is
  merged to `main`, nothing is published and nothing is irreversible. The old
  `react-chessboard` repo stays intact as an archive (decision #2). Reverting is
  `git reset`/close-PR before Phase K.
- **npm continuity:** package names never change, so published consumers are unaffected.
  The only externally visible change is that `@mirasen/react-chessboard` now releases
  from `mirasen-io/chessboard` (repository URL in its package.json should be updated to
  point at the monorepo + `directory` field, e.g.
  `"repository": { "url": "...mirasen-io/chessboard.git", "directory": "packages/react-chessboard" }`).

---

## Verified vs. assumed (so nothing here is hand-waved)

**Verified by reading the actual files:**
- Core `package.json` scripts, exports, deps; version `1.4.0`.
- Core `dependabot.yml` = `directories: ['/', '/examples/sveltekit']`; `ci.yml`
  install includes `npm ci --prefix examples/sveltekit`; `main`/`contribution` branch model.
- React `package.json` (`@mirasen/chessboard: ^1.4.0`, version `1.1.0`), tsconfigs
  (nodenext, no paths/references — core resolved via node_modules).
- React `.changeset/`: **no pending changes** after the latest pull (just `config.json`
  + `README.md`); React `1.1.0` was released in "Version Packages (#60)". (Earlier this
  repo sat at `1.0.3` with 19 pending changesets — now released.)
- `dependabot-generate-changesets` literal workspace-match logic (glob fails, falls
  back to root package).
- `npm-release-upd-pkg-lock` and `major-release-tag` are **not referenced** anywhere in
  either repo's workflows or in the wired actions (grep confirmed).
- plywise ships plain semver ranges (not `workspace:`) in its published react tarball;
  root is `npm@... workspaces: ["packages/*"]`.

**Assumed / must validate during execution:**
- Exact `directory` dependabot reports for npm-workspace member manifests (Phase H.3).
- Whether SonarCloud stays two projects or one (Phase I) — config choice, non-blocking.
- Whether to hoist shared devDeps to root or leave per-package (Phase B.2) — either works.
</content>
</invoke>
