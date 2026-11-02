# Research report: Dependabot + npm workspaces + automatic Changesets (monorepo)

> Scope: **Dependabot → auto-generated Changeset → auto-merge/auto-release** only.
> This is a standalone investigation. The main `plan-migrate-monorepo.md` is intentionally
> NOT modified; decide the Dependabot architecture from this report first.
> Hard requirement being tested: **no manually-authored changesets for Dependabot PRs, ever.**
> Date of investigation: 2026-08. Current tool/action versions checked against `main`.

---

## Verdict

**Proceed with the monorepo: Dependabot automation is safe IF we stop attributing changesets by
Dependabot's reported `directory` and instead attribute by the PR's changed `packages/*/package.json`
files.** The current `directory`-based logic is _not_ reliable under npm workspaces (grouped
multi-directory PRs collapse to `directory: "/"`); a changed-files algorithm is reliable, handles
grouped and multi-package PRs correctly, and requires a contained rewrite of the
`dependabot-generate-changesets` step. → **Outcome B (modify the action).**

---

## The core finding (why directory-based attribution fails)

### 1. `fetch-metadata` derives `directory` from the branch name

`dependabot/fetch-metadata@v3` (source: `src/dependabot/update_metadata.ts`) builds each
updated-dependency object with a `directory` field computed by `branchNameToDirectoryName()`,
which **slices the Dependabot branch name** (after `dependabot/<ecosystem>`, minus version/group
chunks) to recover the directory. There is also a single top-level `directory` output documented as
_"the `directory` configuration that was used by dependabot for this updated Dependency."_

Consequence: the `directory` signal is only as good as what Dependabot encodes into the branch name.

### 2. Grouped workspace updates produce a group-named branch with NO directory

**Experimentally demonstrated** on a live npm-workspaces monorepo — `chicio/chicio-blog`
(`workspaces: ["apps/*","packages/*"]`, single root `package-lock.json` lockfileVersion 3,
`directories: ["/", "/apps/*", "/packages/*"]`, grouped updates):

- PR #557 "bump the typescript group across **5 directories**"
- head branch: `dependabot/npm_and_yarn/typescript-585024d9b7` ← group name + hash, **no directory**
- changed files:
  ```
  apps/matrix-design-system-showcase/package.json
  apps/website/package.json
  packages/matrix-component-store/package.json
  packages/matrix-design-system/package.json
  package-lock.json                                  ← single ROOT lockfile
  ```

So a **single** Dependabot PR legitimately edits **four different workspace-member manifests** plus
the one root lockfile, on a branch that encodes no directory. `branchNameToDirectoryName()` on
`typescript-585024d9b7` yields `/`. Directory-based attribution would map every dependency in this PR
to the root package. Under npm workspaces with grouping (which we use), this is the normal case, not
an edge case.

### 3. npm workspaces with a single root lockfile is fully supported — but you must list member directories

- `chicio/chicio-blog` proves Dependabot updates member-declared deps and writes the single root
  `package-lock.json` correctly. **No "cannot find lockfile" problem** with member directories +
  root lock.
- Its config comment is instructive: deps "moved out of the root manifest when this became a
  monorepo… The root now declares 6 devDependencies; the website 82…" — i.e. they explicitly added
  `/apps/*` and `/packages/*` to `directories` **because deps declared inside members are only picked
  up when their directory is listed.** `directory: "/"` alone primarily covers root-declared deps.
  (Doc-vs-practice note: GitHub's options reference documents that `directories` supports globbing but
  does **not** clearly state that `/` alone won't cover member-declared deps; the reliable, evidenced
  pattern is to list member directories via globs.)

### Net: the earlier "use concrete `workspaces` paths so the literal directory match works" idea is a dead end

It only helps for _ungrouped, single-directory_ updates. The moment Dependabot groups (our
`minor-and-patch` group) or spans directories, the branch carries no directory and the match
collapses to root. Abandon directory-based attribution entirely.

---

## Recommended architecture — attribute by changed manifests

