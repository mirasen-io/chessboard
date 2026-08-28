## Context

See proposal.md — Why. The board is rules-agnostic and SVG-based. Extensions render into named SVG slots, expose optional public APIs via `getPublic()`, and can request their own re-render through the runtime surface. Three existing extensions cover the pieces this feature needs:

- `auto-promote` — a simple extension-owned public property exposed through `getPublic()`.
- `last-move` — a two-square SVG highlight in the `underPieces` slot with create/update/remove lifecycle and geometry-refresh handling.
- `annotations` — an extension-owned public API that marks itself dirty and calls `requestRender` on the runtime surface after visual state changes.

`check` is the combination: a single-square `last-move`-style renderer, driven by an `auto-promote`-style public property, invalidated the `annotations` way.

## Goals / Non-Goals

**Goals:**

- One extension, `check`, owning a single optional square and its highlight.
- Default visual visually matches lichess/chessground (red radial glow), implemented in SVG.
- Reuse existing extension base helpers and the `underPieces` slot.

**Non-Goals:**

- Computing check from the position (consumer-supplied square only).
- Auto-detecting the king by color (chessground's `setCheck(color)` behavior) — explicitly excluded; the API takes a concrete square.
- The React `checkSquare` prop (separate `react-chessboard` change).

## Decisions

### 1. SVG `<radialGradient>` for the default visual, not a flat rect

chessground styles `square.check` with a CSS `radial-gradient(ellipse at center, rgba(255,0,0,1) 0%, rgba(231,0,0,1) 25%, rgba(169,0,0,0) 89%, rgba(158,0,0,0) 100%)`. Our board is SVG, not CSS-classed divs, so the equivalent is an SVG `<radialGradient>` defined once and a `<rect>` (or `<circle>`) filled with `url(#<gradient-id>)` in the `underPieces` slot.

- **Why not a flat `rect` like `last-move`?** A flat fill reads as "another highlight", not as "check". The radial glow is what makes the indicator recognizable. The feature is explicitly "1:1 like lichess".
- **Gradient id** comes from the extension's `svgIds` resolver (already on `ExtensionInternalBase`) to avoid collisions across instances.
- **Config** is an `OpaqueColor`-style `{ color, opacity }`. The default reproduces the lichess stops; a configured `color`/`opacity` drives the gradient's central stop while edges fade to transparent.

### 2. Public property mirrors `auto-promote`, storing normalized state internally

`getPublic()` returns `{ get square(), set square() }`. Internally the square is stored as the normalized `Square` code (via `normalizeSquare`), while the public getter returns a `SquareString | null` (denormalized). The setter validates with `isSquareString` (or accepts `null`) and rejects other values.

- **Why normalize internally?** Rendering needs the numeric `Square` for `geometry.getSquareRect`, and equality checks for idempotency are simplest on the normalized value.

### 3. Two invalidation paths — setter-driven and geometry-driven

The check square is extension-owned state and does **not** flow through the core mutation pipeline. Therefore:

- **Square changes**: the setter compares the new normalized value to the current one; on a real change it updates state and calls the `annotations`-style helper `markDirty(Highlight)` + `runtimeSurface.commands.requestRender({ state: true })`. Setting the same value is a no-op (no render requested).
- **Geometry changes**: handled in `onUpdate`, which marks the highlight dirty when `context.mutation.hasMutation({ causes: ['layout.refreshGeometry'] })` and the context is renderable — mirroring `last-move`. The `state.change.setLastMove` cause that `last-move` also listens for is intentionally dropped, since check state is not a core mutation.

`render()` reads the stored square and follows the exact create/update/remove lifecycle of `last-move`, over two svg refs — the `<rect>` and its `<radialGradient>` in `<defs>`:

- **square is `null`**: if a `<rect>` ref exists, `remove()` both the `<rect>` and the gradient and null out both refs; otherwise no-op. (Mirrors `last-move` nulling `svgRectFrom`/`svgRectTo` together.)
- **square set, no `<rect>` ref yet** (first show): create the `<radialGradient>` in `<defs>` (id from `svgIds`) and the `<rect fill="url(#...)">` in `underPieces`.
- **square set, `<rect>` ref exists** (square changed or geometry refreshed): `updateSvgElementAttributes` on the `<rect>` only (x/y/width/height). The gradient is static — color/opacity come from config and do not change at runtime — so it is created once and never updated; it is not touched on update, only removed alongside the `<rect>` when the square clears.

Both refs are always created and destroyed together so no orphan gradient is left in `<defs>` after `square = null`.

### 4. Registration in the built-in map and default set

Add `createCheck` under a new `EXTENSION_ID = 'check'` to `builtInExtensionFactoryMap` and to `DefaultBuiltinChessboardExtensions` in `src/extensions/types/wrapper.ts`. The public type `board.extensions.check.square` is then inferred through the existing `ExtensionDefinitionPublicApi` machinery, exactly as for `autoPromote`.

## Risks / Trade-offs

- **Naming overlap with `src/state/board/check.ts`** (which holds type-guard "checks", unrelated to chess check) → the extension lives under `src/extensions/first-party/check/` with `EXTENSION_ID = 'check'`; separate namespaces, no import conflict. Noted so reviewers don't confuse the two.
- **SVG gradient vs. CSS gradient fidelity** → the lichess values are CSS `radial-gradient` stops; the SVG `<radialGradient>` reproduction may differ subtly (ellipse vs. circle, stop mapping). Mitigation: use `gradientUnits="objectBoundingBox"` with an elliptical/`cx/cy/r` mapping and the same stop offsets/colors; accept minor rendering differences across browsers.
- **Extra `<defs>` per highlight** → keep a single gradient def created lazily on first render and removed when the square clears, alongside the rect (mirrors `last-move`'s create/update/remove). The gradient is never mutated on update — only the rect moves — and the two refs are nulled together so `<defs>` never accumulates orphans.
