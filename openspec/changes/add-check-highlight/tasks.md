## 1. Extension scaffolding (`src/extensions/first-party/check/`)

- [ ] 1.1 Create `types.ts` with `EXTENSION_ID = 'check'`, `EXTENSION_SLOTS = ['underPieces']`, `CheckConfig` (`OpaqueColor`-style `{ color, opacity }`) with a `DEFAULT_CONFIG` reproducing the lichess red gradient, `CheckInitConfig`, `CheckPublic { square: SquareString | null }`, `CheckDefinition`/`CheckInstance`, `CheckInstanceInternal` (holds `svgRect`, gradient `<defs>`/element ref, normalized `Square | null`, `runtimeSurface`, `config`, `svgIds`), and `DirtyLayer.Highlight = 1`. Verify with `tsc` (`npm run check:test`) — types compile.
- [ ] 1.2 Create `invalidation.ts` with a `markHighlightDirtyAndRequestRender(state)` helper that calls `runtimeSurface.invalidation.markDirty(DirtyLayer.Highlight)` and `runtimeSurface.commands.requestRender({ state: true })`, mirroring `annotations/invalidation.ts`. Verify it compiles and is imported by the factory.

## 2. Public property and invalidation

- [ ] 2.1 In `factory.ts`, implement `createCheck(config?)` and the internal state (merging `config` over `DEFAULT_CONFIG`, storing `runtimeSurface`), following `last-move`/`annotations` factory shape. Verify with a unit test that `createCheck().id === 'check'` and default config is applied.
- [ ] 2.2 Implement `getPublic()` with `get square()` (denormalize stored `Square` to `SquareString`, or `null`) and `set square()` (accept `null` or a valid `SquareString` via `isSquareString`, reject otherwise; normalize via `normalizeSquare`). On a real change, update state and call the invalidation helper; setting the same normalized value is a no-op. Verify with unit tests: set→get round-trip, `null` clears, invalid value rejected, same-value set requests no render (spy on `requestRender`).

## 3. Rendering (single-square, below pieces)

- [ ] 3.1 Implement `onUpdate` to `markDirty(Highlight)` when `hasMutation({ causes: ['layout.refreshGeometry'] })` and the context is renderable (mirror `last-move`, omit the `setLastMove` cause). Verify with a test that a geometry refresh while a square is set marks the highlight dirty.
- [ ] 3.2 Implement `render` create/update/remove exactly like `last-move`, over two svg refs (the `<rect>` and its `<radialGradient>` in `<defs>`): (a) square `null` → `remove()` both and null both refs if the rect exists, else no-op; (b) square set and no rect ref → lazily create the `<radialGradient>` (id from `svgIds`) plus a `<rect fill="url(#...)">` in `underPieces` positioned via `geometry.getSquareRect`; (c) square set and rect ref exists → `updateSvgElementAttributes` on the `<rect>` only (x/y/width/height). The gradient is static (config-driven), created once and never updated on subsequent renders, and removed together with the rect so `<defs>` keeps no orphans. Verify with tests: highlight appears for a set square, rect position updates on geometry change while the gradient node is not recreated, and both nodes are gone after clearing.
- [ ] 3.3 Implement `mount`/`unmount`/`destroy` using the `extension*Base` helpers and clean up the svg refs (mirror `last-move`). Verify mount/unmount/destroy tests pass and no stale svg elements remain after unmount.

## 4. Registration and wiring

- [ ] 4.1 Register `check` in `src/extensions/types/wrapper.ts`: add `createCheck` to `builtInExtensionFactoryMap` and `EXTENSION_ID` to `DefaultBuiltinChessboardExtensions`. Verify a board created with default extensions exposes `board.extensions.check` and that `check.square` is typed as `SquareString | null`.

## 5. Verification

- [ ] 5.1 Add/complete the extension test suite under `tests/extensions/first-party/check/` covering every spec scenario (set/clear/read, at-most-one, idempotent no-op, below-pieces, default vs. configured visual, geometry realign, present on default board). Verify `npm test` passes.
- [ ] 5.2 Run `npm run lint` and `npm test` and confirm both pass with no new failures.
