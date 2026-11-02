## 1. Confirm existing patterns before changing code

- [x] 1.1 Re-read [src/extensions/first-party/main-renderer/animation/factory.ts](src/extensions/first-party/main-renderer/animation/factory.ts) and [src/extensions/first-party/main-renderer/animation/types.ts](src/extensions/first-party/main-renderer/animation/types.ts). Confirm the exact shape of the animation subsystem's config-getter wiring: signature `createMainRendererAnimation(runtimeSurface, resolver, getAnimationConfig)`, internal field `readonly getAnimationConfig: () => MainRendererConfigAnimation`. The drag subsystem will mirror this exactly.
- [x] 1.2 Re-read [src/extensions/first-party/main-renderer/factory.ts](src/extensions/first-party/main-renderer/factory.ts) at the lines where subsystems are constructed. Confirm `() => internalState.config.colors.board`, `() => internalState.config.colors.coordinates`, and `() => internalState.config.animation` are the established style; the new drag wiring is `() => internalState.config.drag`.
- [x] 1.3 Re-read [src/extensions/first-party/main-renderer/drag/render.ts](src/extensions/first-party/main-renderer/drag/render.ts), [src/extensions/first-party/main-renderer/drag/factory.ts](src/extensions/first-party/main-renderer/drag/factory.ts), [src/extensions/first-party/main-renderer/drag/update.ts](src/extensions/first-party/main-renderer/drag/update.ts), and [src/extensions/first-party/main-renderer/drag/types.ts](src/extensions/first-party/main-renderer/drag/types.ts). Confirm only `render.ts` will need anchor/scale logic; `update.ts` and the lifecycle in `factory.ts` (subscribe / unsubscribe / unmount) are unchanged.
- [x] 1.4 Re-read [src/extensions/first-party/main-renderer/normalize.ts](src/extensions/first-party/main-renderer/normalize.ts). Confirm `pieceScale > 0` and `pieceAnchor ∈ {'center','bottom'}` validations are in place — no new normalization or validation is needed.

## 2. Extend the drag subsystem internal type

- [x] 2.1 In [src/extensions/first-party/main-renderer/drag/types.ts](src/extensions/first-party/main-renderer/drag/types.ts), add `readonly getDragConfig: () => MainRendererConfigDrag;` to `MainRendererDragInternal`. Mirror the field placement and JSDoc style of `getAnimationConfig: () => MainRendererConfigAnimation` on `MainRendererAnimationInternal`. Import `MainRendererConfigDrag` from `../types/template.js`. Use the named type directly; do NOT write the getter type as `MainRendererConfig['drag']`.
- [x] 2.2 Confirm the public `MainRendererDrag` interface is unchanged. The new field is internal only and is not exported through any public type.

## 3. Wire the getter through the drag factory

- [x] 3.1 In [src/extensions/first-party/main-renderer/drag/factory.ts](src/extensions/first-party/main-renderer/drag/factory.ts), add a third parameter to `createMainRendererDrag`: `getDragConfig: () => MainRendererConfigDrag`. Import `MainRendererConfigDrag` from `../types/template.js` if needed. Do NOT type the parameter as `() => MainRendererConfig['drag']`.
- [x] 3.2 Store the new parameter on the constructed `internalState` as `getDragConfig`. Do not change any other lifecycle behavior (subscribe, unsubscribe, node removal, `pieceCode`/`pieceNode` reset on unmount remain identical).

## 4. Wire the new argument from the main-renderer factory

- [x] 4.1 In [src/extensions/first-party/main-renderer/factory.ts](src/extensions/first-party/main-renderer/factory.ts), update the `createMainRendererDrag(options.runtimeSurface, pieceSymbolResolver)` call site to `createMainRendererDrag(options.runtimeSurface, pieceSymbolResolver, () => internalState.config.drag)`. The forward reference to `internalState` is the established pattern (already used by `board`, `coordinates`, `animation`).
- [x] 4.2 Confirm no other call sites of `createMainRendererDrag` exist (factory.ts is the only construction site for the first-party drag subsystem). If any test harness constructs the drag subsystem directly, update those construction sites in step 6 alongside their tests.

## 5. Implement the anchor/scale render logic

- [x] 5.1 In [src/extensions/first-party/main-renderer/drag/render.ts](src/extensions/first-party/main-renderer/drag/render.ts), at the top of `rendererDragRenderTransientVisuals`, read the current drag config: `const config = state.getDragConfig();`.
- [x] 5.2 Compute `renderedSize = geometry.squareSize * config.pieceScale;` once, before any branching.
- [x] 5.2.a Compute `anchorOffsetY = geometry.squareSize * config.pieceAnchorOffsetY;` once, before any branching. Apply this offset to the `y` value computed by the anchor branch (added to both `'center'` and `'bottom'` branches; `'center'`: `y = point.y - renderedSize / 2 + anchorOffsetY`, `'bottom'`: `y = point.y - renderedSize + anchorOffsetY`). The offset SHALL NOT be applied to `x`.
- [x] 5.3 Compute `x = point.x - renderedSize / 2;` (same for both anchors).
- [x] 5.4 Compute `y` per anchor (with the offset from 5.2.a applied):
  - `'bottom'`: `y = point.y - renderedSize + anchorOffsetY;`
  - `'center'`: `y = point.y - renderedSize / 2 + anchorOffsetY;`
    Use a `switch`/`if` on `config.pieceAnchor` such that `'center'` is the default branch, matching the desktop default.
