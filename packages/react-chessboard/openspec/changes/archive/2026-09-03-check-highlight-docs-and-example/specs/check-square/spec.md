## MODIFIED Requirements

### Requirement: checkSquare prop synchronises the check extension

The `Chessboard` component SHALL accept a `checkSquare` prop of type `SquareString | ColorInput | null | undefined`. When set to a `SquareString`, it SHALL synchronise `board.extensions.check.square` to that square string. When set to a `ColorInput` (e.g. `'w'`, `'b'`, `'white'`, `'black'`), it SHALL synchronise `board.extensions.check.square` to that color value, delegating king-location to the core extension. When set to `null` or `undefined`, it SHALL synchronise `board.extensions.check.square` to `null` (no highlight).

#### Scenario: check highlight appears when checkSquare is set to a square string

- **WHEN** `checkSquare="e1"` is passed as a prop
- **THEN** the check highlight SHALL be rendered on square `e1`

#### Scenario: check highlight appears when checkSquare is set to a color shorthand

- **WHEN** `checkSquare="w"` is passed as a prop
- **THEN** the check highlight SHALL be rendered on the white king's current square

#### Scenario: check highlight appears when checkSquare is set to a full color name

- **WHEN** `checkSquare="white"` is passed as a prop
- **THEN** the check highlight SHALL be rendered on the white king's current square

#### Scenario: check highlight clears when checkSquare is null

- **WHEN** `checkSquare` transitions from any non-null value to `null`
- **THEN** the check highlight SHALL be removed from the board

#### Scenario: checkSquare omitted means no highlight

- **WHEN** `checkSquare` is not provided (undefined)
- **THEN** no check highlight SHALL be rendered

## MODIFIED Requirements

### Requirement: checkSquare type is exported

`SquareString` and `ColorInput` SHALL be re-exported from `@mirasen/react-chessboard` so consumers can type `checkSquare` values without importing from `@mirasen/chessboard` directly.

#### Scenario: consumer imports SquareString from the react package

- **WHEN** a consumer writes `import type { SquareString } from '@mirasen/react-chessboard'`
- **THEN** the import SHALL resolve without error

#### Scenario: consumer imports ColorInput from the react package

- **WHEN** a consumer writes `import type { ColorInput } from '@mirasen/react-chessboard'`
- **THEN** the import SHALL resolve without error
