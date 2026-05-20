## Why

The main renderer currently exposes a narrowly-scoped pair of runtime config methods (`setDragConfig` / `getDragConfig`) that only address one section. As the runtime-mutable surface evolves, repeating per-section setters and getters would force the public API to grow one method per section and force callers to learn each one separately. A single general `setConfig()` that accepts any combination of runtime-mutable sections, paired with a single `getConfig()` that returns the fully normalized config snapshot, is cleaner, more extensible, and aligns with how `MainRendererInitOptions` is already shaped.

## What Changes

- Add `setConfig(options: MainRendererSetConfigOptions): void` to the main-renderer public API.
- Add `getConfig(): MainRendererConfigPublic` to the main-renderer public API. It SHALL return the fully normalized renderer config — every section, including `pieceUrls`.
- Define `MainRendererSetConfigOptions` as `Omit<MainRendererInitOptions, 'pieceUrls'>` — same partial / deep-partial shape as init options, with `pieceUrls` removed at the type level.
- Runtime config scope rule: **all existing `MainRendererInitOptions` sections except `pieceUrls` are runtime-mutable through `setConfig`**. Today that means `colors` and `drag` are both runtime-mutable. `drag` is not the only or the special section. Any future init-only section MUST be added explicitly to the `Omit` exclusion union.
- `setConfig` MUST normalize input through the same pipeline as init-time configuration, using the renderer's current normalized config as the base. If a runtime input object somehow contains `pieceUrls` (e.g., via a non-TS caller), `setConfig` MUST NOT update `pieceUrls`.
- `setConfig` MUST trigger the appropriate visual invalidation/render scheduling for sections that affect visible output (notably `colors`), following the established first-party-extension pattern (annotations / promotion). It MUST NOT mutate the DOM ad hoc.
- `pieceUrls` is init-only with respect to writes (excluded from `setConfig` at type level and at runtime), but readable through `getConfig()` as part of the full normalized snapshot.
- **BREAKING**: Remove `setDragConfig()` from the renderer public API and from `RendererPublicAPI`. No deprecated alias, no compatibility wrapper.
- **BREAKING**: Remove `getDragConfig()` from the renderer public API and from `RendererPublicAPI`. Callers read drag config (and any other section) via `getConfig().drag`. No deprecated alias, no compatibility wrapper.
- All existing usages / tests / examples of `setDragConfig` / `getDragConfig` MUST be migrated to `setConfig` / `getConfig`. Repo-wide grep (excluding `openspec/`, `node_modules`, `dist`) MUST return zero matches for both names.
- Init-time configuration behavior is unchanged: `createMainRenderer(MainRendererInitOptions)` and the normalization pipeline behave exactly as before.
- Animation runtime config is **not** introduced here. It will be a separate later OpenSpec change layered on top of `getConfig` / `setConfig`.

## Capabilities

### New Capabilities

- `main-renderer-runtime-config`: Runtime-mutable configuration surface for the main renderer — defines which config sections are runtime-mutable, the `setConfig` and `getConfig` API contracts, the `MainRendererSetConfigOptions` type, and the visual-invalidation guarantees for runtime config updates.

### Modified Capabilities

<!-- No existing specs in openspec/specs/ for the main renderer; this is the first spec covering its runtime-config surface. -->

## Impact

- **Public types** (`src/extensions/first-party/main-renderer/types/public.ts`): adds `MainRendererSetConfigOptions = Omit<MainRendererInitOptions, 'pieceUrls'>`. May remove orphan aliases (`MainRendererInitOptionsDrag`, `MainRendererConfigPublicDrag`) if no longer referenced after the API swap.
- **Public extension interface** (`src/extensions/first-party/main-renderer/types/extension.ts`): removes `setDragConfig` and `getDragConfig`; adds `setConfig` and `getConfig`.
- **Factory** (`src/extensions/first-party/main-renderer/factory.ts`): replaces the drag-only setter/getter with `setConfig` / `getConfig`. `setConfig` runs input through `normalizeMainRendererConfig` against the current state (with `pieceUrls` defensively stripped), then performs the section-appropriate invalidation/render scheduling using `state.runtimeSurface` (matching the annotations pattern).
- **Subsystems that consume mutable color config** (`board`, `coordinates`): may need to read their colors from a shared mutable source on the main-renderer state instead of a value baked in at construction, so a runtime `colors` update is observed on the next render. Exact shape determined during implementation per the design.
- **Init-time config**: unchanged.
- **Callers of `setDragConfig` / `getDragConfig`**: only the public type declaration and the factory currently reference them; any tests / examples / docs identified during the call-site sweep MUST be migrated.
- **Out of scope**: animation runtime config, any new normalization rules, any new init-only field, broader `RendererPublicAPI` redesign.