```
Dependabot PR
  → list changed files (gh api --paginate .../pulls/<PR>/files)
  → discover project packages from root package.json:
        has workspaces → members (globs packages/*, explicit paths, and "."); orchestrator root NOT a member
        no workspaces  → the root IS the package (".")
  → for each discovered package whose  <dir>/package.json  changed:
        collect its "name" into AFFECTED[]        (NO private check — changesets config decides version/tag/publish)
  → if AFFECTED is empty:  rm -f the deterministic file (delete stale) → NO changeset (lockfile-only / root-only) → PR still auto-merges, no release
  → else: write ONE changeset listing every AFFECTED package as "patch"
  → commit changeset to the PR head (deterministic filename → idempotent on rebase/re-run)
  → existing approve + auto-merge + monthly auto-release continue unchanged
```

This is robust because the changed manifest **is** the ground truth of which package's declared
dependencies moved — independent of branch names, grouping, or `directory` reporting.

---

## Recommended `.github/dependabot.yml` (fragment)

```yaml
version: 2
updates:
  - package-ecosystem: 'npm'
    directories:
      - '/' # root: shared private tooling devDependencies
      - '/packages/*' # both publishable packages (member manifests)
      # examples/* are standalone (own lockfiles) — add "/examples/*" only if you want them watched
    schedule:
      interval: 'weekly'
      time: '03:18'
      timezone: 'Europe/Berlin'
    versioning-strategy: increase # ensure manifest ranges change (so changed-files sees them)
    open-pull-requests-limit: 10
    groups:
      minor-and-patch:
        patterns: ['*']
        update-types: ['minor', 'patch']
      major:
        patterns: ['*']
        update-types: ['major']
        group-by: dependency-name
    ignore:
      # Internal workspace deps — Changesets coordinates these on release; do NOT let Dependabot chase them.
      - dependency-name: '@mirasen/chessboard'
      - dependency-name: '@mirasen/react-chessboard'
      - dependency-name: 'npm'
        versions: ['<10.0.0', '>=11.0.0']
    commit-message:
      prefix: 'dependabot'
      prefix-development: 'dependabot'
```

Notes:

- **`directories` globs are fine now** — because attribution no longer depends on matching them. This
  also removes the earlier constraint to use concrete `workspaces` paths in root `package.json`;
  `"workspaces": ["packages/*"]` is acceptable again.
- **`ignore` the two internal packages** (see §Internal dependency below).
- `versioning-strategy: increase` makes range bumps land in the manifest (so a real dependency change
  is visible in changed files rather than lockfile-only). Optional but recommended for libraries.

---

## Recommended changeset-generation algorithm (action-level)

Runs inside `dependabot-auto-merge` after the PR head is checked out (it already does
`create-github-app-token` → `fetch-metadata` → `checkout`). Replace the current
`dependabot-generate-changesets` step (which reads `directory` + literal workspace match) with:

```bash
set -euo pipefail
PR="${{ github.event.pull_request.number }}"
OWNER_REPO="${{ github.repository }}"
FILE=".changeset/~dependabot-pr-${PR}.md"   # keep the ~ prefix: Dependabot entries sort LAST in each CHANGELOG

# 1. Changed files in the PR — FULL pagination (gh pr view --json files caps at 100, no auto-paginate)
mapfile -t CHANGED < <(gh api --paginate "repos/${OWNER_REPO}/pulls/${PR}/files" --jq '.[].filename')

# 2. Discover project packages from root package.json (support every shape)
mapfile -t MEMBERS < <(node -e '
  const fs=require("fs"), path=require("path");
  const root=JSON.parse(fs.readFileSync("package.json","utf8"));
  const ws=root.workspaces?.packages||root.workspaces;
  const out=new Set();
  if (!ws || ws.length===0) {
    out.add(".");                                   // no workspaces → the root IS the package
  } else for (const g of ws) {
    if (g.endsWith("/*")) {                          // glob e.g. packages/*
      const base=g.slice(0,-2);
      if (fs.existsSync(base)) for (const d of fs.readdirSync(base))
        if (fs.existsSync(path.join(base,d,"package.json"))) out.add(path.join(base,d));
    } else if (fs.existsSync(path.join(g,"package.json"))) out.add(g);   // explicit path, or "."
  }
  process.stdout.write([...out].join("\n"));
')

# 3. Collect affected packages: discovered package whose manifest changed.
#    NO private check — changesets config (privatePackages / ignore) decides what versions/publishes.
AFFECTED=()
for m in "${MEMBERS[@]}"; do
  manifest="$m/package.json"; manifest="${manifest#./}"        # normalize "." → "package.json" to match gh api
  printf '%s\n' "${CHANGED[@]}" | grep -qxF "$manifest" || continue
  AFFECTED+=("$(jq -r '.name' "$manifest")")
done

# 4. Nothing discovered changed (lockfile-only / examples-only / root-tooling-only) → delete any stale
#    changeset from an earlier run, emit none. PR still auto-merges.
if [ ${#AFFECTED[@]} -eq 0 ]; then
  rm -f "$FILE"
  echo "changesets-json=[]" >> "$GITHUB_OUTPUT"
  exit 0
fi

# 5. One changeset for all affected packages. Deterministic filename → idempotent on rebase/re-run.
{
  echo "---"
  for n in "${AFFECTED[@]}"; do echo "\"$n\": patch"; done
  echo "---"
  echo
  echo "dependabot: dependency updates for PR #${PR}"
} > "$FILE"
echo "changesets-json=[\"$FILE\"]" >> "$GITHUB_OUTPUT"
```

