## ADDED Requirements

### Requirement: Drag subsystem reads drag config through a getter

The first-party main-renderer drag subsystem SHALL receive its drag config (`drag.pieceScale`, `drag.pieceAnchor`) as a getter function `() => MainRendererConfigDrag` provided by the main-renderer instance factory at construction. The drag subsystem SHALL store the getter on its internal state as `getDragConfig: () => MainRendererConfigDrag` and SHALL invoke it on every render of the lifted dragged-piece visual to obtain the current drag config. The getter SHALL be the only path through which the drag subsystem reads drag config; the drag subsystem SHALL NOT cache a snapshot of the drag config taken at construction.

The getter pattern SHALL match the established first-party-extension style already used by the `board`, `coordinates`, and `animation` subsystems on the main renderer (in particular, mirroring `MainRendererAnimationInternal.getAnimationConfig: () => MainRendererConfigAnimation`). The getter type SHALL be the existing exported `MainRendererConfigDrag` type, not `MainRendererConfig['drag']`.

#### Scenario: Drag factory accepts a config getter

- **WHEN** the main-renderer instance factory constructs the drag subsystem
- **THEN** it passes a getter `() => internalState.config.drag` to `createMainRendererDrag` as a third argument alongside the runtime surface and the piece symbol resolver
- **AND** the drag subsystem stores that getter on its internal state for later use

#### Scenario: Render reads current config every frame

- **WHEN** the drag subsystem renders a transient drag visual
- **THEN** it invokes the stored config getter to obtain the current `drag.pieceScale` and `drag.pieceAnchor`
- **AND** it does not use any cached snapshot of those fields from a prior frame or from construction

### Requirement: setConfig({ drag }) is observed by the next drag render without remount

When `renderer.setConfig({ drag: ... })` updates the renderer's normalized drag config, the drag subsystem SHALL observe the new values on its next transient drag render with no recreation of the drag subsystem, no resubscribe of transient visuals, and no remount of the renderer instance. Updates SHALL flow through the existing renderer pipeline; the `setConfig` call site SHALL NOT mutate the DOM directly.

#### Scenario: Runtime drag-config update reflects on next drag transient render

- **GIVEN** a mounted main renderer with an active drag session producing transient renders
- **WHEN** a caller invokes `renderer.setConfig({ drag: { pieceScale: 1.4 } })`
- **THEN** the next transient drag render uses `pieceScale: 1.4` for the dragged-piece SVG attributes
- **AND** the drag subsystem instance is the same instance as before the call (no recreation)
- **AND** no subscribe / unsubscribe call on the runtime surface's transient-visuals channel is triggered by the `setConfig` call

#### Scenario: setConfig({ drag }) does not mutate the DOM directly

- **WHEN** `renderer.setConfig({ drag: ... })` is processed
- **THEN** the call does not create, remove, or modify any SVG / DOM nodes from inside `setConfig`
- **AND** all visible drag-visual changes flow through the next call to the drag subsystem's transient-visuals render function

### Requirement: pieceScale controls dragged-piece visual size

The lifted dragged-piece SVG `<use>` element SHALL be sized as `geometry.squareSize * drag.pieceScale` for both `width` and `height` on every transient drag render, where `geometry` is the current frame's layout geometry and `drag.pieceScale` is the current normalized drag config value.

#### Scenario: Default desktop pieceScale produces unchanged size

- **WHEN** the renderer's drag config is the desktop default (`pieceScale: 1`, `pieceAnchor: 'center'`)
- **AND** the drag subsystem renders a transient drag visual at any pointer position
- **THEN** the dragged-piece `<use>` element has `width = geometry.squareSize` and `height = geometry.squareSize`
- **AND** the produced `width`/`height` SVG attribute values are byte-equivalent to the values the prior implementation produced for the same geometry and pointer position

#### Scenario: Custom pieceScale changes width and height

- **GIVEN** a renderer whose drag config has `pieceScale = s` for some finite `s > 0`
- **WHEN** the drag subsystem renders a transient drag visual
- **THEN** the dragged-piece `<use>` element has `width = geometry.squareSize * s` and `height = geometry.squareSize * s`

### Requirement: pieceAnchor controls dragged-piece visual position

The lifted dragged-piece SVG `<use>` element's `x` and `y` attributes SHALL be computed from the current pointer position on the board (`point = transientInput.boardClampedPoint`), the current `geometry.squareSize`, and the current `drag.pieceScale` and `drag.pieceAnchor` according to the following exact rules:

- Let `renderedSize = geometry.squareSize * drag.pieceScale`.
- If `drag.pieceAnchor === 'center'`:
  - `x = point.x - renderedSize / 2`
  - `y = point.y - renderedSize / 2`
- If `drag.pieceAnchor === 'bottom'`:
  - `x = point.x - renderedSize / 2`
  - `y = point.y - renderedSize + geometry.squareSize / 2`

The same `x`/`y` formulas SHALL be used both when the dragged-piece node is first created and when its attributes are subsequently updated, so that the create-path and the update-path produce identical attribute values for the same inputs.

#### Scenario: Default desktop center-anchor preserves prior position

- **WHEN** the renderer's drag config is the desktop default (`pieceScale: 1`, `pieceAnchor: 'center'`)
- **AND** the drag subsystem renders a transient drag visual with `point = { x: px, y: py }` and `geometry.squareSize = s`
- **THEN** the dragged-piece `<use>` element has `x = px - s / 2` and `y = py - s / 2`
- **AND** these values are byte-equivalent to the values the prior implementation produced for the same `px`, `py`, `s`