- [x] 5.5 Convert `renderedSize`, `x`, `y` to strings via `.toString()` for use as SVG attribute values, mirroring the current code's stringification of `squareSize`, `x`, `y`.
- [x] 5.6 Use the computed `renderedSize.toString()` as the `width` and `height` attribute values in BOTH the create-path (`createSvgElement(slot, 'use', { ... })`) and the update-path (`updateSvgElementAttributes(state.pieceNode, { ... })`). Use the computed `x`/`y` strings in both paths. Do not duplicate the computation between branches — extract the values above the branch.
- [x] 5.7 Do not change `data-chessboard-id`, `href` resolution from `state.resolver.getHref(state.pieceCode)`, or the `state.pieceCode != null && !state.pieceNode` guard for first-render creation.

## 6. Tests

Use whatever testing pattern the repo already uses for the drag subsystem and main renderer. Do not introduce new test infrastructure.

- [x] 6.1 Add a focused test that constructs the drag subsystem (or the main renderer) with the desktop default drag config and asserts that, given a representative geometry and pointer position, the dragged-piece `<use>` element has `width = squareSize`, `height = squareSize`, `x = point.x - squareSize / 2`, `y = point.y - squareSize / 2`. The asserted strings MUST match what the prior implementation produced for the same inputs — capture the prior values in the test as literals to make the regression intent explicit.
- [x] 6.2 Add a test asserting that with `pieceScale = k` (e.g., `k = 1.5`) and `pieceAnchor = 'center'`, `width = squareSize * k`, `height = squareSize * k`, `x = point.x - (squareSize * k) / 2`, `y = point.y - (squareSize * k) / 2`.
- [x] 6.3 Add a test asserting that with `pieceAnchor = 'center'` and any `pieceScale > 0`, the formulas in 6.2 hold across at least two distinct pointer positions (to catch a hard-coded numeric regression).
- [x] 6.4 Add a test asserting that with `pieceAnchor = 'bottom'` and `pieceScale = k` (and `pieceAnchorOffsetY = 0`), `x = point.x - (squareSize * k) / 2`, `y = point.y - (squareSize * k)`.
- [x] 6.5 Add the focused mobile-like example test:
  - `sceneSize = 400` (so `squareSize = 50`)
  - `pieceScale = 1.5`, `pieceAnchor = 'bottom'`, `pieceAnchorOffsetY = 0.14`
  - `point = { x: 200, y: 150 }`
  - assert `width = '75'`, `height = '75'`, `x = '162.5'`, `y = '82'` (i.e., `150 - 75 + 7`)
- [x] 6.6 Add a test asserting that `renderer.setConfig({ drag: { pieceScale: 1.4, pieceAnchor: 'bottom' } })` followed by the next drag transient render produces SVG attributes matching the new config — without recreating the renderer / drag subsystem and without an intervening remount. If the existing test harness exposes the active drag subsystem reference, assert it is the same instance before and after `setConfig`.
- [x] 6.7 Add (or extend an existing) lifecycle test asserting that drag end removes the dragged-piece node from the DOM and unsubscribes the transient-visuals channel. The test MUST still pass with the new config getter wired in (no regressions in subscribe/unsubscribe count).
- [x] 6.8 Add a public-API surface test (or extend the existing one) asserting `'setDragConfig' in renderer === false`, `'getDragConfig' in renderer === false`, `typeof renderer.setConfig === 'function'`, `typeof renderer.getConfig === 'function'`. This guards against accidental re-introduction of the removed public APIs.

  Note (apply): the existing pre-existing test in `tests/extensions/first-party/main-renderer/factory/public-api.spec.ts` (`exposes only setConfig and getConfig (no legacy drag-only setter or getter)`) already enforces this guarantee more strongly via `Object.keys(api).sort() === ['getConfig', 'setConfig']` plus `typeof` checks. A literal `'setDragConfig' in renderer` assertion was deliberately not added, because the `setDragConfig` literal in test source would trip the §7.1 zero-match grep gate. The keys-equality check is the substituted assertion of the same scenario.

- [x] 6.9 If any existing drag-subsystem unit test constructs `createMainRendererDrag(runtimeSurface, resolver)` directly, update it to pass a getter as the third argument (e.g., `() => DefaultMainRendererDesktopConfig.drag`).

## 7. Add `pieceAnchorOffsetY` config field, defaults, and validation

