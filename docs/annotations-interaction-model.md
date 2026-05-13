# Annotation Interaction Model

## Baseline model principles

This document defines the library's normalized baseline interaction model for board annotations.

The model covers visual annotations that belong to the board UI: circle markers, arrows, annotation previews, and the ownership boundary between annotation interaction and core chess interaction.

This document is the source of truth for the library annotation model. It does not attempt to mirror any external product exactly in every edge case.

In this model, annotation changes are resolved on `pointerup`, not on `pointerdown`. `pointerdown` may start an extension-owned annotation drag gesture. While that gesture is active, the runtime/controller owns pointer movement and updates the active drag session target. The annotations extension derives preview state from that drag session during update, but committed annotation state is not changed until the gesture resolves.

In this model, annotation visuals are board-local UI state. The annotation model does not define persistence, serialization format, or domain-specific annotation semantics.

---

## Scope

This document defines the baseline interaction semantics for the board annotations extension.

In scope:

- circle annotations on board squares;
- arrow annotations between board squares;
- configured-button annotation gestures;
- annotation preview during active gestures;
- add, replace, and remove behavior;
- optional clearing on core board interaction;
- extension-owned annotation gestures;
- the runtime interaction action preview used to preserve ownership boundaries with core chess interaction.

Out of scope:

- persistence and serialization;
- keyboard-driven annotation interaction;
- touch-specific annotation behavior beyond configurable draw input;
- accessibility / focus behavior;
- text labels;
- square highlights;
- annotation hit-testing;
- multiple circle annotations on the same square;
- multiple arrows with the same source and target;
- special-case arrow shapes;
- semantic meaning beyond board-local visual annotations.

---

## Purpose

This document exists to define predictable annotation interaction semantics.

It should make it easy to answer:

- what does a configured draw-button pointer event mean in the current annotation state?
- when does the annotations extension
  - start an annotation gesture?
  - show a circle preview?
  - show an arrow preview?
  - add an annotation?
  - replace an annotation?
  - remove an annotation?
  - cancel a gesture without committing?

- when may annotations be cleared by core board interaction?
- when must annotation interaction pass through to core chess interaction?
- how does the annotations extension avoid duplicating the core chess interaction model?

---

## Annotation facts

These are the annotation facts used by the annotation interaction model.

### Circle annotation

A circle annotation marks one board square.

In this model:

- a circle annotation belongs to exactly one square;
- at most one circle annotation may exist for a given square;
- a circle annotation has a color;
- circle opacity, radius, stroke width, and preview styling are renderer-owned visual details.

The square is the identity of a circle annotation.

### Arrow annotation

An arrow annotation points from one board square to another board square.

In this model:

- an arrow annotation has a source square and target square;
- at most one arrow annotation may exist for a given `from -> to` pair;
- an arrow annotation has a color;
- arrow opacity, thickness, arrowhead size, offsets, and preview styling are renderer-owned visual details.

The ordered `from -> to` pair is the identity of an arrow annotation.

### Annotation color

Annotation color is the only public visual value in the annotation model.

In this model:

- public annotation data exposes color only;
- color is represented as a CSS-compatible string;
- opacity is not part of public annotation data;
- geometry and visual weight are controlled by the renderer.

### Annotation state

The annotations extension owns one annotation state.

In this model:

- there is no internal temporary/persistent split;
- circles and arrows belong to the same annotation extension state;
- consumers decide whether annotations are ephemeral or restored by controlling extension API calls and configuration;
- automatic clearing, when enabled, clears the extension annotation state.

### Annotation gesture

An annotation gesture is an extension-owned pointer interaction that may commit a circle or arrow annotation.

In this model:

- the gesture starts from a board square;
- the gesture may preview a circle or arrow;
- the gesture commits on `pointerup` when it resolves on the board;
- the gesture cancels without committing when it resolves outside the board or receives `pointercancel`.

---

## Context inputs

These inputs affect event interpretation in this model.

### Event phase

- `pointerdown`
- `pointermove`
- `pointerup`
- `pointercancel`

### Pointer button

- primary button (`button === 0`)
- secondary button (`button === 2`)
- other button

In the default annotation model, annotation drawing uses the secondary button.

Primary-button input belongs to core chess interaction unless the annotations extension explicitly owns an idle clearing gesture or is configured to use the primary button for annotation drawing.

### Configured draw input

Annotation drawing is controlled by `drawButton`.

In this model:

