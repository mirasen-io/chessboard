## ADDED Requirements

### Requirement: Runtime setConfig API

The main renderer SHALL expose a public method `setConfig(options: MainRendererSetConfigOptions): void` on the renderer instance. The method SHALL apply the provided options on top of the renderer's current normalized config and replace the current config with the resulting normalized config, using the same normalization and validation pipeline as init-time configuration with the current normalized config as the base. The method SHALL accept all sections of `MainRendererInitOptions` except those listed in the init-only exclusion union of `MainRendererSetConfigOptions`. The method SHALL NOT special-case any individual section.

#### Scenario: Updating drag config at runtime

- **WHEN** a caller invokes `renderer.setConfig({ drag: { pieceScale: 1.2 } })` on a constructed renderer
- **THEN** the renderer's effective drag config reflects `pieceScale: 1.2` for subsequent rendering and pointer interaction
- **AND** all other config sections retain their previous normalized values

#### Scenario: Updating colors at runtime

- **WHEN** a caller invokes `renderer.setConfig({ colors: { board: { light: '#ffffff' } } })` on a mounted renderer
- **THEN** the call is accepted by the type system on the same partial / deep-partial terms as init-time options
- **AND** `renderer.getConfig().colors.board.light` returns `'#ffffff'`
- **AND** other color fields retain their previous normalized values
- **AND** the visible board / coordinates output is refreshed through the normal renderer render pipeline (not by ad-hoc DOM mutation)

#### Scenario: Empty options is a no-op

- **WHEN** a caller invokes `renderer.setConfig({})`
- **THEN** the call returns successfully
- **AND** the renderer's effective config is unchanged
- **AND** no render is requested as a result of the call

#### Scenario: Invalid section value is rejected by the existing normalization

- **WHEN** a caller invokes `renderer.setConfig({ drag: { pieceScale: 0 } })` (a value the existing normalization rejects)
- **THEN** the call fails with the same validation behavior as init-time normalization
- **AND** the renderer's effective config is unchanged

### Requirement: setConfig triggers visual invalidation for visible sections

When `setConfig` accepts a runtime input that affects sections producing visible output, the implementation SHALL mark the corresponding renderer dirty layer(s) and request a render through the existing renderer pipeline (the same `runtimeSurface.invalidation.markDirty` + `runtimeSurface.commands.requestRender` pair used by the established first-party-extension pattern). The implementation SHALL NOT mutate the DOM ad hoc from inside `setConfig`.

The implementation SHALL keep invalidation as narrow as the existing dirty-layer model supports. New dirty layers MUST NOT be introduced by this change.

#### Scenario: setConfig({ colors }) refreshes visible output through the normal render path

- **WHEN** a caller invokes `renderer.setConfig({ colors: { board: { light: '#aabbcc' } } })` on a mounted renderer
- **THEN** the renderer schedules a render via the existing render-scheduling path
- **AND** on the next render, the board's light squares are drawn with `#aabbcc`

#### Scenario: setConfig({ drag }) preserves current drag config behavior

- **WHEN** a caller invokes `renderer.setConfig({ drag: { ... } })`
- **THEN** the new drag config is applied to subsequent drag interactions
- **AND** the runtime behavior of drag-only updates matches the prior `setDragConfig` behavior (no immediate render is required for drag-only updates)

#### Scenario: No DOM mutation outside the render pipeline

- **WHEN** any `setConfig` call is processed
- **THEN** the implementation does not directly create, remove, or modify SVG / DOM nodes from inside `setConfig`
- **AND** all visible output changes flow through the existing renderer subsystems' render functions

### Requirement: Runtime setConfig options exclude init-only sections

The runtime mutator's input type, named `MainRendererSetConfigOptions`, SHALL be derived from `MainRendererInitOptions` by excluding init-only fields via an `Omit` union. Today the init-only set is exactly `'pieceUrls'`. The type derivation SHALL preserve the partial / deep-partial shape of all remaining sections. Any future init-only section MUST be added to this `Omit` exclusion union.

#### Scenario: pieceUrls is rejected at the type level

- **WHEN** a caller writes `renderer.setConfig({ pieceUrls: { wK: '...' } })` in TypeScript
- **THEN** the TypeScript compiler reports a type error on the `pieceUrls` property

#### Scenario: pieceUrls is ignored at runtime even if present

- **WHEN** a runtime caller passes an object containing a `pieceUrls` property to `setConfig` (e.g., a plain JS caller bypassing the type system)
- **THEN** the renderer's `pieceUrls` is unchanged
- **AND** the rest of the input is normalized and applied as usual

#### Scenario: Remaining sections accept partial input

