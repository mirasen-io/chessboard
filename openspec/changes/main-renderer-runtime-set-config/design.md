## Context

The main renderer (`src/extensions/first-party/main-renderer/`) is configured at construction time via `MainRendererInitOptions`. The current public runtime surface for config is two drag-only methods, `setDragConfig` and `getDragConfig`, plus the construction path.

Relevant existing shapes:

- `MainRendererInitOptions` (public.ts:9-13)

  ```ts
  interface MainRendererInitOptions extends PartialDeep<WritableDeep<MainRendererConfigPublic>> {
  	pieceUrls?: PieceUrlsPublic;
  }
  ```

  All sections come through as deep-partial via `extends`; `pieceUrls` is re-declared with the partial public shape `Record<PieceString, string>`. Normalization promotes it to the complete internal shape `Record<NonEmptyPieceCode, string>` and asserts completeness.

- Existing top-level sections in `MainRendererInitOptions`: `colors` (board + coordinates), `pieceUrls`, `drag`. Today, `colors` and `drag` are runtime-mutable; `pieceUrls` is init-only.

- Current factory drag methods (factory.ts:63-72):

  ```ts
  setDragConfig(options) {
      state.config = normalizeMainRendererConfig({ drag: options }, state.config);
  },
  getDragConfig() {
      return cloneDeep(state.config.drag);
  }
  ```

  `setDragConfig` currently does NOT call `requestRender` or `markDirty`. This is acceptable for `drag` because drag config is read on the next pointer event — there is no immediate visual change. **Colors do not have this property**: the board and coordinate squares are already on screen, so a `colors` update must trigger a redraw to be visible.

- First-party extension precedent for mutator + invalidation + render scheduling — `annotations` (`src/extensions/first-party/annotations/`):
  - Captures `runtimeSurface` from `runtimeOptions.runtimeSurface` at instance construction (factory.ts:71) and stores it as `state.runtimeSurface`.
  - On any state-changing public API method, calls a small helper that does both:
    ```ts
    state.runtimeSurface.invalidation.markDirty(layer);
    state.runtimeSurface.commands.requestRender({ state: true });
    ```
    (annotations `invalidation.ts` — `markCommittedDirtyAndRequestRender`).
  - Config-only mutators that don't change visible output (e.g., `drawModifier`) update state and skip both calls.
- `promotion` follows the same overall shape: `runtimeSurface` captured at `createInstance`, stored on the internal state, and used to mark dirty layers / request renders. Promotion has no public mutators, but its internal use of `context.invalidation.markDirty(DirtyLayer.Promotion)` from `onUpdate` mirrors the same dirty-flag idiom.
- Main-renderer already captures `options.runtimeSurface` at instance construction (factory.ts:57) and uses subsystem-specific dirty layers from `DirtyLayer` (`Board | Coordinates | Pieces | Drag`) within `onUpdate`. The runtime-surface storage and dirty-layer infrastructure are already present — the gap is wiring a public mutator into them.
- Main-renderer subsystems are constructed with config sections passed in by value (factory.ts:45-49): `createMainRendererBoard(config.colors.board)`, `createMainRendererCoordinates(config.colors.coordinates)`, `createMainRendererPieces(...)`, `createMainRendererDrag(...)`, `createMainRendererAnimation(...)`. The board and coordinates renderers read `state.config.{light,dark}` at render time. For `setConfig({ colors })` to take effect, the source those subsystems read MUST reflect the updated config when their next render runs — either by mutating their existing internal config object, or by switching them to read from the shared main-renderer config. Exact mechanism is an implementation detail to be decided during implementation, in line with what already exists; this design only mandates the _behavior_.

## Goals / Non-Goals

**Goals:**

- One general runtime config mutator and one full-snapshot getter on the renderer.
- Express the runtime-mutable input as a derivative of `MainRendererInitOptions` (`Omit<…, 'pieceUrls'>`) so the partial / deep-partial story does not drift between init-time and runtime.
- Make `pieceUrls` _type-level_ and _runtime-level_ impossible to write through `setConfig`.
- Establish a single, central place — the `Omit` exclusion union in `MainRendererSetConfigOptions` — that enumerates init-only fields. Future init-only sections are added there.
- Keep init-time configuration, normalization, and validation behavior identical.
- Surface every section, including `pieceUrls`, through `getConfig()`.
- For runtime updates that affect visible output (today: `colors`), trigger the existing renderer invalidation / render-scheduling path — same style as annotations / promotion. No ad-hoc DOM mutation from `setConfig`.

**Non-Goals:**