- `drawButton` defines which pointer button starts an annotation draw gesture;
- the default `drawButton` is the secondary button (`button === 2`);
- `drawButton` may be configured to the primary button (`button === 0`) for touch/mobile-style annotation mode;
- when the configured draw button matches the event, annotation drawing takes ownership before idle clearing behavior;
- when `drawButton === 0`, primary-button annotation drawing is intentionally annotation-owned and does not belong to core chess interaction for that event.

Annotation color may also be controlled by `drawModifier`.

In this model:

- `drawModifier === null` means the gesture color is resolved from the actual event modifier keys;
- a non-null `drawModifier` value forces that modifier color role for new draw gestures;
- when `drawModifier` is non-null, actual event modifier keys are ignored for annotation color resolution;
- the resolved color is captured when the annotation gesture starts;
- changing `drawModifier` during an active gesture does not change that gesture's color.

### Board ownership

- whether the relevant press started on the board

In this model, an annotation gesture is board-owned only if the relevant press started on a board square.

Implications:

- a press originating outside the board does not start an annotation gesture;
- `pointermove` alone must not create an annotation gesture;
- a gesture released outside the board must not commit an annotation.

### Square under pointer

- no square
- a square on the board

### Modifier keys

Modifier keys may select the annotation color for user-created annotations when `drawModifier === null`.

The modifier names follow DOM event modifier fields:

- `ctrl` means `event.ctrlKey`;
- `shift` means `event.shiftKey`;
- `alt` means `event.altKey`;
- `meta` means `event.metaKey`.

The default color mapping is:

| Modifier | Color role               |
| -------- | ------------------------ |
| none     | default annotation color |
| ctrl     | control annotation color |
| shift    | shift annotation color   |
| alt      | alt annotation color     |
| meta     | meta annotation color    |

The same resolved color is used for circle and arrow annotations.

### Runtime interaction action preview

The annotations extension receives a runtime interaction action preview from the input controller.

This preview describes the runtime interaction action the controller would execute if no extension consumed the event.

In this model:

- `runtimeInteractionActionPreview !== null` means core chess interaction is expected to own the event;
- `runtimeInteractionActionPreview === null` means no runtime interaction action is previewed for that event;
- the annotations extension must not duplicate core chess interaction decisions to determine whether a primary event belongs to core interaction.

---

## Annotation outcomes

These are the main interpretation outcomes the annotations extension may choose.

### Gesture-entry outcomes

- start annotation gesture
- start idle clear gesture
- pass through to core interaction
- ignore / no-op

### Preview outcomes

- show circle add preview
- show circle remove preview
- show arrow add preview
- show arrow remove preview
- clear preview
- keep preview unchanged

### Commit outcomes

- add circle annotation
- replace circle annotation
- remove circle annotation
- add arrow annotation
- replace arrow annotation
- remove arrow annotation
- clear all annotations
- cancel without committing

---

## Event responsibilities

### `pointerdown`

Responsible for interpreting the start of a possible annotation-owned gesture.

Possible meanings:

- start configured-button annotation draw gesture;
- start primary-button idle clear gesture when allowed;
- pass through to core chess interaction;
- ignore / no-op.

When a draw gesture starts, the annotations extension starts an extension-owned drag session. The annotation color is resolved at gesture start.

### `pointermove`

`pointermove` is not handled by the annotations extension as a separate event subscription.

The runtime/controller owns pointer movement after an extension-owned drag session has started. Pointer movement updates the active drag session target. The annotations extension observes the resulting drag session state during update and derives preview state from it.

Possible preview outcomes derived from the active draw drag session target:

- keep circle preview on the source square;
- switch to arrow preview when targeting another square;
- update arrow preview target;
- clear preview when no target square is resolved;
- no-op when no annotation draw gesture is active.

### `pointerup`

Responsible for committing or cancelling an already active annotation gesture.

Possible meanings:

- commit circle add, replace, or remove;
- commit arrow add, replace, or remove;
- clear all annotations from an idle clear gesture;
- cancel without committing;
- no-op.

### `pointercancel`

Responsible for cancelling an active annotation gesture without committing annotation state changes.

---

## Annotation identity model

### Circle identity

Circle identity is the square.

When a circle annotation is set for a square:

- if no circle exists on that square, a new circle is added;
- if a circle exists on that square with the same color, the circle is removed;
- if a circle exists on that square with a different color, the circle is replaced.

### Arrow identity

Arrow identity is the ordered `from -> to` pair.

When an arrow annotation is set for a `from -> to` pair:

- if no arrow exists for that pair, a new arrow is added;
- if an arrow exists for that pair with the same color, the arrow is removed;
- if an arrow exists for that pair with a different color, the arrow is replaced.

