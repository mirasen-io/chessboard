## Context

The first-party main renderer ([src/extensions/first-party/main-renderer/](src/extensions/first-party/main-renderer/)) is composed of subsystems (`board`, `coordinates`, `pieces`, `drag`, `animation`) constructed by the renderer's instance factory. Three of those subsystems already follow a uniform getter-based pattern for accessing live config:

```ts
// factory.ts:73-81 (current)
const board = createMainRendererBoard(() => internalState.config.colors.board);
const coordinates = createMainRendererCoordinates(() => internalState.config.colors.coordinates);
const animation = createMainRendererAnimation(
	options.runtimeSurface,
	pieceSymbolResolver,
	() => internalState.config.animation
);
```

`drag` is the only subsystem that doesn't take a config getter:

```ts
// factory.ts:76 (current)
const drag = createMainRendererDrag(options.runtimeSurface, pieceSymbolResolver);
```

The drag normalized config is already on `state.config.drag` and is already produced by `normalizeMainRendererConfig` for both init and runtime calls. Validation (`pieceScale > 0`, `pieceAnchor ∈ {'center','bottom'}`) is enforced. `setConfig({ drag })` already replaces `state.config` with a re-normalized snapshot, but because the drag subsystem never reads from `state.config.drag`, the new values are silently ignored at render time.

The drag render is small and self-contained ([src/extensions/first-party/main-renderer/drag/render.ts](src/extensions/first-party/main-renderer/drag/render.ts)):

```ts
// drag/render.ts (current)
const geometry = context.currentFrame.layout.geometry;
const point = context.transientInput.boardClampedPoint;
const squareSize = geometry.squareSize.toString();
const x = (point.x - geometry.squareSize / 2).toString();
const y = (point.y - geometry.squareSize / 2).toString();
// uses createSvgElement / updateSvgElementAttributes with width/height = squareSize
```

This always produces a 1-square, center-anchored visual regardless of `state.config.drag`.

