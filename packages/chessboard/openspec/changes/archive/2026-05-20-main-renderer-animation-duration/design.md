## Context

The first-party main renderer animates piece moves with a single hardcoded duration: `DEFAULT_ANIMATION_DURATION_MS = 180` at [src/extensions/first-party/main-renderer/animation/update.ts:10](src/extensions/first-party/main-renderer/animation/update.ts#L10), passed verbatim into `state.runtimeSurface.animation.submit({ duration })`. There is no public way to shorten or disable this animation.

The relevant decision point is concentrated in `rendererAnimationOnUpdate` ([src/extensions/first-party/main-renderer/animation/update.ts](src/extensions/first-party/main-renderer/animation/update.ts)). On every renderable mutation that touches board or change state, this function:

1. Calls `calculateAnimationPlan(...)` from the shared planner.
2. Returns early if `plan.tracks.length === 0` (no animation needed).
3. Otherwise calls `state.runtimeSurface.animation.submit({ duration })` and records an entry in `state.entries` keyed by `session.id`.

The lifecycle that follows (`rendererAnimationPrepare` / `rendererAnimationRender` / `rendererAnimationClean` and piece suppression via `getAnimationSuppressedSquares`) is driven entirely by what's in `state.entries`. If no entry is added, none of that lifecycle runs for this update; the regular render path renders the post-mutation board state directly.

A previous change (`main-renderer-runtime-set-config`, archived 2026-05-20) introduced a general `getConfig` / `setConfig` API on the renderer's public interface. That API:

- Derives `MainRendererSetConfigOptions` from `MainRendererInitOptions` by `Omit`-ing init-only sections (`'pieceUrls'`).
- Reuses the init-time normalization pipeline (`normalizeMainRendererConfig` in [src/extensions/first-party/main-renderer/normalize.ts](src/extensions/first-party/main-renderer/normalize.ts)) for runtime updates with the current config as the base.
- Validates synchronously via `assert()` from `@ktarmyshov/assert`, throwing on invalid input.
- Lets subsystems read config through getter closures over `internalState.config` so runtime updates take effect on the next render without re-creating subsystems.
- Marks dirty layers and calls `requestRender` only for sections that affect already-painted output (currently `colors`).

Adding `animation.durationMs` is the natural next user of that infrastructure: it should plug into the existing config shape, validation, defaults, normalization, and runtime mutator without inventing a parallel API, and it should wire into the existing animation creation/submission decision point in `rendererAnimationOnUpdate` rather than introducing a parallel pipeline or completion path.

## Goals / Non-Goals

**Goals:**

- Add a single config field, `animation.durationMs: number`, that controls piece transition animation duration.
- Default `180` (current hardcoded value). This change extracts existing behavior into config; it does not change the default timing. The existing observable animation duration and lifecycle are preserved when `animation` is omitted.
- When `animation.durationMs > 0`, preserve the existing animation creation/submission behavior in `rendererAnimationOnUpdate`, substituting `durationMs` for the previously-hardcoded constant.
- When `animation.durationMs === 0`, skip the animation creation branch in `rendererAnimationOnUpdate`: do not consume the plan into a session, do not call `runtimeSurface.animation.submit`, do not insert an entry into `state.entries`, do not suppress pieces, and do not run any prepare/render/clean lifecycle for that update. The normal render path then draws the current/final board state.
- Reuse the existing init / runtime config pipeline for normalization, validation, and runtime updates. The animation subsystem reads the live duration at the moment of the existing decision point.
- Same validation style as `drag.pieceScale`: `assert()`-based, throws synchronously on invalid input. Reject `< 0`, `NaN`, `Infinity`, and non-numbers.
- Keep `setConfig({ animation })` render-neutral: no new dirty layer, no `requestRender` call from the animation section alone. If a single `setConfig` call also includes a section that already triggers invalidation (e.g. `colors`), that section's existing behavior is unchanged.

**Non-Goals:**

- No redesign of `getConfig` / `setConfig`, no `setAnimationConfig` / `getAnimationConfig`, no `disableAnimations` boolean.
- No new dirty layer for animation.
- No new completion / commit / direct-apply path. The no-animation case is "skip the creation branch and let the normal render path draw the final state" — not "submit and immediately finish".
- No fake 0ms animation, no zero-duration session, no synthetic immediate cleanup.
- No move-type special-casing (castle / capture / promotion all share the same duration).
- No changes to the planner, the timing curve, the WAAPI / SVG attribute transition execution mechanics, or the runtime animation surface contract.
- No persistence, no per-instance presets ("blitz mode"), no UI affordance.
- No new integration test infrastructure. Tests use the existing main-renderer normalize / public-api / animation harness.

## Decisions

### Decision 1: `animation` is a config section under `MainRendererConfig`, not a separate API

Add `animation: { durationMs: number }` to `TMainRendererConfig<TPieceUrls>` in [src/extensions/first-party/main-renderer/types/template.ts](src/extensions/first-party/main-renderer/types/template.ts). It rides the same template → `MainRendererConfig` → `MainRendererInitOptions` → `MainRendererSetConfigOptions` chain as `colors` and `drag`.

Why: the runtime-config spec already states that any new section of `MainRendererInitOptions` not in the init-only `Omit` union is automatically accepted by `setConfig`. Adding `animation` as a sibling section gets `setConfig({ animation: { durationMs } })`, `getConfig().animation`, partial-merge semantics, and validation hookup for free, with no new public surface.

Alternatives considered:

- A top-level scalar `animationDurationMs` on the config root. Rejected — breaks the section grouping pattern that `colors` and `drag` use, and forecloses on adding sibling animation fields later (e.g. easing).
- A new public method `setAnimationConfig`. Rejected explicitly by the requirements; the previous change deliberately removed `setDragConfig` / `getDragConfig` in favor of `setConfig({ drag })`.
- A boolean `disableAnimations`. Rejected explicitly; `durationMs: 0` carries the same meaning with one less knob.

### Decision 2: Default `durationMs` is `180`, matching the current hardcoded value

Add `animation: { durationMs: 180 }` to both `DefaultMainRendererDesktopConfig` and `DefaultMainRendererMobileConfig` in [src/extensions/first-party/main-renderer/types/internal.ts](src/extensions/first-party/main-renderer/types/internal.ts). The hardcoded constant in `update.ts` is removed.

Why: this change extracts existing behavior into config rather than retiming animations. The default config preserves the current 180ms animation behavior. If a future change wants to retime, that's a separate proposal with its own changelog.

Alternatives considered:

- `200` (rounder number, originally floated in the requirements doc). Rejected — would silently change the observable animation duration for every existing consumer.

### Decision 3: Validation: `Number.isFinite(x) && x >= 0`, asserted synchronously

Extend `validateMainRendererConfig` in [src/extensions/first-party/main-renderer/normalize.ts](src/extensions/first-party/main-renderer/normalize.ts) with two assertions on `config.animation.durationMs`:

```ts
assert(Number.isFinite(durationMs), 'animation.durationMs must be a finite number');
assert(durationMs >= 0, 'animation.durationMs must be >= 0');
```

Why: matches the existing `drag.pieceScale` validation pattern exactly (synchronous `assert()` from `@ktarmyshov/assert`, message format, throw-on-invalid contract). `Number.isFinite` rejects `NaN`, `+Infinity`, `-Infinity`, and non-numbers in one check. The `>= 0` assertion (rather than `> 0` as on `pieceScale`) is the single intentional difference, because `0` is a meaningful valid value here meaning "no animation".

Alternatives considered:

- Use a Result/Either return type. Rejected — diverges from the established style and would require special handling at the `setConfig` call site.
- Clamp invalid values silently (e.g. negative → 0). Rejected — the runtime-config contract is "fail at normalization time", and silent clamping hides bugs in callers.

### Decision 4: Animation subsystem reads `durationMs` from the live config at the existing decision point

Replace the `DEFAULT_ANIMATION_DURATION_MS` constant in `animation/update.ts` with a read of `state.config.animation.durationMs` at the moment `state.runtimeSurface.animation.submit({ duration })` is called. Wire this through by giving the animation subsystem a config getter closure, mirroring the pattern already used for `board` (color getter) and `coordinates` (color getter) at [src/extensions/first-party/main-renderer/factory.ts:72-73](src/extensions/first-party/main-renderer/factory.ts#L72-L73).

Concretely:

- `MainRendererAnimationInternal` in [src/extensions/first-party/main-renderer/animation/types.ts](src/extensions/first-party/main-renderer/animation/types.ts) gains `readonly getAnimationConfig: () => MainRendererConfig['animation']`.
- `createMainRendererAnimation` in [src/extensions/first-party/main-renderer/animation/factory.ts](src/extensions/first-party/main-renderer/animation/factory.ts) accepts the getter and stores it on `state`.
- `createMainRendererInternal` in [src/extensions/first-party/main-renderer/factory.ts](src/extensions/first-party/main-renderer/factory.ts) passes `() => internalState.config.animation` (forward reference, same as the existing color getters).
- `rendererAnimationOnUpdate` in [src/extensions/first-party/main-renderer/animation/update.ts](src/extensions/first-party/main-renderer/animation/update.ts) reads `state.getAnimationConfig().durationMs` instead of the hardcoded constant.

Why: matches the established subsystem pattern; runtime `setConfig({ animation: { durationMs } })` updates are observed by the very next move without any subsystem rewiring or render request. Reading at the existing submission decision point (rather than at planner time or at session-creation time) is the natural seam — that is exactly where `duration` is consumed today.

Alternatives considered:

- Snapshot duration into a planner-emitted track field. Rejected — leaks renderer policy into the shared planner, and the planner currently doesn't know about timing.
- Push duration via `setConfig` into a subsystem-local cached value. Rejected — getter closure already gives us "always live" reads with zero plumbing for invalidation.

### Decision 5: `durationMs: 0` skips the animation creation branch entirely

When `state.getAnimationConfig().durationMs === 0`, `rendererAnimationOnUpdate` skips the animation creation branch: it does not call `calculateAnimationPlan` (or, if it does, it does not consume the result), it does not call `state.runtimeSurface.animation.submit(...)`, and it does not insert an entry into `state.entries`. As a consequence:

- No animation session exists for this update.
- `getAnimationSuppressedSquares()` returns the empty set (its result is derived from `state.runtimeSurface.animation.getAll([...])` ∩ `state.entries`, both of which are empty for this update).
- No prepare / render / clean lifecycle runs for this update.
- The normal renderer render path runs as usual and draws the current/final board state.

The implementation does NOT submit a zero-duration session, does NOT create an animation entry to be cleaned up immediately, and does NOT route through any "complete an animation right away" path. There is no synthetic completion/commit step; the entire mechanism is "the creation branch did not run, so there is nothing to complete".

Why: the requirement is explicit that `durationMs: 0` must not rely on a 0ms timer or a parallel completion path if a cleaner skip exists. The architecture already supports a skip — the empty-plan early return at [src/extensions/first-party/main-renderer/animation/update.ts:35](src/extensions/first-party/main-renderer/animation/update.ts#L35) — and the `getSuppressedSquares` / lifecycle code is already correct for "no entry exists for this update". Reusing that property keeps the change small and avoids inventing any new path.

Alternatives considered:

- Pass `duration: 0` to `runtimeSurface.animation.submit`. Rejected — even if the runtime animation surface handles it gracefully, it still allocates a session, records an entry, prepares nodes, suppresses pieces, and runs a one-frame lifecycle. This is observably wrong (suppression briefly leaks; node DOM is touched needlessly) and is exactly what the requirement forbids.
- Special-case the planner to emit zero tracks when duration is 0. Rejected — leaks policy into the planner.
- Add an "immediate-finish" branch that submits and synthetically completes a session. Rejected — introduces a parallel completion path the rest of the codebase does not have.

### Decision 6: `setConfig({ animation })` is render-neutral

The `setConfig` body in [src/extensions/first-party/main-renderer/factory.ts:96-113](src/extensions/first-party/main-renderer/factory.ts#L96-L113) is unchanged for the `animation` section: no new dirty bit, no `requestRender` call when only `animation` changes. The new `animation.durationMs` value takes effect on the next animation creation decision in the existing update path.

If a single `setConfig` call also includes another section that already triggers invalidation (notably `colors`), that other section's existing dirty-marking and render-request behavior is unchanged. The animation section neither suppresses nor amplifies that behavior.

Why: matches the existing `drag` precedent — drag-only updates also don't request a render. The rule is "request a render only when there's already-painted output to refresh". Animation config has no painted output to refresh. The next animation creation decision picks up the new value through the live getter.

Alternatives considered:

- Add `DirtyLayer.Animation` and request a render on every `setConfig({ animation })`. Rejected — the proposal explicitly says no new dirty layers, and there's no painted state to invalidate.

### Decision 7: Public types — `animation` appears on `MainRendererConfigPublic`, init options, and set options

`configToPublic` in [src/extensions/first-party/main-renderer/factory.ts:45-51](src/extensions/first-party/main-renderer/factory.ts#L45-L51) gains a `cloneDeep(config.animation)` line so `getConfig().animation` returns an isolated, normalized snapshot. `MainRendererConfigPublic`, `MainRendererInitOptions`, and `MainRendererSetConfigOptions` all derive from the same template, so adding `animation` to the template propagates automatically.

Why: matches the existing `drag` and `colors` treatment; `getConfig` is contractually a deep, isolated snapshot.

## Risks / Trade-offs

- **Risk:** A consumer relies on the exact 180ms timing as a layout-coordination hack (e.g. they trigger another animation 180ms after a move). → **Mitigation:** the default config preserves the current 180ms animation behavior; consumers who don't pass `animation` see no change. Documented in the proposal.
- **Risk:** Reading config at the submission decision point means a `setConfig({ animation: { durationMs: 0 } })` mid-animation does not cancel the in-flight animation. → **Mitigation:** by design — the existing animation session is owned by the runtime animation surface and runs to completion. Aborting in-flight animations is outside this change. The next move respects the new value.
- **Risk:** The `durationMs: 0` path bypasses the animation lifecycle entirely; if a future feature relies on the lifecycle running for every move (e.g. piece-suppression hooks for non-animation reasons), it could be surprised. → **Mitigation:** the spec is explicit that under `durationMs: 0` no entry is created for that update, no suppression is recorded for that update, and the regular render path draws the final state — same shape as the existing empty-plan early return.
- **Trade-off:** Reading config at submission time (rather than once per session) means a runtime `setConfig` mid-game changes timing on the next move, not on a session boundary the consumer controls. This is consistent with how every other section (`colors`, `drag`) behaves and is the simpler model.
- **Trade-off:** The `>= 0` validation deviates from the `drag.pieceScale` `> 0` rule. Documented in the validation message and in the spec scenario.

## Migration Plan

This is a purely additive change. The default config preserves the current 180ms animation behavior, so consumers who don't opt in see no observable difference.

1. Add the `animation` section to the template, defaults, normalization, and validation.
2. Wire the animation subsystem to read from the live config and skip the creation branch when `durationMs === 0`.
3. Add tests for normalization/validation, public API, and the animation update path.
4. No consumer migration required. No deprecated symbols. No release-note action item beyond "you can now pass `{ animation: { durationMs } }`".

Rollback: revert the change. No data migration, no feature flag, no staged rollout.

## Open Questions

None. Defaults question (180 vs 200) was resolved with the requester in favor of preserving current behavior at 180.
