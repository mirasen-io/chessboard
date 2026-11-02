## 1. Read existing patterns before changing code

- [x] 1.1 Read `src/extensions/first-party/promotion/factory.ts` and identify how `runtimeSurface` is captured at instance construction, where it is stored on internal state, and whether/how it is used to schedule renders or mark dirty layers.
- [x] 1.2 Read `src/extensions/first-party/annotations/factory.ts` and `src/extensions/first-party/annotations/invalidation.ts` (or the equivalent helper file) and identify the `markDirty + requestRender` helper used by public mutator methods. Note the exact `runtimeSurface.invalidation.markDirty(...)` and `runtimeSurface.commands.requestRender({ state: true })` call shape.
- [x] 1.3 Read `src/extensions/first-party/main-renderer/factory.ts` and confirm the renderer already captures `options.runtimeSurface` on its internal state and exposes the same dirty-layer enum (`Board`, `Coordinates`, `Pieces`, `Drag`).
- [x] 1.4 Read the board and coordinates subsystem factories / render code under `src/extensions/first-party/main-renderer/board/` and `…/coordinates/` to confirm where their color config is held and how it is read at render time. This determines what (if anything) the implementation must adjust so that a runtime `colors` update is observed on the next render.
- [x] 1.5 Decide the minimal mechanism — fully aligned with the existing first-party-extension style — to make a runtime `colors` update visible on the next render. Document the chosen mechanism in the implementation report (PR description / change notes). Do not invent a new runtime-surface storage shape if the existing capture is sufficient. Add an inline code comment only if the mechanism is not obvious from the code itself.

## 2. Add the runtime setConfig options type

