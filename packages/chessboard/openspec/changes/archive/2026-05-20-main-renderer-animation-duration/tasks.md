## 1. Read existing code before changing it

- [x] 1.1 Read [src/extensions/first-party/main-renderer/animation/update.ts](src/extensions/first-party/main-renderer/animation/update.ts) end-to-end and identify the exact decision point where the animation plan is consumed and `runtimeSurface.animation.submit` is called
- [x] 1.2 Read [src/extensions/first-party/main-renderer/animation/factory.ts](src/extensions/first-party/main-renderer/animation/factory.ts) and [src/extensions/first-party/main-renderer/animation/types.ts](src/extensions/first-party/main-renderer/animation/types.ts) and confirm the subsystem-state shape and getter-injection pattern (mirroring board / coordinates)
- [x] 1.3 Read [src/extensions/first-party/main-renderer/animation/render.ts](src/extensions/first-party/main-renderer/animation/render.ts) to confirm that suppressed-square computation and the prepare/render/clean lifecycle key off `state.entries` and the runtime animation surface, and that "no entry for this update" naturally yields no suppression and no lifecycle work for that update
- [x] 1.4 Read [src/extensions/first-party/main-renderer/normalize.ts](src/extensions/first-party/main-renderer/normalize.ts), [src/extensions/first-party/main-renderer/types/template.ts](src/extensions/first-party/main-renderer/types/template.ts), [src/extensions/first-party/main-renderer/types/internal.ts](src/extensions/first-party/main-renderer/types/internal.ts), [src/extensions/first-party/main-renderer/types/public.ts](src/extensions/first-party/main-renderer/types/public.ts), and [src/extensions/first-party/main-renderer/factory.ts](src/extensions/first-party/main-renderer/factory.ts) to confirm the validation/normalization/defaults/`configToPublic`/`setConfig` plumbing the change will hook into

## 2. Config types

- [x] 2.1 Add a `MainRendererConfigAnimation` interface with `durationMs: number` and the `animation` section to `TMainRendererConfig<TPieceUrls>` in [src/extensions/first-party/main-renderer/types/template.ts](src/extensions/first-party/main-renderer/types/template.ts)
- [x] 2.2 Confirm that `MainRendererConfig`, `MainRendererConfigPublic`, `MainRendererInitOptions`, and `MainRendererSetConfigOptions` automatically pick up the new section through the existing template-derived chain

## 3. Defaults

- [x] 3.1 Add `animation: { durationMs: 180 }` to `DefaultMainRendererDesktopConfig` in [src/extensions/first-party/main-renderer/types/internal.ts](src/extensions/first-party/main-renderer/types/internal.ts)
- [x] 3.2 Add the same `animation: { durationMs: 180 }` to `DefaultMainRendererMobileConfig` in the same file

## 4. Validation

- [x] 4.1 In `validateMainRendererConfig` in [src/extensions/first-party/main-renderer/normalize.ts](src/extensions/first-party/main-renderer/normalize.ts), add `assert(Number.isFinite(animation.durationMs), 'animation.durationMs must be a finite number')` matching the existing `drag.pieceScale` style
- [x] 4.2 Add `assert(animation.durationMs >= 0, 'animation.durationMs must be >= 0')` immediately after
- [x] 4.3 Confirm that `toMerged` partial-merge in `normalizeMainRendererConfig` handles the new section: an empty `animation: {}` falls back to the default, partial input merges over it

## 5. Animation subsystem wiring

- [x] 5.1 Extend `MainRendererAnimationInternal` in [src/extensions/first-party/main-renderer/animation/types.ts](src/extensions/first-party/main-renderer/animation/types.ts) with a `readonly getAnimationConfig: () => MainRendererConfig['animation']` field, mirroring the color-getter pattern
- [x] 5.2 Update `createMainRendererAnimation` in [src/extensions/first-party/main-renderer/animation/factory.ts](src/extensions/first-party/main-renderer/animation/factory.ts) to accept the getter as a parameter and store it on `state`
- [x] 5.3 In `createMainRendererInternal` in [src/extensions/first-party/main-renderer/factory.ts](src/extensions/first-party/main-renderer/factory.ts), pass `() => internalState.config.animation` to `createMainRendererAnimation` (forward reference is fine — same pattern as the existing color getters at `factory.ts:72-73`)

## 6. Wire durationMs into the existing animation update path

- [x] 6.1 In `rendererAnimationOnUpdate` in [src/extensions/first-party/main-renderer/animation/update.ts](src/extensions/first-party/main-renderer/animation/update.ts), remove the module-level `DEFAULT_ANIMATION_DURATION_MS` constant
- [x] 6.2 At the existing animation creation decision point, add an early return when `state.getAnimationConfig().durationMs === 0` that runs BEFORE `runtimeSurface.animation.submit` is called and BEFORE any entry is inserted into `state.entries`. This early return must not call `submit`, must not insert entries, must not run suppression, and must not invoke any prepare/render/clean lifecycle. (Placing the early return before `calculateAnimationPlan` is fine if simpler; the choice is local but must satisfy all of the above.)
- [x] 6.3 In the existing `submit` call, pass the live `state.getAnimationConfig().durationMs` instead of the removed constant
- [x] 6.4 Verify by reading that no other code path in the main-renderer animation subsystem still references the removed constant
- [x] 6.5 Verify by reading that the `durationMs === 0` branch does not introduce a parallel completion / commit path: there is no synthetic session-finish, no immediate-cleanup call, no second pipeline. The branch is purely an early return.

