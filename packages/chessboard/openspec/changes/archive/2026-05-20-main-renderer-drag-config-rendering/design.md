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
const anchorOffsetY = squareSize * config.pieceAnchorOffsetY;
const x = point.x - renderedSize / 2;
const y =
	config.pieceAnchor === 'bottom'
		? point.y - renderedSize + anchorOffsetY
		: point.y - renderedSize / 2 + anchorOffsetY;
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
anchorOffsetY = geometry.squareSize * drag.pieceAnchorOffsetY;

// 'center' (desktop default)
x = point.x - renderedSize / 2;
y = point.y - renderedSize / 2 + anchorOffsetY;

// 'bottom' (mobile default — Chess.com-style: pointer at bottom-center of visual,
// then nudged by the anchor offset to compensate for symbol bottom padding)
x = point.x - renderedSize / 2;
y = point.y - renderedSize + anchorOffsetY;
```

For default desktop config (`pieceScale = 1`, `pieceAnchor = 'center'`, `pieceAnchorOffsetY = 0`):

- `renderedSize = squareSize`
- `anchorOffsetY = 0`
- `x = point.x - squareSize / 2`
- `y = point.y - squareSize / 2`

Identical to the current code's formula. Width/height also remain `squareSize` because `renderedSize === squareSize`.

For the mobile-like example (`sceneSize 400 ⇒ squareSize 50`, `pieceScale 1.5`, `pieceAnchor 'bottom'`, `pieceAnchorOffsetY 0.14`, `point { x: 200, y: 150 }`):

- `renderedSize = 50 * 1.5 = 75`
- `anchorOffsetY = 50 * 0.14 = 7`
- `x = 200 - 75/2 = 162.5`
- `y = 150 - 75 + 7 = 82`
- `width = height = 75`

Without the offset (`pieceAnchorOffsetY = 0`), the same example would produce `y = 75`. The offset moves the visible piece base 7px down so it lands right under the finger, compensating for the visible bottom padding inside the bundled default piece SVGs (calibrated value).

These exact numbers form the focused test fixtures.

**Rationale:**

- The "bottom" formula places the pointer at the bottom-center of the rendered SVG `<use>` box. The entire scaled sprite renders above the finger — Chess.com-style mobile drag.
- `pieceAnchorOffsetY` is then a small post-anchor nudge in board square units. Because real piece SVGs contain internal padding, the visible piece base typically sits a few percent above the box bottom; a positive offset shifts the box down so the visible base aligns with the pointer.
- Horizontal centering is preserved across both anchors so left-handed and right-handed users see the same alignment.
- The offset is measured in board square units (`squareSize * pieceAnchorOffsetY`) rather than pixels or fractions of `renderedSize`, so it scales with the board geometry and is independent of `pieceScale`. A renderer rendered at 800px (square=100) on a phone in landscape gets exactly the same visual proportion as the same renderer at 400px in portrait.

**Alternatives considered:**

- `bottom` defined as `y = point.y - renderedSize + squareSize / 2` (pointer in the lower portion but inside the visual). Rejected: too small a lift; the larger sprite mostly overlaps the finger and does not produce the Chess.com-style "lifted above the finger" look.
- Pixel-based offset (`pieceAnchorOffsetYPx`). Rejected: would not scale with board size; the same numeric value would feel too small on a 400px board and too small again on an 800px board (or vice versa, depending on which is tuned for).
- Offset as a fraction of `renderedSize` (i.e., `renderedSize * offset`). Rejected: would make the offset depend on `pieceScale`, so changing the scale would silently change the perceived anchor — this is the wrong coupling. The offset is about compensating for **symbol-internal padding**, which is a property of the asset and the square (not of the runtime scale).
- Adding an X-axis offset. Rejected: no concrete current-source need; horizontal centering is desirable across both anchors and there's no observed asymmetric padding in the bundled symbols.
- Function/callback-style offset (`pieceAnchorOffsetY: (ctx) => number`). Rejected: scope creep, harder to validate, breaks the normalized-config contract. A normalized number is sufficient and easier to reason about.
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

- **Risk: bottom-anchor lift causes the dragged piece to clip against the top of the scene container.** → Mitigation: with `pieceScale = 1.5` and the bottom-center anchor, the lift is one full `squareSize` (e.g., 50px on a 400px scene); the mobile `pieceAnchorOffsetY = 0.14` reduces that lift by 7px. For the documented mobile defaults this is well within the scene bounds. If a future config combination produces clipping, that's a separate scene-clip change, not a drag-rendering change.
- **Risk: `pieceAnchorOffsetY` accepted as any finite number invites accidental large offsets that move the visual far off the pointer.** → Mitigation: the field is a normalized config number with the same lifecycle as `pieceScale` and `pieceAnchor`; misuses surface immediately on drag. A bounds clamp could be added later if a real-world incident demands it, but current scope keeps the validation minimal (finite check) to match how `pieceScale > 0` is the only `pieceScale` constraint.
- **Risk: callers specify `pieceAnchorOffsetY` in pixels expecting pixel semantics.** → Mitigation: the field name and the design/spec docs explicitly state board-square units. The default desktop value `0` is a no-op so a misunderstanding only manifests when someone deliberately sets a non-zero value.
- **Risk: floating-point drift between the create-path and the update-path produces visually different attributes for the same pointer position.** → Mitigation: both paths share a single computation block in the render function. The same expressions produce the same string attributes, by construction.
- **Risk: `state.config.drag` reference identity changes on every `setConfig` call (object replacement) and a stale closure somewhere captures the old value.** → Mitigation: the getter is `() => internalState.config.drag`, evaluated on every render call. There is no cached snapshot inside the drag subsystem that could go stale.
- **Risk: a future contributor reintroduces `setDragConfig` (or `getDragConfig`) as a public API name on `RendererPublicAPI` to mirror the new internal field name.** → Mitigation: a public-surface test asserts `'setDragConfig' in renderer === false` and `'getDragConfig' in renderer === false`, plus the existing repo-wide zero-match grep gate for `setDragConfig` (excluding `openspec/**`). The internal `getDragConfig` field on `MainRendererDragInternal` is exempt from a name-based grep gate by design (it is the intended internal name, not a public API).
- **Trade-off: the drag factory takes a third positional argument.** Acceptable: matches the existing animation factory signature and keeps the call sites uniform. Switching all main-renderer subsystem factories to options-bag-only would be a separate refactor outside this change.
- **Trade-off: `getDragConfig()` is invoked on every transient render frame (potentially many per second during drag).** Acceptable: it's a property access on a plain object closure; the cost is negligible and matches what `getAnimationConfig` already does on every animation frame.