- [x] 2.1 In `src/extensions/first-party/main-renderer/types/public.ts`, add `export type MainRendererSetConfigOptions = Omit<MainRendererInitOptions, 'pieceUrls'>;` next to `MainRendererInitOptions`. Add a one-line comment that this is the lifecycle contract: every init-only field MUST appear in the `Omit` union, and adding a future init-only section means extending this union here.
- [x] 2.2 Sanity-check via `npm run check` that `MainRendererSetConfigOptions['drag']` and `MainRendererSetConfigOptions['colors']` resolve to the same deep-partial shapes as `MainRendererInitOptions['drag']` / `['colors']`, and that `(x: MainRendererSetConfigOptions) => x.pieceUrls` is a type error.
- [x] 2.3 Audit the existing aliases `MainRendererInitOptionsDrag` (public.ts) and `MainRendererConfigPublicDrag` (used by `getDragConfig`'s return type). Mark for removal in step 4 if no callers remain after the API swap.

## 3. Replace the public API surface

- [x] 3.1 In `src/extensions/first-party/main-renderer/types/extension.ts`, remove `setDragConfig(options: MainRendererInitOptionsDrag): void;` from `RendererPublicAPI`.
- [x] 3.2 In the same file, remove `getDragConfig(): MainRendererConfigPublicDrag;` from `RendererPublicAPI`.
- [x] 3.3 Add `setConfig(options: MainRendererSetConfigOptions): void;` to `RendererPublicAPI` and import `MainRendererSetConfigOptions` from `./public`.
- [x] 3.4 Add `getConfig(): MainRendererConfigPublic;` to `RendererPublicAPI` and import `MainRendererConfigPublic` from its current declaration site.

## 4. Update the factory implementation

- [x] 4.1 In `src/extensions/first-party/main-renderer/factory.ts`, remove the `setDragConfig` method from the object returned by `createMainRendererInstancePublic` (factory.ts:63-72 area).
- [x] 4.2 In the same area, remove the `getDragConfig` method.
- [x] 4.3 Add `setConfig(options)` that:
  - Defensively strips any `pieceUrls` field from the input (e.g., destructure-and-discard) so a non-TS caller cannot mutate `pieceUrls` even if they pass it.
  - Snapshots the previous `state.config` (or the relevant section refs) for change detection.
  - Calls `state.config = normalizeMainRendererConfig(<safe-input>, state.config)`.
  - Determines which sections changed vs. the snapshot (today: `colors.board`, `colors.coordinates`, `drag`).
  - For sections that affect visible output (today: `colors.board` and `colors.coordinates`), marks the corresponding existing dirty layer(s) via `state.runtimeSurface.invalidation.markDirty(...)` and calls `state.runtimeSurface.commands.requestRender({ state: true })`. Use the layer mapping from design.md Decision 2. Do NOT introduce new dirty layers in this change.
  - For `drag`-only updates, does NOT mark dirty and does NOT request a render (preserves prior `setDragConfig` behavior).
  - If the chosen mechanism from 1.5 requires propagating the new color values into board / coordinates subsystem state, do that here in the same call, in the same style as those subsystems already use.
- [x] 4.4 Add `getConfig()` that returns a deep clone of `state.config` (use the same `cloneDeep` import path as the previous drag getter). Confirm the return type is `MainRendererConfigPublic`.
- [x] 4.5 If task 2.3 found `MainRendererInitOptionsDrag` and / or `MainRendererConfigPublicDrag` to be unused after the swap, remove the orphan aliases and any imports that referenced them.

## 5. Migrate existing usages

- [x] 5.1 Run `rg -n 'setDragConfig' --hidden -g '!node_modules' -g '!dist' -g '!openspec/**'` from the repo root. Migrate every match to `setConfig({ drag: ... })` (source, tests, examples, docs). Confirm zero remaining matches.
- [x] 5.2 Run `rg -n 'getDragConfig' --hidden -g '!node_modules' -g '!dist' -g '!openspec/**'` from the repo root. Migrate every match to `getConfig().drag`. Confirm zero remaining matches.
- [x] 5.3 Run `rg -n 'MainRendererInitOptionsDrag'` and `rg -n 'MainRendererConfigPublicDrag'` (excluding `openspec/**`) and update or remove remaining matches consistent with task 4.5.
- [x] 5.4 Confirm that, after this change, no public runtime method or public runtime type accepts `pieceUrls` as input. Inspect `RendererPublicAPI` in `types/extension.ts` and the renderer instance returned by the factory to verify there is no runtime-write path for `pieceUrls`. (A bare `MainRendererInitOptions` grep cannot prove this — it appears at construction sites by design — so this step is a targeted public-surface review, not a grep.)

## 6. Tests

Use whatever testing pattern the repo already uses. Do not add `tsd`, a new type-test framework, or new build tooling.

- [x] 6.1 Add a unit test asserting `renderer.getConfig()` returns a snapshot containing `pieceUrls`, `drag`, and `colors` sections in their fully normalized form after construction.
- [x] 6.2 Add a unit test asserting `renderer.setConfig({ drag: { pieceScale: 1.2 } })` followed by `renderer.getConfig().drag` returns drag config with `pieceScale: 1.2` and unrelated drag fields unchanged.
- [x] 6.3 Add a unit test asserting `renderer.setConfig({ colors: { board: { light: '#ffffff' } } })` updates `renderer.getConfig().colors.board.light` and leaves other color fields unchanged.
- [x] 6.4 Add a render-side test asserting that after `renderer.setConfig({ colors: { board: { light: '#aabbcc' } } })` on a mounted renderer, the visible board output reflects `#aabbcc` on light squares — verified through the normal renderer render path (e.g., assert against the rendered SVG attributes after a render tick triggered by the renderer pipeline; do not assert via direct DOM mutation in the test).
- [x] 6.5 Add a unit test asserting `renderer.setConfig({})` is a no-op: `getConfig()` snapshot is deep-equal to the snapshot taken before the call, and no extra render is requested.
- [x] 6.6 Add a unit test asserting `renderer.setConfig({ drag: { pieceScale: 0 } })` is rejected by the existing normalization validation and the previous full config is retained.
- [x] 6.7 Add a unit test asserting that a runtime call passing `{ pieceUrls: { ... } }` (cast through `as unknown as MainRendererSetConfigOptions` or equivalent for the test) does NOT change `renderer.getConfig().pieceUrls`.
- [x] 6.8 Add a type-error test using the repository's existing pattern (or an inline `// @ts-expect-error` next to the call) asserting that `renderer.setConfig({ pieceUrls: { wK: 'x' } })` is a TypeScript error.
- [x] 6.9 Add a runtime-shape test asserting `'setDragConfig' in renderer === false`, `'getDragConfig' in renderer === false`, `typeof renderer.setConfig === 'function'`, and `typeof renderer.getConfig === 'function'`.
- [x] 6.10 Add a unit test asserting that `renderer.getConfig()` returns an object that, when mutated, does not affect the renderer's internal state on a subsequent `getConfig()` call.

## 7. Verification

- [x] 7.1 Run `npm run check` and confirm a clean pass, including the type-error fixture from 6.8.
- [x] 7.2 Run `npm run test` and confirm all tests pass.
- [x] 7.3 Re-run the release-gate sweeps from 5.1 and 5.2 (`rg -n 'setDragConfig' --hidden -g '!node_modules' -g '!dist' -g '!openspec/**'`, `rg -n 'getDragConfig' --hidden -g '!node_modules' -g '!dist' -g '!openspec/**'`) and confirm zero matches each. Acceptance condition: zero references to either name outside OpenSpec artifacts.