## 7. Public API surface

- [x] 7.1 Update `configToPublic` in [src/extensions/first-party/main-renderer/factory.ts:45-51](src/extensions/first-party/main-renderer/factory.ts#L45-L51) to include `animation: cloneDeep(config.animation)` in the returned snapshot
- [x] 7.2 Confirm by reading that `setConfig` in [src/extensions/first-party/main-renderer/factory.ts:96-113](src/extensions/first-party/main-renderer/factory.ts#L96-L113) needs no animation-specific change: no new dirty layer is introduced, no `requestRender` call is added for the animation section, and the existing `colors` invalidation logic is unaffected even when `setConfig` is called with both `animation` and `colors` together

## 8. Tests — normalization & validation (existing harness)

- [x] 8.1 In [tests/extensions/first-party/main-renderer/normalize.spec.ts](tests/extensions/first-party/main-renderer/normalize.spec.ts), add a test asserting that the desktop and mobile defaults both expose `animation.durationMs === 180`
- [x] 8.2 Add a test asserting `normalizeMainRendererConfig({ animation: { durationMs: 250 } }, DefaultMainRendererDesktopConfig).animation.durationMs === 250`
- [x] 8.3 Add a test asserting `normalizeMainRendererConfig({ animation: { durationMs: 0 } }, ...).animation.durationMs === 0`
- [x] 8.4 Add a test asserting `normalizeMainRendererConfig({ animation: {} }, ...).animation.durationMs === 180` (empty section falls back to default)
- [x] 8.5 Add a test asserting that an omitted `animation` section produces a normalized object whose `animation` deep-equals the default's `animation`
- [x] 8.6 Add `expect(() => normalize…).toThrow()` cases for `durationMs: -1`, `Number.NaN`, `Number.POSITIVE_INFINITY`, `Number.NEGATIVE_INFINITY`, and a non-number value (e.g. `'180' as unknown as number`), in the same style as the existing `drag.pieceScale` rejection tests

## 9. Tests — public API (existing harness)

- [x] 9.1 In [tests/extensions/first-party/main-renderer/factory/public-api.spec.ts](tests/extensions/first-party/main-renderer/factory/public-api.spec.ts), add a test asserting that `getConfig().animation.durationMs` is `180` for a default-constructed renderer
- [x] 9.2 Add a test asserting that `setConfig({ animation: { durationMs: 75 } })` updates `getConfig().animation.durationMs` to `75` AND does not mark any dirty layer AND does not request a render (using the harness's existing render/invalidation observation pattern)
- [x] 9.3 Add a test asserting that `setConfig({ animation: { durationMs: 75 }, colors: { board: { light: '#ffffff' } } })` updates `animation.durationMs` to `75` AND that the existing `colors`-section invalidation/render-request behavior is unchanged
- [x] 9.4 Add a test asserting that `setConfig({ animation: { durationMs: -5 } })` throws and leaves `getConfig().animation.durationMs` unchanged
- [x] 9.5 Add a test asserting that mutating the object returned by `getConfig().animation` does not affect a subsequent `getConfig()` call

## 10. Tests — animation update path (existing main-renderer animation harness)

- [x] 10.1 Locate the existing test harness used to drive `rendererAnimationOnUpdate` (search under `tests/extensions/first-party/main-renderer/animation/` or the equivalent — do NOT introduce new integration helpers if the existing harness can drive the update path narrowly)
- [x] 10.2 Add a test that constructs a renderer with `animation: { durationMs: 350 }`, drives the existing update path with a piece move that yields a non-empty plan, and asserts the existing `runtimeSurface.animation.submit` call (or its harness spy) was invoked with `{ duration: 350 }`
- [x] 10.3 Add a test that constructs a renderer with `animation: { durationMs: 0 }`, drives the existing update path with a piece move that would otherwise yield a non-empty plan, and asserts ALL of: `runtimeSurface.animation.submit` was NOT called for that update, no new entry was inserted into the animation subsystem's entries map, the suppressed-squares query returns the empty set for that update, and no prepare/render/clean lifecycle ran for that update. The test MUST NOT assert that an animation finishes immediately, MUST NOT expect a zero-duration session, and MUST NOT introduce broad new integration helpers.
- [x] 10.4 Add a test that calls `setConfig({ animation: { durationMs: 75 } })` mid-life on a previously-default renderer, then drives a move through the existing update path, and asserts the resulting submission used `duration: 75` (proves live-read semantics)
- [x] 10.5 Add a test that drives a coordinated multi-piece move (e.g. castle) through the existing update path under `animation: { durationMs: 350 }` and asserts the single coordinated session is submitted with `duration: 350`, with the planner output otherwise unchanged

## 11. Verification

- [x] 11.1 Run `npm run check` and address any type errors
- [x] 11.2 Run `npm run lint` and address any lint errors
- [x] 11.3 Run `npm run test` and confirm all new and existing tests pass
- [x] 11.4 Spot-check by reading the final diff to confirm: no new public methods on `RendererPublicAPI`, no `disableAnimations` field, no new dirty layer, no move-type special-cases, no zero-duration submissions, no synthetic completion path, no parallel animation pipeline, no new integration test infrastructure
