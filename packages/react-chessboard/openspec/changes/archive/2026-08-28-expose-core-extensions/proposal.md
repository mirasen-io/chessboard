## Why

Every new first-party extension in `@mirasen/chessboard` that exposes a public API currently requires a matching prop addition in the React wrapper — adding dead weight to the wrapper's surface and creating release lag. The `check` extension being added to core is the immediate trigger, but the real fix is a structural one: expose the full board handle once via `forwardRef`, and add only a small set of convenience props for the most common declarative settings.

## What Changes

- **New**: `Chessboard` becomes a `forwardRef` component; `ref` resolves to a `ChessboardHandle` whose shape is the public `Chessboard` surface from `@mirasen/chessboard` — giving consumers direct typed access to `board.extensions.*`, `board.move(...)`, `board.setPosition(...)`, and all other runtime methods without any wrapper changes.
- **New**: `checkSquare` convenience prop (`SquareString | null`) — syncs `board.extensions.check.square` declaratively, following the same pattern as `autoPromoteToQueen`.
- No changes to `position`, `externalMove`, `orientation`, `movability`, `onUIMove`, `autoPromoteToQueen` — all existing props are preserved as-is.

## Capabilities

### New Capabilities

- `board-ref`: Exposes the core `Chessboard` board instance via React `ref` (`forwardRef` + `useImperativeHandle`), giving consumers full typed access to all extensions and runtime methods.
- `check-square`: `checkSquare` convenience prop that declaratively synchronises the `check` extension's `square` property.

### Modified Capabilities

_(none — no existing spec-level behavior changes)_

## Impact

- `src/Chessboard.tsx`: wrap with `forwardRef`, add `useImperativeHandle`, add `checkSquare` effect.
- `src/types.ts`: add `checkSquare` to `ChessboardProps`; export `ChessboardHandle` type.
- `src/index.ts`: export `ChessboardHandle`.
- Consumers using `ref` on `<Chessboard>` previously received a DOM element; they now receive `ChessboardHandle`. This is a **breaking change for any consumer that was forwarding or reading the DOM ref directly** — in practice no documented or supported use of `ref` on this component existed, so impact is expected to be zero.
- Peer dependency lower bound in `package.json` bumped from `^1.1.3` to `^1.4.0` (the version that introduces the `check` extension).
