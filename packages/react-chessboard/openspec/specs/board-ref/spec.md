## Purpose

Exposes the underlying `@mirasen/chessboard` board instance via React `ref`, giving consumers typed access to all extensions and runtime methods without additional wrapper props.

## Requirements

### Requirement: Chessboard forwards a board handle via ref

The `Chessboard` component SHALL accept a React ref and resolve it to a `ChessboardHandle` value whose shape is the public surface of the `@mirasen/chessboard` `Chessboard` type (including `extensions`, `move`, `setPosition`, `setOrientation`, `setMovability`, `destroy`, and all other methods on that surface).

#### Scenario: ref resolves to board handle after mount

- **WHEN** a consumer attaches a ref to `<Chessboard />` and the component mounts
- **THEN** `ref.current` SHALL be the board handle (non-null)

#### Scenario: ref is null before mount and after unmount

- **WHEN** the component has not yet mounted, or has unmounted
- **THEN** `ref.current` SHALL be `null`

### Requirement: Board handle exposes all extensions

The `ChessboardHandle` SHALL expose the `extensions` map containing every built-in extension that has a public API (e.g. `autoPromote`, `check`, `annotations`, `events`), fully typed from the core package.

#### Scenario: consumer reads and writes an extension property via ref

- **WHEN** a consumer calls `ref.current.extensions.check.square = 'e1'`
- **THEN** the check highlight SHALL update on the board as if the `checkSquare` convenience prop had been set to `'e1'`

#### Scenario: new core extension is accessible without wrapper changes

- **WHEN** `@mirasen/chessboard` adds a new extension with a public API and the package dependency is updated
- **THEN** the new extension SHALL be accessible via `ref.current.extensions.<id>` with no changes to the React wrapper

### Requirement: ChessboardHandle type is exported

The `ChessboardHandle` type SHALL be exported from the package's public index so consumers can type their refs.

#### Scenario: consumer types a ref with ChessboardHandle

- **WHEN** a consumer writes `const ref = useRef<ChessboardHandle>(null)`
- **THEN** the import SHALL compile without error using the named export from `@mirasen/react-chessboard`

### Requirement: Convenience props and ref target the same board instance

When both a convenience prop (e.g. `autoPromoteToQueen`) and a direct ref write target the same extension property, they SHALL operate on a single shared board instance (not separate copies).

#### Scenario: prop and ref write to the same state

- **WHEN** `autoPromoteToQueen={false}` is set as a prop and a consumer later calls `ref.current.extensions.autoPromote.toQueen = true`
- **THEN** the board SHALL reflect `true` (last writer wins); on the next React render the prop effect will re-apply its value

#### Scenario: consumer uses only ref for an extension without a convenience prop

- **WHEN** a consumer configures `ref.current.extensions.annotations.drawButton = 2` directly
- **THEN** the setting SHALL take effect immediately with no prop needed