- Animation runtime config in any form (separate later change).
- A new "runtime-mutable" marker type or branding.
- A new runtime-surface storage pattern for main-renderer if the existing runtime-surface capture is sufficient (it is).
- Any change to `MainRendererInitOptions`, `createMainRenderer`, or `normalizeMainRendererConfig`.
- Backward-compatibility shims, deprecation aliases, or wrappers for `setDragConfig` / `getDragConfig`.
- Treating any one section as special-cased in the new API. `colors` and `drag` are equally first-class runtime-mutable today.
- A new type-test framework (e.g., `tsd`). Use whatever the repo already does (an inline `@ts-expect-error` test if no project pattern exists).

## Decisions

### Decision 1: Type — `MainRendererSetConfigOptions = Omit<MainRendererInitOptions, 'pieceUrls'>`

Define the runtime-mutator input as

```ts
export type MainRendererSetConfigOptions = Omit<MainRendererInitOptions, 'pieceUrls'>;
```

co-located with `MainRendererInitOptions` in `types/public.ts`, with a one-line comment that this is the lifecycle contract: every init-only field MUST appear in the `Omit` union.

**Rationale:**

- Reuses the existing partial / deep-partial story for every other section without redeclaring it.
- Init-only fields are removed at the type level, so callers cannot even spell them.
- The exclusion union is the _only_ place to update when a new init-only section is introduced.

**Alternatives considered:**

- Hand-written interface listing each runtime-mutable section. Rejected: drifts as sections are added.
- `Pick<MainRendererInitOptions, 'colors' | 'drag'>`. Rejected: a typo or omission silently strips a runtime-mutable section. `Omit` of init-only sections inverts the failure mode — adding a runtime-mutable section requires no change; adding an init-only section forces a touch on the union.

### Decision 2: API — `setConfig(options: MainRendererSetConfigOptions): void`

Replace the drag-only setter on `RendererPublicAPI`:

```ts
setConfig(options: MainRendererSetConfigOptions): void;
```

The factory implementation:

1. Defensively constructs the normalization input as `MainRendererSetConfigOptions` minus any property that could be `pieceUrls` at runtime (e.g., `const { pieceUrls: _ignored, ...safe } = options as MainRendererInitOptions; void _ignored;` — exact shape per implementation, but the contract is "do not pass `pieceUrls` to `normalizeMainRendererConfig`").
2. Calls `state.config = normalizeMainRendererConfig(safe, state.config)`.
3. Determines which sections changed (compared to the previous `state.config`) and, for each section that affects visible output, marks the corresponding dirty layer(s) and calls `state.runtimeSurface.commands.requestRender({ state: true })` — using the same `runtimeSurface.invalidation` + `runtimeSurface.commands.requestRender` pair that annotations uses.
4. For sections that do NOT affect visible output between events (today: `drag`), no invalidation / render request is needed — matches current `setDragConfig` behavior.

Today's mapping (concrete):

- `colors.board` changed → mark `DirtyLayer.Board` and `DirtyLayer.Coordinates` if both share the board geometry redraw (current `rendererBoardOnUpdate` already pairs them on geometry refresh; mirror that pairing here), or only the affected layer(s) if a narrower distinction is supported. Then `requestRender({ state: true })`.
- `colors.coordinates` changed → mark `DirtyLayer.Coordinates`. Then `requestRender({ state: true })`.
- `drag` changed → no invalidation, no render request. Same behavior as the previous `setDragConfig`.

Narrowness rule: invalidate as narrowly as the existing dirty-layer model supports. If a runtime input affects multiple layers and there is no finer existing distinction, mark all affected layers — do NOT introduce new dirty layers in this change.

For runtime updates to subsystems whose internal state is constructed by value (board, coordinates), the implementation MUST ensure the next render reads the updated colors. This is done by aligning with whatever mutation pattern already exists for those subsystems (mutate the internal `config` they hold, or read through a shared reference) — not by inventing a new pattern.

**Rationale:**

- `normalizeMainRendererConfig` already accepts a deep-partial `MainRendererInitOptions`-shaped input and merges against a base. `MainRendererSetConfigOptions` is structurally assignable; no normalization changes required.
- The invalidation + render-request pair is the established annotations / promotion idiom, using the runtime surface that main-renderer already captures.
- Per-section invalidation gating avoids gratuitous full re-renders while staying inside the existing dirty-layer vocabulary.

### Decision 3: API — `getConfig(): MainRendererConfigPublic`

Replace the drag-only getter on `RendererPublicAPI`:

```ts
getConfig(): MainRendererConfigPublic;
```

Factory implementation: `getConfig() { return cloneDeep(state.config); }`.

**Rationale:**

