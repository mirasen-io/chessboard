## ADDED Requirements

### Requirement: Animation config section on the main renderer config

The main renderer config SHALL expose an `animation` section containing a single field, `durationMs: number`. The section SHALL be a sibling of the existing `colors`, `drag`, and `pieceUrls` sections under the same `MainRendererConfig` template, and SHALL therefore appear automatically on `MainRendererInitOptions`, `MainRendererSetConfigOptions`, and the `MainRendererConfigPublic` snapshot returned by `getConfig()`. The implementation SHALL NOT add any other public method (e.g. `setAnimationConfig`, `getAnimationConfig`) for the animation config, and SHALL NOT add a separate `disableAnimations` boolean.

#### Scenario: Init-time animation config is accepted

- **WHEN** a caller invokes `createMainRenderer({ animation: { durationMs: 120 } })`
- **THEN** the renderer is constructed successfully
- **AND** `renderer.getPublic().getConfig().animation.durationMs` returns `120`

#### Scenario: Animation section is partial-mergeable like other sections

- **WHEN** a caller invokes `createMainRenderer({ animation: { durationMs: 120 } })` and later calls `renderer.getPublic().setConfig({ animation: { durationMs: 80 } })`
- **THEN** `renderer.getPublic().getConfig().animation.durationMs` returns `80`
- **AND** all other config sections retain their previous normalized values

#### Scenario: No dedicated animation methods on the public API

- **WHEN** a caller inspects the renderer's public API surface (type or runtime)
- **THEN** there is no `setAnimationConfig` method
- **AND** there is no `getAnimationConfig` method
- **AND** there is no `disableAnimations` field anywhere in the config

### Requirement: Default animation duration preserves current behavior

The normalized default value of `animation.durationMs` SHALL be `180`, matching the duration that was hardcoded in the animation update path before this change. This change extracts existing behavior into config; it does not change the default timing. The default SHALL be applied when the caller omits `animation` entirely from `MainRendererInitOptions`, and when the caller provides `animation` as an empty object. Both `DefaultMainRendererDesktopConfig` and `DefaultMainRendererMobileConfig` SHALL include this default.

#### Scenario: Default config exposes durationMs 180

- **WHEN** a caller invokes `createMainRenderer()` with no options
- **THEN** `renderer.getPublic().getConfig().animation.durationMs` returns `180`

#### Scenario: Empty animation object falls back to default

- **WHEN** a caller invokes `createMainRenderer({ animation: {} })`
- **THEN** `renderer.getPublic().getConfig().animation.durationMs` returns `180`

#### Scenario: Existing observable behavior is preserved when animation is omitted

- **WHEN** a caller constructs a renderer without an `animation` section and triggers a piece move
- **THEN** the existing observable animation duration and lifecycle are preserved (the duration submitted to the runtime animation surface is `180`, and the prepare / render / clean lifecycle runs as before)

### Requirement: durationMs validation

`animation.durationMs` SHALL be validated as a finite number greater than or equal to zero. The implementation SHALL use the same `assert()`-based synchronous validation style as the existing `drag.pieceScale` validation in `validateMainRendererConfig`, and SHALL throw on invalid input at normalization time. The implementation SHALL reject negative numbers, `NaN`, `+Infinity`, `-Infinity`, and non-number values.

#### Scenario: Negative durationMs is rejected

- **WHEN** a caller invokes `createMainRenderer({ animation: { durationMs: -1 } })`
- **THEN** the call throws

#### Scenario: NaN durationMs is rejected

- **WHEN** a caller invokes `createMainRenderer({ animation: { durationMs: Number.NaN } })`
- **THEN** the call throws

#### Scenario: Infinity durationMs is rejected

- **WHEN** a caller invokes `createMainRenderer({ animation: { durationMs: Number.POSITIVE_INFINITY } })`
- **THEN** the call throws
- **AND** `Number.NEGATIVE_INFINITY` is also rejected

#### Scenario: Non-number durationMs is rejected at runtime

- **WHEN** a caller (bypassing the type system) invokes `createMainRenderer({ animation: { durationMs: '180' as unknown as number } })`
- **THEN** the call throws with the same finite-number assertion error as for `NaN`