- **WHEN** a caller writes `renderer.setConfig({ drag: { pieceScale: 1.1 } })` providing only one nested field
- **THEN** the TypeScript compiler accepts the call
- **AND** unprovided nested fields are not required

#### Scenario: New runtime-mutable section is automatically accepted

- **WHEN** `MainRendererInitOptions` gains a new section that is NOT added to the init-only exclusion union
- **THEN** that section is automatically accepted by `MainRendererSetConfigOptions`
- **AND** no manual duplication of the init-options shape is required

#### Scenario: New init-only section is excluded by extending the Omit union

- **WHEN** a future change introduces a new init-only section
- **THEN** the section is excluded from `MainRendererSetConfigOptions` by extending the `Omit` exclusion union (e.g., `Omit<MainRendererInitOptions, 'pieceUrls' | '<new-section>'>`)
- **AND** the section remains accepted by `MainRendererInitOptions` for construction-time use

### Requirement: Full-snapshot getConfig API

The main renderer SHALL expose a public method `getConfig()` on the renderer instance that returns the fully normalized renderer config snapshot, including every section — `pieceUrls`, `drag`, `colors`, and any future section. The returned snapshot SHALL be a deep clone (or otherwise isolated copy) such that mutating it does not affect the renderer's internal state.

#### Scenario: getConfig returns the full normalized snapshot

- **WHEN** a caller invokes `renderer.getConfig()` on a constructed renderer
- **THEN** the returned value contains every config section in its fully normalized form
- **AND** the returned value's `pieceUrls` is the complete normalized piece-URL mapping (not the optional / partial init-time shape)

#### Scenario: getConfig reflects setConfig updates

- **WHEN** a caller invokes `renderer.setConfig({ drag: { pieceScale: 1.4 } })` and then calls `renderer.getConfig()`
- **THEN** the returned snapshot's `drag.pieceScale` is `1.4`
- **AND** other sections in the returned snapshot reflect their current normalized values

#### Scenario: Returned snapshot is independent of internal state

- **WHEN** a caller calls `renderer.getConfig()` and mutates the returned object
- **THEN** the renderer's internal config is unaffected

#### Scenario: pieceUrls is readable but not runtime-writable

- **WHEN** a caller reads `renderer.getConfig().pieceUrls`
- **THEN** the value is the complete normalized piece-URL mapping
- **AND** there is no public runtime path (`setConfig` or otherwise) that accepts `pieceUrls` as input

### Requirement: setDragConfig and getDragConfig are removed from the public API

The renderer public API SHALL NOT expose `setDragConfig` or `getDragConfig`. The replacement runtime path for updating drag config SHALL be `setConfig({ drag })`. The replacement read path for drag config SHALL be `getConfig().drag`. No deprecated alias, wrapper, or compatibility shim SHALL be retained for either method. All existing usages in source, tests, examples, and documentation SHALL be migrated to the new API.

#### Scenario: Removed methods are not present on the renderer instance

- **WHEN** a caller inspects the renderer's public API surface (type or runtime)
- **THEN** there is no `setDragConfig` method
- **AND** there is no `getDragConfig` method
- **AND** there is no exported alias under any other name that forwards to either of them

#### Scenario: Repo-wide references are eliminated outside OpenSpec artifacts

- **WHEN** a repo-wide search is performed for the identifiers `setDragConfig` and `getDragConfig`, excluding `node_modules`, `dist`, and `openspec/`
- **THEN** the search returns zero matches in source, tests, examples, and documentation

### Requirement: Init-time configuration is unchanged

The behavior of `createMainRenderer(MainRendererInitOptions)` SHALL be unchanged. `pieceUrls` SHALL remain init-only with respect to writes — accepted at construction, normalized to a complete internal mapping, and not mutable at runtime. `pieceUrls` IS readable at runtime through `getConfig()`.

#### Scenario: Construction accepts pieceUrls and runtime write paths do not

- **WHEN** `createMainRenderer({ pieceUrls: { ... } })` is invoked at construction
- **THEN** the renderer normalizes and uses those piece URLs (same behavior as before this change)
- **AND** there is no public runtime API that accepts `pieceUrls` as input

#### Scenario: Init-time normalization rules are preserved

- **WHEN** `createMainRenderer(options)` is invoked
- **THEN** the same merging, deep-partial handling, `pieceUrls` completeness assertion, and per-section validation that existed before this change are applied
- **AND** the resulting config has the same shape and values that the previous implementation would have produced for the same input

#### Scenario: Animation runtime config is not introduced

- **WHEN** this change is applied
- **THEN** no new public type, method, or section for animation runtime config is added
- **AND** any future animation-runtime work is out of scope of this change