- Single getter for the full normalized config. Callers read any section via `getConfig().drag`, `.colors`, `.pieceUrls`, etc.
- `pieceUrls` is part of the renderer's normalized state (the complete internal mapping) and is meaningful to expose for diagnostics, mirroring, etc. — even though it cannot be written through `setConfig`.
- `MainRendererConfigPublic` is the existing public type that already corresponds to the normalized, readable form of the config.
- Matches the existing `cloneDeep`-based isolation that `getDragConfig` used.

### Decision 4: Removal — strip `setDragConfig` and `getDragConfig` outright, no aliases

Both are removed from `RendererPublicAPI` and the factory. No deprecation alias / wrapper / shim. Existing usages in tests / examples / docs (if any) MUST be migrated to `setConfig` / `getConfig`.

A repo-wide grep MUST return zero matches for both names _outside_ OpenSpec artifacts. The release-gate sweeps explicitly exclude `openspec/`, `node_modules`, and `dist`:

```
rg -n 'setDragConfig' --hidden -g '!node_modules' -g '!dist' -g '!openspec/**'
rg -n 'getDragConfig' --hidden -g '!node_modules' -g '!dist' -g '!openspec/**'
```

OpenSpec artifacts intentionally name the removed APIs (this design, the spec, the proposal, the tasks) and must not fail the gate.

### Decision 5: Runtime-surface storage — reuse the existing capture

Main-renderer already stores `runtimeSurface` on its internal state at instance construction (factory.ts:57). This is the same shape used by annotations and promotion. `setConfig` reads it via `state.runtimeSurface.commands.requestRender(...)` (and section-specific dirty marks via the invalidation pathway). No new storage primitive is introduced. If a renderer subsystem needs the surface to refresh visuals (e.g., to call into the existing render pipeline), use it the way annotations does.

### Decision 6: pieceUrls — readable, not writable; defensively stripped at runtime

`pieceUrls` is excluded from `MainRendererSetConfigOptions` at the type level (Decision 1) and is also stripped at the start of the `setConfig` implementation (Decision 2 step 1) before the input is forwarded to `normalizeMainRendererConfig`. This protects against non-TS callers (e.g., JS, dynamic objects, deserialized payloads) that bypass the type-level check.

`pieceUrls` IS readable through `getConfig()` (Decision 3) as part of the full normalized snapshot.

### Decision 7: Init-time and animation behavior — untouched

`createMainRenderer(MainRendererInitOptions)`, the `pieceUrls?: PieceUrlsPublic` field, the deep-partial wrapping, and `normalizeMainRendererConfig`'s assertions all stay as-is. Animation runtime config is not introduced; a future OpenSpec change will layer it on top of `setConfig` / `getConfig`.

## Risks / Trade-offs

- **Risk: future runtime-mutable sections forget to update the init-only exclusion list.** → Mitigation: the `Omit` union centralizes the init-only set in one place; the type comment pins the convention; reviewers see lifecycle decisions in one diff.
- **Risk: `Omit` over the interface accidentally drops the deep-partial structure of remaining fields.** → Mitigation: `MainRendererInitOptions` extends a homogeneous mapped type and only re-declares `pieceUrls`; `Omit<…, 'pieceUrls'>` removes only the re-declared field. Tasks include a type-shape verification step.
- **Risk: callers somewhere outside the searched surface still depend on the removed methods.** → Mitigation: tasks include a release-gate repo-wide grep (excluding OpenSpec artifacts) requiring zero matches.
- **Risk: `setConfig({ colors })` updates `state.config` but the next render still draws old colors because subsystems hold their own copy.** → Mitigation: this design mandates that a `colors` update results in observable redraw via the normal render pipeline. Implementation must align board / coordinates subsystem config sourcing with the runtime update — exact mechanism follows existing first-party patterns (mutate the internal config the subsystem already holds, OR have it read through a shared ref). Verified by a render-side test that asserts the visible output reflects updated colors.
- **Risk: exposing `pieceUrls` through `getConfig()` is misread as making it runtime-mutable.** → Mitigation: type-level removal in `MainRendererSetConfigOptions` makes write attempts a TS error; the runtime defensive strip handles non-TS callers; spec scenarios assert both.
- **Risk: invalidation is too coarse and causes unnecessary full re-renders.** → Mitigation: invalidate per-section using the existing `DirtyLayer` vocabulary; do not introduce new dirty layers; if a section maps to multiple existing layers, the broader mark is acceptable in this change. Narrower invalidation is a follow-up if needed.
- **Trade-off: `setConfig` accepts `{}` as a runtime no-op.** Acceptable: matches `normalizeMainRendererConfig`'s tolerance; simplifies the type.
- **Trade-off: `getConfig()` returns a deep clone, not a readonly view.** Acceptable: matches the existing pattern; can be tightened later without breaking callers.
