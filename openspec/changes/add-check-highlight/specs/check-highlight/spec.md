## Purpose

Provides a first-party board extension that highlights a single consumer-supplied square to indicate a king in check, without the board itself computing check state.

## ADDED Requirements

### Requirement: Consumer-controlled check square

The extension SHALL expose a public, extension-owned property `square` accessible as `board.extensions.check.square`. The property SHALL accept a `SquareString` to highlight that square, or `null` to indicate no highlight. The board SHALL NOT compute whether a king is in check; the highlighted square is entirely determined by the consumer-provided value.

#### Scenario: Setting a square shows the highlight

- **WHEN** the consumer sets `board.extensions.check.square = 'e1'`
- **THEN** the extension renders a single check highlight over square `e1`

#### Scenario: Clearing the square removes the highlight

- **WHEN** a highlight is shown and the consumer sets `board.extensions.check.square = null`
- **THEN** the extension removes the check highlight and no check highlight is rendered

#### Scenario: Reading the current value

- **WHEN** the consumer has set `board.extensions.check.square = 'e1'`
- **THEN** reading `board.extensions.check.square` returns `'e1'`
- **AND** when no square is set, reading it returns `null`

#### Scenario: Invalid square value is rejected

- **WHEN** the consumer sets `square` to a value that is not a valid `SquareString` and not `null`
- **THEN** the extension SHALL reject the value rather than rendering an incorrect highlight

### Requirement: At most one highlighted square

The extension SHALL highlight at most one square at any time. Setting `square` to a new value SHALL replace any previously highlighted square.

#### Scenario: Changing the square moves the highlight

- **WHEN** `square` is `'e1'` and the consumer sets `square = 'e8'`
- **THEN** the highlight over `e1` is removed
- **AND** a single highlight is rendered over `e8`

### Requirement: Idempotent updates

Setting `square` to a value equal to the current value SHALL be a no-op and SHALL NOT trigger a redundant re-render.

#### Scenario: Setting the same square again is a no-op

- **WHEN** `square` is `'e1'` and the consumer sets `square = 'e1'` again
- **THEN** no additional render is requested and the existing highlight is left unchanged

### Requirement: Highlight rendered below pieces

The check highlight SHALL be rendered beneath the pieces so that the piece on the highlighted square remains fully visible.

#### Scenario: Piece stays visible over the highlight

- **WHEN** a check highlight is shown on a square that contains a piece
- **THEN** the highlight is drawn below the piece and the piece is not obscured

### Requirement: Default check visual with configurable color and opacity

The extension SHALL provide a sensible default check visual: a red radial "glow" consistent with common chess UIs (lichess/chessground), brightest at the square center and fading to transparent toward the edges. The extension SHALL allow the highlight color and opacity to be configured at creation time, and SHALL fall back to the default when no configuration is provided.

#### Scenario: Default visual is a red radial glow

- **WHEN** the extension is created without configuration and a square is highlighted
- **THEN** the highlight is a red radial gradient centered on the square, fading to transparent at the edges

#### Scenario: Configured color and opacity are applied

- **WHEN** the extension is created with a custom color and/or opacity and a square is highlighted
- **THEN** the highlight uses the configured color and opacity instead of the defaults

### Requirement: Highlight stays aligned across geometry changes

The check highlight SHALL remain aligned to its square when the board geometry changes (for example, resize or orientation/flip), for as long as a square is set.

#### Scenario: Highlight realigns after resize

- **WHEN** a square is highlighted and the board geometry is refreshed (resize or orientation change)
- **THEN** the highlight is re-rendered so that it stays aligned to the same square

### Requirement: Available as a built-in extension

The `check` extension SHALL be registered among the built-in extensions and included in the default built-in extension set, so it is available on a board created with default extensions without extra registration.

#### Scenario: Present on a default board

- **WHEN** a board is created with the default set of built-in extensions
- **THEN** `board.extensions.check` is available and its `square` property can be set and cleared