Arrow identity is directional. An arrow from `a` to `b` is distinct from an arrow from `b` to `a`.

---

## Visual model

The first annotation visual model uses:

- circles for square annotations;
- straight arrows for arrow annotations.

Arrows are free:

- any source square;
- any distinct target square;
- no chess-legality constraint;
- no special-case shape recognition.

### Committed visuals

Committed annotation visuals represent the current annotation state.

Expected layer ownership:

- committed annotations render in the extension's committed annotation layer;
- this layer is above pieces unless a later rendering decision changes the slot ownership.

### Preview visuals

Preview visuals represent the active annotation gesture before commit.

Expected layer ownership:

- preview circles render in the extension's active gesture layer;
- preview arrow lines render in the extension's active gesture layer;
- preview arrow markers render in the extension-owned defs layer;
- preview visuals do not commit annotation state until `pointerup` resolves on the board.

Preview rendering is derived from the active extension-owned draw drag session:

- no active draw gesture or no resolved target square means no preview;
- target square equal to the source square means circle preview;
- target square different from the source square means arrow preview.

The renderer owns preview SVG creation, update, and cleanup. Event handling and update logic must not directly mutate SVG nodes.

### Remove preview visuals

Remove previews communicate that releasing the current gesture would remove an existing annotation.

In this model:

- circle remove preview uses the circle preview geometry with remove-preview opacity;
- arrow remove preview uses committed arrow geometry with remove-preview opacity;
- the committed visual that would be removed is temporarily suppressed while the remove preview is active;
- suppression affects only rendering, not committed annotation state;
- if the preview target changes so the gesture no longer represents removal, the committed visual is rendered normally again.

This asymmetry is intentional.

---

## Draw annotation gesture model

Use this section as the primary interpretation guide for configured-button annotation draw gestures.

### Step 1 — Did the relevant press start on a board square?

- If no:
  - do not start an annotation gesture;
  - do not commit annotation changes;
  - interpret this branch as no-op.

- If yes:
  - continue.

### Step 2 — Is the event a configured draw-button `pointerdown`?

- If no:
  - do not start an annotation draw gesture;
  - pass through or ignore according to the relevant event path.

- If yes:
  - resolve annotation color from `drawModifier` or event modifier keys;
  - start an extension-owned annotation drag gesture from the pressed square;
  - the initial drag target is the source square;
  - show circle preview on the source square through the update/render cycle;
  - consume the event.

### Step 3 — Does the active draw drag session resolve to another board square?

The annotations extension does not separately own `pointermove`. Instead, the runtime/controller updates the active extension-owned drag session target, and the annotations extension derives preview from that target during update.

- If no target square is resolved:
  - clear or hide the active preview;
  - keep the gesture active until `pointerup` or `pointercancel`.

- If the resolved target square is the source square:
  - show circle preview.

- If the resolved target square differs from the source square:
  - show arrow preview from source square to resolved target square.

### Step 4 — Does `pointerup` resolve on the board?

- If no:
  - cancel the gesture;
  - clear preview;
  - do not commit annotation changes.

- If yes and the target square is the source square:
  - commit circle add, replace, or remove behavior.

- If yes and the target square differs from the source square:
  - commit arrow add, replace, or remove behavior.

---

## Circle annotation decision model

Use this section when an annotation gesture resolves as a circle annotation.

### Case C1 — No existing circle on the square

- interpretation:
  - add circle annotation

- state changes:
  - set circle annotation for the square using the resolved color

- notes:
  - this is the normal square marker creation path

### Case C2 — Existing circle has the same color

- interpretation:
  - remove circle annotation

- state changes:
  - remove circle annotation from the square

- notes:
  - repeated same-color gesture toggles the circle off

### Case C3 — Existing circle has a different color

- interpretation:
  - replace circle annotation

- state changes:
  - replace existing circle color with the resolved color

- notes:
  - different-color gesture changes the annotation color rather than adding another circle

### Circle annotation lookup table

| Existing circle | Resolved color relation | Interpretation | State changes                |
| --------------- | ----------------------- | -------------- | ---------------------------- |
| none            | n/a                     | add circle     | set circle for square        |
| present         | same color              | remove circle  | remove circle from square    |
| present         | different color         | replace circle | set circle to resolved color |

---

## Arrow annotation decision model

Use this section when an annotation gesture resolves as an arrow annotation.

### Case A1 — No existing arrow for `from -> to`

- interpretation:
  - add arrow annotation

- state changes:
  - set arrow annotation for the `from -> to` pair using the resolved color