#### Scenario: Validation rejects invalid values via setConfig as well

- **WHEN** a caller invokes `renderer.getPublic().setConfig({ animation: { durationMs: -5 } })` on a constructed renderer
- **THEN** the call throws
- **AND** the renderer's effective `animation.durationMs` is unchanged

#### Scenario: Zero is a valid value

- **WHEN** a caller invokes `createMainRenderer({ animation: { durationMs: 0 } })`
- **THEN** the call succeeds
- **AND** `renderer.getPublic().getConfig().animation.durationMs` returns `0`

### Requirement: Positive durationMs controls the existing animation duration

When `animation.durationMs` is a positive number, the existing animation creation/submission code path in the main renderer's update logic SHALL be preserved unchanged, with `animation.durationMs` substituted for the previously-hardcoded duration constant. The implementation SHALL pass `animation.durationMs` through the existing `runtimeSurface.animation.submit({ duration })` call site and SHALL NOT introduce a parallel animation pipeline. The implementation SHALL NOT special-case any move type (castle, capture, promotion, en passant, simple move) — they all share the same duration.

#### Scenario: Custom positive durationMs is used by the existing animation submission

- **WHEN** a renderer constructed with `animation: { durationMs: 350 }` triggers a piece move that yields a non-empty animation plan
- **THEN** the animation update path submits a session through the existing `runtimeSurface.animation.submit` call with `duration: 350`
- **AND** the rest of the animation lifecycle (prepare / render / clean / suppression) runs unchanged

#### Scenario: Coordinated multi-piece animation shares the configured duration

- **WHEN** a renderer constructed with `animation: { durationMs: 350 }` triggers a move whose plan contains multiple coordinated tracks (e.g. a castle)
- **THEN** the single coordinated session is submitted with `duration: 350`
- **AND** the planner output is otherwise unchanged from the pre-change behavior

#### Scenario: Move types are not special-cased

- **WHEN** the animation update path submits a session for any move type
- **THEN** the duration applied to that session is exactly `state.config.animation.durationMs`
- **AND** no branch of the animation update path applies a different duration based on move type

### Requirement: durationMs of zero skips the animation creation branch

When `animation.durationMs === 0`, the main renderer's animation update path SHALL skip the animation creation branch for that update. Specifically, for that update the implementation SHALL NOT call `runtimeSurface.animation.submit`, SHALL NOT insert an entry into the animation subsystem's `entries` map, SHALL NOT record any animation suppression for that update, and SHALL NOT run the animation lifecycle (prepare / render / clean) for that update. The normal renderer render path SHALL render the current/final board state. The implementation SHALL NOT submit a zero-duration session, SHALL NOT route through any synthetic immediate-completion path, and SHALL NOT add a parallel "commit" code path.

#### Scenario: Move under durationMs zero produces no animation submission

- **WHEN** a renderer constructed with `animation: { durationMs: 0 }` is driven through a piece move that would otherwise yield a non-empty animation plan
- **THEN** the animation update path does NOT call `runtimeSurface.animation.submit` for that update
- **AND** the animation subsystem's `entries` map gains no new entry for that update

#### Scenario: No animation suppression is recorded under durationMs zero

- **WHEN** a renderer constructed with `animation: { durationMs: 0 }` is driven through a piece move
- **THEN** the animation subsystem reports no suppressed squares for that update (the result of the suppressed-squares query is empty for that update)
- **AND** the regular render path renders the post-move piece positions

#### Scenario: No animation lifecycle runs under durationMs zero

- **WHEN** a renderer constructed with `animation: { durationMs: 0 }` is driven through a piece move
- **THEN** no `prepareAnimation` / `renderAnimation` / `cleanAnimation` work is performed by the main-renderer animation subsystem for that update
- **AND** no zero-duration animation session is created for that update

#### Scenario: Switching to durationMs zero at runtime takes effect on the next move

- **WHEN** a caller invokes `renderer.getPublic().setConfig({ animation: { durationMs: 0 } })` on a renderer that previously used a positive duration
- **THEN** the next piece move follows the no-animation-creation path described above
- **AND** any animation session already in flight at the time of the `setConfig` call is allowed to complete on its previous duration

