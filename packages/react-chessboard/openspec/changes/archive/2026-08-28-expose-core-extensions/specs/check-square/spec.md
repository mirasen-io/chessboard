## Purpose

Provides a declarative convenience prop for highlighting the king's square when in check, delegating to the core `check` extension.

## ADDED Requirements

### Requirement: checkSquare prop synchronises the check extension

The `Chessboard` component SHALL accept a `checkSquare` prop of type `SquareString | null | undefined`. When set to a `SquareString`, it SHALL synchronise `board.extensions.check.square` to that value. When set to `null` or `undefined`, it SHALL synchronise `board.extensions.check.square` to `null` (no highlight).

#### Scenario: check highlight appears when checkSquare is set

- **WHEN** `checkSquare="e1"` is passed as a prop
- **THEN** the check highlight SHALL be rendered on square `e1`

#### Scenario: check highlight clears when checkSquare is null

- **WHEN** `checkSquare` transitions from a square string to `null`
- **THEN** the check highlight SHALL be removed from the board

#### Scenario: checkSquare omitted means no highlight

- **WHEN** `checkSquare` is not provided (undefined)
- **THEN** no check highlight SHALL be rendered

### Requirement: checkSquare prop follows the autoPromoteToQueen synchronisation pattern

`checkSquare` SHALL be synchronised via a `useEffect` with `checkSquare` in its dependency array, mirroring the pattern used by `autoPromoteToQueen`.

#### Scenario: re-render with same value does not re-apply the setting

- **WHEN** a component re-renders with the same `checkSquare` value
- **THEN** the synchronisation effect SHALL NOT fire (React dependency array prevents it)

### Requirement: checkSquare type is exported

`SquareString` SHALL be re-exported from `@mirasen/react-chessboard` so consumers can type `checkSquare` values without importing from `@mirasen/chessboard` directly.

#### Scenario: consumer imports SquareString from the react package

- **WHEN** a consumer writes `import type { SquareString } from '@mirasen/react-chessboard'`
- **THEN** the import SHALL resolve without error