- notes:
  - this is the normal arrow creation path

### Case A2 — Existing arrow has the same color

- interpretation:
  - remove arrow annotation

- state changes:
  - remove arrow annotation for the `from -> to` pair

- notes:
  - repeated same-color gesture toggles the arrow off

### Case A3 — Existing arrow has a different color

- interpretation:
  - replace arrow annotation

- state changes:
  - replace existing arrow color with the resolved color

- notes:
  - different-color gesture changes the annotation color rather than adding another arrow

### Arrow annotation lookup table

| Existing arrow | Resolved color relation | Interpretation | State changes                 |
| -------------- | ----------------------- | -------------- | ----------------------------- |
| none           | n/a                     | add arrow      | set arrow for `from -> to`    |
| present        | same color              | remove arrow   | remove arrow for `from -> to` |
| present        | different color         | replace arrow  | set arrow to resolved color   |

---

## Clearing on core interaction

Automatic clearing is controlled by `clearOnCoreInteraction`.

When `clearOnCoreInteraction` is disabled:

- core chess interaction never clears annotations automatically;
- annotations change only through annotation gestures or explicit extension API calls.

When `clearOnCoreInteraction` is enabled:

- the annotations extension may clear annotation state on configured core board interaction cleanup paths;
- clearing is intentionally limited to explicit cleanup paths, not every core interaction event.

The configured cleanup paths are:

1. idle primary clear gesture;
2. successful core move completion.

### Idle primary clear gesture

The idle primary clear gesture exists to support quick clearing without interfering with normal core interaction.

Start this annotation-owned gesture only when:

- event is primary-button `pointerdown`;
- the event does not match the configured `drawButton`;
- the pointer is on a board square;
- `runtimeInteractionActionPreview === null`;
- `clearOnCoreInteraction === true`;
- committed annotations are non-empty.

Then:

- `pointerup` on a board square clears all annotations;
- `pointerup` outside the board keeps annotations;
- `pointercancel` keeps annotations.

Important:

- if the event matches `drawButton`, the draw gesture takes ownership before idle clearing;
- if `runtimeInteractionActionPreview !== null`, the annotations extension must pass through;
- normal piece selection, reselection, release targeting, and lifted drag remain core-owned;
- the annotations extension must not duplicate the core chess interaction model.

### Successful core move completion

Successful core move completion clears annotations when `clearOnCoreInteraction === true`.

This cleanup is update-driven, not event-ownership-driven.

The annotations extension should clear committed annotations when the runtime mutation session contains a successful core move completion cause, such as `runtime.interaction.completeCoreDragTo`.

This path applies after a move has actually been completed by core interaction, including:

- lifted drag-and-drop move completion;
- release-targeting / click-to-move completion.

This path must not clear annotations on:

- selecting a source square;
- reselecting a source square;
- starting lifted drag;
- starting release targeting;
- updating the active target during drag;
- cancelling interaction;
- invalid move resolution that does not complete a move.

Important:

- this cleanup must not consume or prevent the core interaction event;
- this cleanup does not use `runtimeInteractionActionPreview` as its trigger;
- this cleanup should use the mutation/update signal that confirms the move was completed;
- if committed annotations are already empty, this cleanup should be a no-op.

---

## Runtime interaction boundary

The annotations extension observes core interaction intent through `runtimeInteractionActionPreview`.

The preview is computed by the input controller before extension event dispatch.

In this model:

- the preview is extension-visible but not extension-owned;
- the preview describes what the controller would execute if the event is not consumed;
- consuming the event prevents the previewed runtime interaction action from executing;
- the same previewed action is executed by the controller if no extension consumes the event.

This keeps annotation input ownership explicit while preserving core interaction ownership in the input controller.

The annotations extension also uses extension-owned drag sessions for draw gestures.

In this model:

- annotation draw starts from annotation-owned `pointerdown`;
- pointer movement is handled by the runtime/controller;
- the runtime updates the active extension-owned drag session target;
- the annotations extension observes that target during update;
- annotation preview is derived from the current draw drag session target;
- annotations do not subscribe to `pointermove` only to update preview;
- committed annotation state is still resolved only by `pointerup` / drag completion.

This keeps pointer movement centralized in the runtime/controller while allowing annotations to render live gesture previews.

---

## Future considerations

The annotation model may later grow additional board-local visual primitives or input modes.

Possible future directions:

- square highlight annotations;
- text labels;
- arrow hit-testing;
- explicit touch annotation mode;
- keyboard shortcuts;
- configurable visual variants.

These should be added only when a concrete library use case justifies them.