### Requirement: getConfig exposes the normalized animation section

`renderer.getPublic().getConfig()` SHALL return a snapshot whose `animation` section is the fully normalized animation config, including all defaults applied. The returned `animation` object SHALL be an isolated deep clone — mutating it SHALL NOT affect the renderer's internal state.

#### Scenario: getConfig returns the normalized animation section

- **WHEN** a caller invokes `renderer.getPublic().getConfig()` after constructing the renderer with `animation: { durationMs: 250 }`
- **THEN** the returned snapshot's `animation.durationMs` is `250`

#### Scenario: Mutating the returned animation snapshot does not affect the renderer

- **WHEN** a caller invokes `renderer.getPublic().getConfig()`, mutates the returned `animation` object, and then calls `getConfig()` again
- **THEN** the second snapshot's `animation` reflects the renderer's actual internal state
- **AND** the mutation made to the first snapshot is not observed in the second

#### Scenario: getConfig reflects setConfig updates to animation

- **WHEN** a caller invokes `renderer.getPublic().setConfig({ animation: { durationMs: 50 } })` and then calls `renderer.getPublic().getConfig()`
- **THEN** the returned snapshot's `animation.durationMs` is `50`

### Requirement: setConfig updates animation config at runtime through the existing API

`renderer.getPublic().setConfig({ animation })` SHALL update the renderer's animation config in place using the existing runtime `setConfig` pipeline (the same normalization and validation as init-time, with the current normalized config as the base). The update SHALL take effect on the next animation creation decision in the existing update path. The implementation SHALL NOT require renderer remount, SHALL NOT introduce a new dirty layer for animation, and SHALL NOT request a render solely because the animation section changed. If a single `setConfig` call also includes a section that already triggers invalidation (e.g. `colors`), that section's existing dirty-marking and render-request behavior SHALL be unchanged.

#### Scenario: setConfig animation update is observed by the next move

- **WHEN** a caller invokes `renderer.getPublic().setConfig({ animation: { durationMs: 75 } })` on a constructed renderer and then triggers a piece move
- **THEN** the resulting animation submission uses `duration: 75`
- **AND** no renderer remount is required

#### Scenario: setConfig with only animation does not request a render

- **WHEN** a caller invokes `renderer.getPublic().setConfig({ animation: { durationMs: 75 } })` and no other section changes
- **THEN** no dirty layer is marked
- **AND** no render is requested as a result of the call

#### Scenario: setConfig combining animation and colors preserves colors invalidation

- **WHEN** a caller invokes `renderer.getPublic().setConfig({ animation: { durationMs: 75 }, colors: { board: { light: '#ffffff' } } })`
- **THEN** the colors-section invalidation behavior is unchanged from the pre-change behavior (the corresponding dirty layer is marked and a render is requested)
- **AND** `animation` updates the normalized config but does not by itself add additional dirty layers or render requests

#### Scenario: setConfig animation does not introduce a new dirty layer

- **WHEN** the implementation processes a `setConfig({ animation })` call
- **THEN** the renderer's `DirtyLayer` enum has not been extended with an animation-specific layer

### Requirement: animation config is owned by the main renderer

The `animation.durationMs` config SHALL be defined on the main-renderer config surface and SHALL NOT be added to the core runtime config, the interaction model, or the board-state model. The animation subsystem SHALL read the live `animation.durationMs` value from `MainRendererInstanceInternal.config` at the moment it would otherwise have used the previously-hardcoded duration constant, using the same getter-closure pattern that the main renderer already uses for `colors` so that runtime updates are observed without re-creating the subsystem.

#### Scenario: Animation config is on the main-renderer config surface

- **WHEN** the renderer's public config types are inspected
- **THEN** `animation.durationMs` appears on `MainRendererConfigPublic`, `MainRendererInitOptions`, and `MainRendererSetConfigOptions`
- **AND** the core runtime config, the interaction model, and the board-state model do not gain any animation-duration field

#### Scenario: Animation subsystem reads live config

- **WHEN** the animation update path is at the existing animation creation/submission decision point
- **THEN** it reads the duration from the renderer's live, normalized config rather than from a constant or from a snapshot taken at construction time