#### Scenario: Center anchor with non-default scale

- **GIVEN** the renderer's drag config has `pieceAnchor: 'center'` and `pieceScale: k` where `k > 0`
- **WHEN** the drag subsystem renders a transient drag visual at `point = { x: px, y: py }` with `geometry.squareSize = s`
- **THEN** the dragged-piece `<use>` element has `x = px - (s * k) / 2` and `y = py - (s * k) / 2`

#### Scenario: Bottom anchor positions visual above the pointer

- **GIVEN** the renderer's drag config has `pieceAnchor: 'bottom'` and `pieceScale: k` where `k > 0`
- **WHEN** the drag subsystem renders a transient drag visual at `point = { x: px, y: py }` with `geometry.squareSize = s`
- **THEN** the dragged-piece `<use>` element has `x = px - (s * k) / 2` and `y = py - (s * k) + s / 2`

#### Scenario: Mobile-like default produces the documented values

- **GIVEN** `geometry.squareSize = 50` (i.e., `sceneSize 400` divided by 8 squares)
- **AND** the renderer's drag config is `{ pieceScale: 1.5, pieceAnchor: 'bottom' }`
- **WHEN** the drag subsystem renders a transient drag visual at `point = { x: 200, y: 150 }`
- **THEN** the dragged-piece `<use>` element has `width = 75`, `height = 75`, `x = 162.5`, `y = 100`

### Requirement: Drag session lifecycle and DOM scope are unchanged

This change SHALL NOT alter the existing drag session lifecycle: drag start subscribes the drag subsystem to transient-visual updates and creates the dragged-piece node on first render, drag end unsubscribes from transient-visual updates, removes the dragged-piece node from its slot, and clears the cached node and piece-code references. New configuration-driven attribute computation SHALL be confined to `rendererDragRenderTransientVisuals`. The drag subsystem SHALL NOT mutate the DOM from `setConfig`, from the main-renderer factory, from `onUpdate`, or from any code path other than the transient-visuals render function.

#### Scenario: Drag end removes the node and unsubscribes

- **GIVEN** an active drag session with a transient-visual subscription and a dragged-piece node in the drag slot
- **WHEN** the drag session ends (no longer an active lifted-piece drag)
- **THEN** the drag subsystem's `onUpdate` removes the dragged-piece node from the DOM
- **AND** unsubscribes from the runtime surface's transient-visuals channel
- **AND** clears its cached node reference and piece-code reference

#### Scenario: Configuration changes do not bypass the render path

- **WHEN** any code path other than `rendererDragRenderTransientVisuals` runs during this change's implementation (factory wiring, `setConfig`, `onUpdate`, lifecycle hooks)
- **THEN** that path does not call `createSvgElement`, `updateSvgElementAttributes`, or any equivalent DOM mutation against the dragged-piece node
- **AND** all dragged-piece visual changes are produced by the next `rendererDragRenderTransientVisuals` invocation

### Requirement: No public drag-specific API is added or restored

This change SHALL NOT add any new public method, public type, or exported alias related to drag config. The previously removed public methods `setDragConfig` and `getDragConfig` on `RendererPublicAPI` SHALL remain removed. The internal config-getter field on `MainRendererDragInternal` (named `getDragConfig`) is intentionally internal-only and SHALL NOT be exported through any public type or surfaced on the renderer instance.

The repo-wide grep for `setDragConfig` (excluding `node_modules`, `dist`, and `openspec/**`) SHALL continue to return zero matches after this change. A repo-wide name-based grep for `getDragConfig` is NOT a gate of this change, because the new internal drag-subsystem field is intentionally named `getDragConfig`. The "no public drag-specific API" guarantee for `getDragConfig` SHALL instead be expressed as a public-API/source-surface check (see scenarios below).

#### Scenario: Public API surface is unchanged

- **WHEN** a caller inspects the renderer's public API surface (the `RendererPublicAPI` type and the renderer instance returned by the factory)
- **THEN** the only runtime config methods are `getConfig` and `setConfig` (introduced by the prior runtime-config change)
- **AND** there is no `setDragConfig` method
- **AND** there is no `getDragConfig` method
- **AND** there is no other public method or exported alias that takes or returns drag config

#### Scenario: Internal drag-subsystem getter is not exported as a public API

- **WHEN** a caller imports the public types and the renderer instance from the main-renderer module
- **THEN** the internal `getDragConfig` field defined on `MainRendererDragInternal` is not reachable from any public type
- **AND** the renderer instance returned by the factory does not expose a `getDragConfig` method or property

#### Scenario: setDragConfig grep gate

- **WHEN** a repo-wide search is performed for `setDragConfig`, excluding `node_modules`, `dist`, and `openspec/**`
- **THEN** the search returns zero matches in source, tests, examples, and documentation
- **AND** matches inside `openspec/**` (this change's proposal, design, spec, tasks; archived prior changes) do not fail the gate

#### Scenario: getDragConfig is not subject to a repo-wide name ban

- **WHEN** the implementation introduces an internal field `getDragConfig` on `MainRendererDragInternal` and references it from the drag subsystem's source and tests
- **THEN** those references do NOT fail any repo-wide gate
- **AND** the absence of `getDragConfig` from the public API surface is verified by the public-API/source-surface scenarios above