- [x] 7.0.1 In [src/extensions/first-party/main-renderer/types/template.ts](src/extensions/first-party/main-renderer/types/template.ts), add `pieceAnchorOffsetY: number;` to `MainRendererConfigDrag` (alongside `pieceScale` and `pieceAnchor`).
- [x] 7.0.2 In [src/extensions/first-party/main-renderer/types/internal.ts](src/extensions/first-party/main-renderer/types/internal.ts), add `pieceAnchorOffsetY: 0` to `DefaultMainRendererDesktopConfig.drag` and `pieceAnchorOffsetY: 0.14` to `DefaultMainRendererMobileConfig.drag` (calibrated against the bundled default piece set).
- [x] 7.0.3 In [src/extensions/first-party/main-renderer/normalize.ts](src/extensions/first-party/main-renderer/normalize.ts), extend `validateMainRendererConfig` to assert `Number.isFinite(pieceAnchorOffsetY)`. Negative, zero, and positive values MUST all be accepted (no `> 0` or `>= 0` constraint).
- [x] 7.0.4 In [src/extensions/first-party/main-renderer/drag/render.ts](src/extensions/first-party/main-renderer/drag/render.ts), compute `anchorOffsetY = geometry.squareSize * config.pieceAnchorOffsetY` once before the anchor branch and add it to the `y` formula in BOTH branches (`'center'` and `'bottom'`). Do NOT apply it to `x`. Do NOT make the offset depend on `renderedSize`.
- [x] 7.0.5 Update [tests/test-utils/extensions/first-party/main-renderer/drag.ts](tests/test-utils/extensions/first-party/main-renderer/drag.ts): `DEFAULT_TEST_DRAG_CONFIG` adds `pieceAnchorOffsetY: 0` so existing tests stay byte-equivalent.
- [x] 7.0.6 In [tests/extensions/first-party/main-renderer/normalize.spec.ts](tests/extensions/first-party/main-renderer/normalize.spec.ts), update the `desktop default` and `mobile default` assertions to include `pieceAnchorOffsetY` (`0` and `0.14` respectively). Add tests asserting partial-merge with `pieceAnchorOffsetY` only, that finite negative/zero/positive values are accepted, and that `NaN`/`±Infinity` throw.
- [x] 7.0.7 In [tests/extensions/first-party/main-renderer/drag/render-transient.spec.ts](tests/extensions/first-party/main-renderer/drag/render-transient.spec.ts), add focused tests for `pieceAnchorOffsetY`: default offset 0 leaves anchor unchanged; positive offset shifts y down (center anchor); negative offset shifts y up (center anchor); the mobile-default offset shifts the bottom anchor down by `squareSize * 0.14`; the offset scales with `squareSize` (independent of `pieceScale`).
- [x] 7.0.8 In [tests/extensions/first-party/main-renderer/factory/public-api.spec.ts](tests/extensions/first-party/main-renderer/factory/public-api.spec.ts), add a runtime test asserting `setConfig({ drag: { pieceAnchorOffsetY: 0.2 } })` is observed on the next drag transient render on the same DOM node (no recreation, no resubscribe), via the existing getter-based path.

## 8. Repo-wide gates

- [x] 8.1 Run `rg -n 'setDragConfig' --hidden -g '!node_modules' -g '!dist' -g '!openspec/**'`. Acceptance: zero matches in source, tests, examples, and documentation. The previously removed public method `setDragConfig` MUST NOT be reintroduced.
- [x] 8.2 Do NOT run a zero-match grep gate for `getDragConfig`. The new internal drag-subsystem field on `MainRendererDragInternal` is intentionally named `getDragConfig` to mirror the animation subsystem's `getAnimationConfig`, so source/tests will legitimately reference this name. The "no public drag-specific API" guarantee for `getDragConfig` is enforced by the public-API surface test in 6.8 and by the public-surface-only review in 8.3 — not by a repo-wide ban on the identifier.
- [x] 8.3 Public-API/source-surface review: open [src/extensions/first-party/main-renderer/types/extension.ts](src/extensions/first-party/main-renderer/types/extension.ts) and confirm `RendererPublicAPI` does not declare `getDragConfig` or `setDragConfig`. Open [src/extensions/first-party/main-renderer/factory.ts](src/extensions/first-party/main-renderer/factory.ts) and confirm `createMainRendererInstancePublic` does not return a `getDragConfig` or `setDragConfig` method. Confirm no public re-export of an internal `getDragConfig` reference exists from the main-renderer module's public entry points.

## 9. Verification

- [x] 9.1 Run `npm run check` and confirm a clean pass.
- [x] 9.2 Run `npm run lint` and confirm a clean pass.
- [x] 9.3 Run `npm run test` and confirm all tests pass, including new tests from §6 and §7.
- [x] 9.4 Re-run the `setDragConfig` grep gate from 8.1 once more after all code and test changes are complete; confirm zero matches.
