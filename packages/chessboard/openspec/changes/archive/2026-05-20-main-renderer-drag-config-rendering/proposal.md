## Why

The first-party main renderer already accepts and validates drag visual config (`drag.pieceScale`, `drag.pieceAnchor`) through `MainRendererInitOptions` and `setConfig`, with desktop defaults `{ pieceScale: 1, pieceAnchor: 'center' }` and mobile defaults `{ pieceScale: 1.5, pieceAnchor: 'bottom' }`. Today, the drag renderer ignores both fields: it always sizes the lifted dragged piece to one square and centers it on the pointer. As a result, the configured drag visual is silently inert, mobile defaults do not produce the intended "lift above the finger" behavior, and runtime `setConfig({ drag })` updates have no observable effect on the dragged-piece visual.

A smoke test of the `pieceAnchor: 'bottom'` mobile visual surfaced a second issue: real piece SVGs do not visually fill the entire `<use>` box — internal symbol/viewport padding leaves the visible piece base slightly above the bottom edge. With the bottom anchor, that means the visible piece base sits slightly above the pointer/finger even though the SVG box is anchored correctly. The fix is a small configurable vertical anchor offset, expressed in board square units so it scales with `geometry.squareSize`.

## What Changes

- Wire the normalized drag config into the main-renderer drag subsystem using the same getter-based config access pattern already used by `board`, `coordinates`, and `animation` (`createMainRendererDrag(options.runtimeSurface, pieceSymbolResolver, () => internalState.config.drag)`), so a `setConfig({ drag })` update at runtime is observed on the next drag transient render without recreating the drag subsystem.
- Add a `getDragConfig: () => MainRendererConfigDrag` getter to `MainRendererDragInternal` (mirroring `MainRendererAnimationInternal.getAnimationConfig: () => MainRendererConfigAnimation`). The drag subsystem's render code reads drag config exclusively through this getter. `MainRendererConfigDrag` is the existing exported type and SHALL be used directly (not `MainRendererConfig['drag']`).
- Implement `drag.pieceScale` in the lifted dragged-piece SVG `<use>` element: set both `width` and `height` to `geometry.squareSize * drag.pieceScale`.
- Add `drag.pieceAnchorOffsetY: number` to `MainRendererConfigDrag`. Semantics:
  - Measured in board square units (NOT pixels and NOT a fraction of `renderedSize`).
  - The pixel offset applied at render time is `geometry.squareSize * drag.pieceAnchorOffsetY`.
  - Applied AFTER anchor positioning, on the `y` axis only.
  - Positive shifts the lifted piece down; negative shifts it up; zero is a no-op.
  - Validation: must be finite; negative, zero, and positive values are all accepted.
  - Desktop default: `0`. Mobile default: `0.14` (calibrated against the bundled default piece set; compensates for the visible bottom padding inside those SVG symbols so the visible piece base lands under the finger).
- Implement `drag.pieceAnchor` exactly:
  - `renderedSize = geometry.squareSize * drag.pieceScale`
  - `anchorOffsetY = geometry.squareSize * drag.pieceAnchorOffsetY`
  - `'center'`: `x = point.x - renderedSize / 2`, `y = point.y - renderedSize / 2 + anchorOffsetY` (pointer at the visual center, then shifted vertically by the offset).
  - `'bottom'`: `x = point.x - renderedSize / 2`, `y = point.y - renderedSize + anchorOffsetY` (pointer at the bottom-center of the visual, then shifted vertically by the offset).
- Preserve current desktop behavior bit-for-bit when drag config is the desktop default (`pieceScale: 1`, `pieceAnchor: 'center'`, `pieceAnchorOffsetY: 0`): width/height equal `squareSize`, x/y equal `point - squareSize / 2`.
- Preserve the existing drag session lifecycle and the existing transient-visual subscribe/unsubscribe behavior (drag end removes the dragged node and unsubscribes transient visuals).
- Confine the new anchor/scale/offset math to `rendererDragRenderTransientVisuals`. No ad-hoc DOM mutation outside that function.

### Out of scope (explicitly NOT changed)

