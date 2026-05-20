## Why

Consumers of the first-party main renderer cannot currently shorten or disable piece move animations. The duration is hardcoded to `180` inside the animation update path, which is fine for casual play but feels sluggish in fast time controls (blitz / bullet) where every frame of perceived latency matters. Now that the renderer exposes a general runtime `getConfig` / `setConfig` API, exposing animation duration as a config field is the smallest, most consistent way to give consumers control without inventing a parallel API.

## What Changes

- Add an `animation` section to the main-renderer config with a single field, `durationMs: number`.
- `animation.durationMs` defaults to `180`, the current hardcoded value. This change extracts existing behavior into config — it does not change the default timing.
- When `animation.durationMs > 0`, the existing animation preparation/submission code path is preserved unchanged, with `durationMs` substituted for the previously-hardcoded duration constant.
- When `animation.durationMs === 0`, the animation creation branch in the existing update path is skipped: no animation plan is consumed into a session, no animation entries are created, no animation session is submitted, no pieces are suppressed for animation, and no animation lifecycle (prepare/render/clean) runs for that update. The normal renderer path then renders the final/current board state.
- `animation.durationMs` is validated as a finite number `>= 0`, using the same `assert()`-based style as `drag.pieceScale`. Negative, NaN, Infinity, and non-number inputs throw at normalization time.
- The `animation` section is automatically accepted by the existing `setConfig({ animation })` runtime path and the existing `getConfig()` snapshot — no new public methods, no `setAnimationConfig` / `getAnimationConfig`, no `disableAnimations` boolean.
- `setConfig({ animation })` updates the normalized config but does not by itself mark any dirty layer or request a render. If a single `setConfig` call also includes a section that already triggers invalidation (e.g. `colors`), that section's existing behavior is unchanged. The new `animation.durationMs` value takes effect on the next animation submission decision in the existing update path.
- Animation duration is read from the live config at the moment the existing update path decides whether to submit an animation, so runtime updates between moves are honored without rebuilding any subsystem.

## Capabilities

### New Capabilities

- `main-renderer-animation-config`: Defines the renderer's `animation` config section, its default, validation rules, the runtime semantics of `durationMs: 0` (animation creation branch is skipped; normal render path draws the final state), and the way `getConfig` / `setConfig` interact with the section. Lives alongside the existing `main-renderer-runtime-config` capability and reuses its normalization / validation pipeline rather than duplicating it.

### Modified Capabilities

<!-- None. The existing runtime setConfig/getConfig contract already accepts arbitrary new sections of `MainRendererInitOptions` that are not in the init-only `Omit` union, so no spec-level requirement of `main-renderer-runtime-config` is changing. -->

## Impact

- **Code:**
  - [src/extensions/first-party/main-renderer/types/template.ts](src/extensions/first-party/main-renderer/types/template.ts) — add `animation` section to `TMainRendererConfig`.
  - [src/extensions/first-party/main-renderer/types/internal.ts](src/extensions/first-party/main-renderer/types/internal.ts) — add `animation: { durationMs: 180 }` to `DefaultMainRendererDesktopConfig` and `DefaultMainRendererMobileConfig`.
  - [src/extensions/first-party/main-renderer/normalize.ts](src/extensions/first-party/main-renderer/normalize.ts) — extend `validateMainRendererConfig` to assert `animation.durationMs` is a finite number `>= 0`.
  - [src/extensions/first-party/main-renderer/animation/update.ts](src/extensions/first-party/main-renderer/animation/update.ts) — at the existing animation creation/submission decision point, replace the hardcoded duration constant with a read of the live `animation.durationMs`, and skip the animation creation branch entirely when the value is `0`.
  - [src/extensions/first-party/main-renderer/animation/types.ts](src/extensions/first-party/main-renderer/animation/types.ts) — wire the animation subsystem to access live config (via the same getter-closure pattern used by board / coordinates / drag).
  - [src/extensions/first-party/main-renderer/animation/factory.ts](src/extensions/first-party/main-renderer/animation/factory.ts) — accept the config getter and store it on the subsystem state.
  - [src/extensions/first-party/main-renderer/factory.ts](src/extensions/first-party/main-renderer/factory.ts) — pass the config getter into the animation subsystem; `configToPublic` clones the new `animation` section into the snapshot returned by `getConfig()`. The `setConfig` body needs no animation-specific change: no new dirty layer, no render request when only `animation` changes; the existing `colors` invalidation logic is unaffected.
- **Public types / API:** No new exported method names. `MainRendererInitOptions` and `MainRendererSetConfigOptions` gain an optional `animation` section through the existing template-derived chain. `MainRendererConfigPublic` gains a normalized `animation` section returned by `getConfig()`.
- **Tests:**
  - [tests/extensions/first-party/main-renderer/normalize.spec.ts](tests/extensions/first-party/main-renderer/normalize.spec.ts) — add cases for default value, custom positive, zero, partial-merge, and validation rejection.
  - [tests/extensions/first-party/main-renderer/factory/public-api.spec.ts](tests/extensions/first-party/main-renderer/factory/public-api.spec.ts) — add cases for `getConfig().animation`, `setConfig({ animation })` updates being render-neutral, validation rejection through `setConfig`, and snapshot isolation.
  - Existing main-renderer animation test harness — add cases that exercise the animation update path under custom positive duration and under `durationMs === 0`, asserting that the no-animation case results in no submission, no entries, and no suppression for that update.
- **Docs / examples:** No README change required for this proposal.
- **Dependencies:** None. Reuses `assert` and `es-toolkit/object`'s `toMerged` already in use.
- **Out of scope:** No redesign of `getConfig` / `setConfig`. No changes to the animation planner, the planning-vs-execution split, or coordinated multi-piece behavior. No move-type special-casing. No new dirty layers. No new "completion" or "commit" path; the no-animation case relies on the normal render path and not on a fake 0ms animation. No new integration test infrastructure beyond what the existing main-renderer animation harness already provides.