The animation subsystem is the closest precedent: it stores its config getter on `MainRendererAnimationInternal` ([animation/types.ts:23](src/extensions/first-party/main-renderer/animation/types.ts#L23)) and reads it inside its render path. This is exactly the shape we want for drag.

## Goals / Non-Goals

**Goals:**

- Make `drag.pieceScale` and `drag.pieceAnchor` observable in the lifted dragged-piece visual on every render of the drag transient visuals.
- Make a runtime `setConfig({ drag })` update visible on the **next** drag transient render with no remount, no resubscribe churn, and no recreation of the drag subsystem — exactly as the runtime-config capability already requires for `colors`/`animation`.
- Reuse the existing first-party getter pattern; do not invent a new one.
- Keep desktop default behavior identical to today's output (byte-for-byte SVG attribute equivalence on `width`/`height`/`x`/`y` for the dragged piece).
- Keep changes confined to the drag subsystem and the one-line factory wiring.

**Non-Goals:**

- Public API surface. `setConfig`/`getConfig` is the runtime path; nothing new is added or returned.
- New dirty layers. `drag` updates do not require an immediate render — the next pointer event already drives a transient render — and that matches the prior `setDragConfig` behavior preserved by the current `setConfig`.
- Reintroducing public `renderer.getDragConfig` / `renderer.setDragConfig` APIs. Those public methods were removed by the prior change and stay removed. The internal drag subsystem getter `getDragConfig` is intentionally introduced by this change.
- Animation behavior changes.
- Pointer / interaction state machine changes.
- Piece suppression logic (the source square's "real" piece visibility during drag) — already handled outside this subsystem.
- New normalization or validation — already in place.
- New runtime surface storage on the drag subsystem.

## Decisions

### Decision 1: Pass `drag` config as a getter to the drag subsystem (mirror `animation`)

Change the drag factory signature from:

```ts
export function createMainRendererDrag(
	runtimeSurface: ExtensionRuntimeSurface,
	resolver: PieceSymbolResolver
): MainRendererDrag;
```

to:

```ts
export function createMainRendererDrag(
	runtimeSurface: ExtensionRuntimeSurface,
	resolver: PieceSymbolResolver,
	getDragConfig: () => MainRendererConfigDrag
): MainRendererDrag;
```

Store `getDragConfig: () => MainRendererConfigDrag` on `MainRendererDragInternal` as a `readonly` field, identical in shape to `MainRendererAnimationInternal.getAnimationConfig: () => MainRendererConfigAnimation`. `MainRendererConfigDrag` is the existing exported type from [src/extensions/first-party/main-renderer/types/template.ts](src/extensions/first-party/main-renderer/types/template.ts) and SHALL be used directly — do not write the getter type as `MainRendererConfig['drag']` when the named type already exists. The main-renderer factory passes `() => internalState.config.drag` at the same wiring point as the other subsystems.

**Rationale:**

- Exact precedent in the same module ([animation/factory.ts:14-24](src/extensions/first-party/main-renderer/animation/factory.ts#L14-L24)).
- Forward reference closes over the renderer's mutable `internalState`, so a `setConfig({ drag })` call that replaces `state.config` is observed by the next `getDragConfig()` invocation. No subscribe/notify plumbing.
- Single-arity addition; no refactor of the lifecycle (`onUpdate`, `renderTransientVisuals`, `unmount`).

**Alternatives considered:**

- Capture a snapshot at construction (`createMainRendererDrag(..., dragConfig)`). Rejected: would silently regress runtime `setConfig({ drag })`. The whole point of getters in board/coordinates/animation is that the section's value can change after construction.
- Add an event/observer on the renderer state. Rejected: no other subsystem does this; the getter pattern is already the project's established way to express "read my config every time."
- Have the drag subsystem read from a global / module-level state. Rejected: violates the existing per-instance encapsulation.

### Decision 2: Read drag config inside `rendererDragRenderTransientVisuals`, not on update

The render function calls `state.getDragConfig()` once per render invocation and computes:

```ts
const config = state.getDragConfig();
const squareSize = geometry.squareSize;
const renderedSize = squareSize * config.pieceScale;
const x = point.x - renderedSize / 2;
const y =
	config.pieceAnchor === 'bottom'
		? point.y - renderedSize + squareSize / 2
		: point.y - renderedSize / 2;
```

Both the create-path (`createSvgElement`) and the update-path (`updateSvgElementAttributes`) use the same computed `renderedSize`/`x`/`y`. Attribute values continue to be passed as strings via `.toString()` at the SVG boundary (matches current code).

`rendererDragOnUpdate` is **not** changed — it does not reference visual geometry. Reading config at render time guarantees the most recent normalized config is used, including any update that landed between the previous and current pointer event.

**Rationale:**

- Render-time reads minimize state on the drag internal struct (no cached size/anchor that could drift from `state.config`).
- Mirrors the other subsystems, which read getters at render time.
- Keeps the math in one short, well-tested function.

**Alternatives considered:**

- Recompute and store on `onUpdate`. Rejected: drag updates fire per-frame; this would be redundant work on the same struct fields and re-introduces a "stale config" surface on the rare boundary where `setConfig` is called between an `onUpdate` and a `renderTransientVisuals` of the same frame.
- Compute on both create and update with two slightly different formulas. Rejected: the create path and the update path must produce identical attribute values — share one helper.

### Decision 3: Anchor math, exactly

```ts
renderedSize = geometry.squareSize * drag.pieceScale;

// 'center' (desktop default)
x = point.x - renderedSize / 2;
y = point.y - renderedSize / 2;

// 'bottom' (mobile default)
x = point.x - renderedSize / 2;
y = point.y - renderedSize + geometry.squareSize / 2;
```

For default desktop config (`pieceScale = 1`, `pieceAnchor = 'center'`):

- `renderedSize = squareSize`
- `x = point.x - squareSize / 2`
- `y = point.y - squareSize / 2`

Identical to the current code's formula. Width/height also remain `squareSize` because `renderedSize === squareSize`.

For the mobile-like example (`sceneSize 400 ⇒ squareSize 50`, `pieceScale 1.5`, `pieceAnchor 'bottom'`, `point { x: 200, y: 150 }`):

- `renderedSize = 50 * 1.5 = 75`
- `x = 200 - 75/2 = 162.5`
- `y = 150 - 75 + 50/2 = 100`
- `width = height = 75`

These exact numbers form the focused test fixture.

**Rationale:**

- The "bottom" formula is `y = point.y - renderedSize + geometry.squareSize / 2`, not `y = point.y - renderedSize`. The half-square offset keeps the pointer inside the lower portion of the dragged piece, lifting the larger sprite roughly one-half-square above the finger — visually consistent with the mobile UX intent.
- Horizontal centering is preserved across both anchors so left-handed and right-handed users see the same alignment.

**Alternatives considered:**

- `bottom` defined as `y = point.y - renderedSize` (pointer at the very bottom edge of the visual). Rejected: too aggressive a lift, places the visual too high above the finger and clips against board edges sooner; the requested formula keeps the offset proportional to `squareSize`, not to `renderedSize`.
- Anchor expressed as a 2D vector. Rejected: scope creep; current contract is a fixed 2-value enum and the mapping is small and explicit. Can be revisited later.

### Decision 4: Keep lifecycle, subscribe/unsubscribe, and node identity untouched

`createMainRendererDrag.unmount`, the subscribe-on-drag-start / unsubscribe-on-drag-end logic in `rendererDragOnUpdate`, the `state.pieceNode` reuse-across-frames pattern, and the `data-chessboard-id="dragged-piece"` attribute all remain as they are. The new attribute values flow through the same `createSvgElement` / `updateSvgElementAttributes` calls — only the values change.

**Rationale:**

- Lifecycle is correct today and orthogonal to the visual change.
- A render-only diff keeps the change reviewable and the regression surface small.

### Decision 5: No DOM mutation outside `rendererDragRenderTransientVisuals`

Per the runtime-config capability's "no ad-hoc DOM mutation" rule, neither the drag factory's new third argument nor the main-renderer factory's wiring touches the DOM. All visual changes flow through the existing render path on the next transient render.

### Decision 6: No re-introduction of removed public APIs

The public methods `getDragConfig` / `setDragConfig` on `RendererPublicAPI` were removed by the prior `main-renderer-runtime-set-config` change and SHALL remain removed. The drag subsystem reads config exclusively through the new internal getter `state.getDragConfig: () => MainRendererConfigDrag`. The internal getter name is intentionally chosen to mirror `getAnimationConfig` on `MainRendererAnimationInternal`; it is **not** a public API and is not exported from any public type.

Grep-gate scope (corrected):

- `setDragConfig`: zero-match repo-wide grep gate (excluding `node_modules`, `dist`, `openspec/**`) is preserved. There is no legitimate occurrence of this name in source.
- `getDragConfig`: a zero-match repo-wide grep gate is **NOT** appropriate, because the new internal field on `MainRendererDragInternal` is intentionally named `getDragConfig`. Source/tests will legitimately reference this internal name.

The "no public drag-specific API" guarantee is therefore expressed as a public-API/source-surface check (the renderer instance and `RendererPublicAPI` type do not expose `getDragConfig` or `setDragConfig`, and there is no public re-export under any other name) rather than as a repo-wide ban on the internal getter's identifier. Tests assert this public-surface invariant directly.

## Risks / Trade-offs

- **Risk: bottom-anchor lift causes the dragged piece to clip against the top of the scene container.** → Mitigation: the lift is bounded by `(squareSize / 2)` (i.e., half a square above the pointer at `pieceScale = 1`) plus the extra height from `pieceScale > 1`; with the documented mobile defaults this is well within the scene bounds. If a future config combination produces clipping, that's a separate scene-clip change, not a drag-rendering change.
- **Risk: floating-point drift between the create-path and the update-path produces visually different attributes for the same pointer position.** → Mitigation: both paths share a single computation block in the render function. The same expressions produce the same string attributes, by construction.
- **Risk: `state.config.drag` reference identity changes on every `setConfig` call (object replacement) and a stale closure somewhere captures the old value.** → Mitigation: the getter is `() => internalState.config.drag`, evaluated on every render call. There is no cached snapshot inside the drag subsystem that could go stale.
- **Risk: a future contributor reintroduces `setDragConfig` (or `getDragConfig`) as a public API name on `RendererPublicAPI` to mirror the new internal field name.** → Mitigation: a public-surface test asserts `'setDragConfig' in renderer === false` and `'getDragConfig' in renderer === false`, plus the existing repo-wide zero-match grep gate for `setDragConfig` (excluding `openspec/**`). The internal `getDragConfig` field on `MainRendererDragInternal` is exempt from a name-based grep gate by design (it is the intended internal name, not a public API).
- **Trade-off: the drag factory takes a third positional argument.** Acceptable: matches the existing animation factory signature and keeps the call sites uniform. Switching all main-renderer subsystem factories to options-bag-only would be a separate refactor outside this change.
- **Trade-off: `getDragConfig()` is invoked on every transient render frame (potentially many per second during drag).** Acceptable: it's a property access on a plain object closure; the cost is negligible and matches what `getAnimationConfig` already does on every animation frame.