- Public API: no new public methods, no return of `getDragConfig` / `setDragConfig` (those were intentionally removed by the prior `main-renderer-runtime-set-config` change and stay removed).
- An X-axis anchor offset (no concrete current-source need; horizontal centering across both anchors is the desired behavior).
- A function/callback config for the anchor offset (the value is a normalized number on `MainRendererConfigDrag`).
- Core interaction behavior (pointer handling, drag session state machine, board clamping).
- Animation behavior.
- Piece suppression logic for the lifted piece's source square (kept as today unless strictly required by the configured visual — and it is not).
- New dirty layers, new infrastructure beyond the existing first-party-extension getter pattern.

## Capabilities

### New Capabilities

- `main-renderer-drag-rendering`: Defines how the first-party main-renderer drag subsystem renders the lifted dragged-piece visual according to the renderer's normalized drag config — covering the `pieceScale` size contract, the `pieceAnchor` positioning contract for both `center` and `bottom`, the `pieceAnchorOffsetY` vertical-offset contract (board-square units, applied after anchor positioning), the runtime-config observation contract, and the lifecycle/DOM-scope guarantees.

### Modified Capabilities

<!-- No prior spec covers drag rendering. The runtime-config capability (`main-renderer-runtime-config`) defines the `setConfig` API surface and is unchanged by this proposal; this change adds the rendering-side contract that consumes that config. -->

## Impact

- **Drag config type** ([src/extensions/first-party/main-renderer/types/template.ts](src/extensions/first-party/main-renderer/types/template.ts)): `MainRendererConfigDrag` gains a `pieceAnchorOffsetY: number` field.
- **Defaults** ([src/extensions/first-party/main-renderer/types/internal.ts](src/extensions/first-party/main-renderer/types/internal.ts)): desktop default adds `pieceAnchorOffsetY: 0`; mobile default adds `pieceAnchorOffsetY: 0.14` (calibrated for the bundled default piece set).
- **Normalization / validation** ([src/extensions/first-party/main-renderer/normalize.ts](src/extensions/first-party/main-renderer/normalize.ts)): adds `Number.isFinite(pieceAnchorOffsetY)` assertion. No sign or magnitude restriction.
- **Drag types** ([src/extensions/first-party/main-renderer/drag/types.ts](src/extensions/first-party/main-renderer/drag/types.ts)): `MainRendererDragInternal` gains a `readonly getDragConfig: () => MainRendererConfigDrag` field, mirroring `MainRendererAnimationInternal.getAnimationConfig: () => MainRendererConfigAnimation`. `MainRendererConfigDrag` is imported from `../types/template.js`.
- **Drag factory** ([src/extensions/first-party/main-renderer/drag/factory.ts](src/extensions/first-party/main-renderer/drag/factory.ts)): `createMainRendererDrag` accepts a third parameter `getDragConfig: () => MainRendererConfigDrag` and stores it on the internal state. Lifecycle (subscribe/unsubscribe, node removal) is unchanged.
- **Drag render** ([src/extensions/first-party/main-renderer/drag/render.ts](src/extensions/first-party/main-renderer/drag/render.ts)): `rendererDragRenderTransientVisuals` reads `state.getDragConfig()` once per render call, computes `renderedSize`, `anchorOffsetY`, `x`, `y` per the anchor + offset contract, and writes them as SVG attributes. No other behavior changes.
- **Main-renderer factory** ([src/extensions/first-party/main-renderer/factory.ts](src/extensions/first-party/main-renderer/factory.ts)): the `createMainRendererDrag` call passes `() => internalState.config.drag` as the new third argument, mirroring how `createMainRendererAnimation` is wired today.
- **Public API**: public methods (`RendererPublicAPI.getConfig`, `setConfig`) are unchanged. The public main-renderer drag config _shape_ is extended: `MainRendererConfigDrag` (which appears in `MainRendererConfigPublic`, `MainRendererInitOptions`, and `MainRendererSetConfigOptions` via the existing partial-deep wiring) gains the new `pieceAnchorOffsetY: number` field. The new field flows through the existing `createMainRenderer(...)`, `getConfig()`, and `setConfig({ drag })` APIs without any new method or surface change.
- **Tests**: focused tests around drag render attributes (default desktop, custom scale, anchor `center`, anchor `bottom`, mobile-like example, `pieceAnchorOffsetY` for both anchors, runtime `setConfig({ drag })` propagation including offset, lifecycle preservation); validation tests for the new field in `normalize.spec.ts`.
- **Out of scope**: animation, board, coordinates, pieces subsystems; pointer interaction; promotion; piece suppression; `pieceUrls`.