Notes:

- **No `private` filter** — verified against changesets v3.0.1: a discovered **private member** targets fine (it
  versions; the changeset is consumed; `tag`/npm are governed by the repo's `privatePackages`/`ignore` config). Only
  the **orchestrator root** (a non-member) errors `Found changeset … not in the workspace` and leaves the changeset
  **stuck** — and it is never emitted here because it is not in `MEMBERS`.
- Requires `versioning-strategy: increase` in each consuming repo so in-range direct bumps edit the manifest (else a
  lockfile-only update produces no changeset).

The subsequent approve/merge steps of `dependabot-auto-merge` stay as-is (approve+auto-merge gated on
semver-minor/patch). The commit step must stage with **`git add -A .changeset`** (not just `git add .changeset`)
so a **deletion** of a stale changeset is committed too — this is what makes the deterministic-filename approach
idempotent in the `A→none` direction (empty affected set), alongside `A→A` / `A→A+B` / `A+B→B` / `none→A`.

---

## Required changes to the shared action(s)

1. **`dependabot-generate-changesets`** — replace its inputs/logic:
   - Remove: `updated-dependencies-json` + `version-update-map` inputs and the `directory`→
     `workspaces[]` literal-match loop (the whole per-dependency loop and the branch/`directory`
     dependence).
   - Add: `pr-number` (and rely on the checkout already done by the caller) + the changed-files
     algorithm above. Emit `changesets-json` = `[FILE]` (or `[]`).
   - Remove the dead `if: steps.find-comment.outputs.comment-id == ''` gate (references a nonexistent
     step; currently always-true — harmless but confusing).
2. **`dependabot-auto-merge`** — pass `pr-number` instead of `updated-dependencies-json` to the
   generator; nothing else changes (fetch-metadata still useful for the minor/patch **merge** gate).
3. **`dependabot-auto-release`** — **no change.** It operates on `.changeset/*.md` at repo root,
   bails unless every changeset is a `dependabot:`-bodied file, and aggregates highest bump = patch.
   Multi-package changesets are transparent to it. (Keep the `dependabot:` marker line in the
   generated body so its detection still matches.)
4. **`npm-release`** — no change (wraps `changesets/action`, monorepo-native).
5. **Not in the path, ignore:** `npm-release-upd-pkg-lock`, `major-release-tag` (grep-confirmed
   unreferenced in either repo's workflows).

---

## Test matrix

Assumes `@mirasen/chessboard` (packages/chessboard, public) and `@mirasen/react-chessboard`
(packages/react-chessboard, public); root + examples private.

| #   | Scenario                             | Changed files (expected)                             | Expected changeset packages                    | Auto-merge                     | Release                 |
| --- | ------------------------------------ | ---------------------------------------------------- | ---------------------------------------------- | ------------------------------ | ----------------------- |
| 1   | Core dep patch                       | `packages/chessboard/package.json` + root lock       | `@mirasen/chessboard: patch`                   | yes (patch)                    | core patch              |
| 2   | React dep patch                      | `packages/react-chessboard/package.json` + root lock | `@mirasen/react-chessboard: patch`             | yes                            | react patch             |
| 3   | Both packages, grouped PR            | both member manifests + root lock                    | both `: patch` (one changeset)                 | yes                            | both patch              |
| 4   | Root private devDep only             | root `package.json` + root lock                      | **none**                                       | yes                            | none                    |
| 5   | Lockfile-only transitive             | `package-lock.json` only                             | **none**                                       | yes                            | none                    |
| 6   | React internal dep on core           | _N/A — ignored in config_ (no PR)                    | —                                              | —                              | —                       |
| 7   | Security update (patch, manifest)    | affected member manifest + lock                      | that package `: patch`                         | yes                            | patch                   |
| 7b  | Security update (lockfile-only)      | `package-lock.json` only                             | **none**                                       | yes                            | none                    |
| 8   | Dependabot rebase / re-run           | same as original                                     | overwrite `~dependabot-pr-<n>.md` (idempotent) | unchanged                      | unchanged               |
| 9   | Existing changeset already committed | same                                                 | same deterministic file overwritten (no dup)   | unchanged                      | unchanged               |
| 10  | No publishable manifest changed      | root/lock/examples only                              | **none**                                       | yes                            | none                    |
| —   | Major dep update                     | member manifest + lock                               | that package `: patch` (still generated)       | **no** (major not auto-merged) | on manual merge → patch |

Auto-merge note: the merge gate stays keyed on `fetch-metadata`'s `update-type`
(semver-minor/patch merge; major stays open) — this is orthogonal to changeset attribution and needs
no change. "No changeset" cases still auto-merge (auto-merge does not require a changeset); they
simply produce no release, which is correct for lockfile-only/root-tooling churn.

---

## Internal (workspace) dependency updates — recommendation

**Ignore `@mirasen/chessboard` and `@mirasen/react-chessboard` in Dependabot** (config above).
Rationale:

- Changesets already coordinates the internal range on every release (`updateInternalDependencies:
patch`) — that is the correct owner of the internal bump.
- After a core release, Dependabot _could_ see a newer published `@mirasen/chessboard` on npm and try
  to bump React's `^1.x` range, creating a redundant PR that races Changesets ("chasing its own
  workspace dependency"). Ignoring the two names eliminates this class entirely at zero cost.
- If such a PR ever slipped through, the changed-files algorithm would still behave sanely (it would
  produce a `react-chessboard: patch` changeset), so the ignore is defense-in-depth, not correctness-
  critical.
  (Confidence: inference — I did not find a definitive dependabot-core issue confirming/denying
  internal-workspace-dep bumping for npm in the time available; the `ignore` is risk-free regardless.)

---

## Confidence

**Experimentally demonstrated by a public repository** (`chicio/chicio-blog`, npm workspaces, root
lockfileVersion 3):

- npm workspaces + single root `package-lock.json` + `directories: ["/","/apps/*","/packages/*"]`
  works; member manifests are updated and the root lockfile is written.
- A grouped update spans multiple member directories in ONE PR, on a branch
  `dependabot/npm_and_yarn/<group>-<hash>` with no directory segment.
- Changed files of such a PR precisely identify the affected member packages.

**Verified from source** (`dependabot/fetch-metadata@main`, `src/dependabot/update_metadata.ts`):

- `updatedDependency` includes a `directory: string` field, populated by
  `branchNameToDirectoryName()` (branch-derived, not manifest-path-derived).
- Single top-level `directory` output = the configured directory used.

**Verified/documented** (GitHub Dependabot options reference):

- `directory` vs `directories`; `directories` supports globbing/wildcards; one is required.

**Verified from our own actions** (repo inspection + grep):

- `dependabot-generate-changesets` uses a literal `directory`↔`workspaces[]` match with root fallback.
- `dependabot-auto-release` is changeset-file-based and package-agnostic (no change needed).
- `npm-release-upd-pkg-lock` / `major-release-tag` are unreferenced (not in the path).

**Inference (not independently proven here):**

- Exact `directory` string `fetch-metadata` returns for an _ungrouped, single-member_ update with
  glob `directories` (likely encodes the member dir) — we deliberately do not depend on it.
- Whether `directory: "/"` alone fully covers member-declared deps (chicio's config comment implies
  not reliably; hence listing member directories).
- Internal-workspace-dep bumping behavior for npm (mitigated by `ignore` regardless).

**Still unknown / validate on first live runs:**

- Whether Dependabot, with `directories: ["/", "/packages/*"]` + grouping, ever splits into
  per-directory PRs vs one combined PR in our specific 2-package layout. The changed-files algorithm
  is correct either way; this only affects PR volume.
- Interaction of `open-pull-requests-limit` with grouped multi-directory updates at our scale.
</content>
