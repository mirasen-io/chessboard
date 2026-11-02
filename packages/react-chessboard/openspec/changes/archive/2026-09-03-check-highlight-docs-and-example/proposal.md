## Why

The core `@mirasen/chessboard` check extension was extended to accept a `ColorInput` shorthand (e.g. `'w'`, `'white'`) in addition to a square string, letting the extension auto-locate the king — but the `react-chessboard` `checkSquare` prop still only accepts `SquareString | null`, making the color shorthand inaccessible to React consumers and forcing them to scan the board manually.

## What Changes

- **`checkSquare` prop type widens** from `SquareString | null` to `SquareString | ColorInput | null`, exposing the auto-king-locate shorthand
- **Example updated**: `getCheckSquare` helper in `examples/app/src/App.tsx` replaced with the simpler `chess.turn()` color shorthand — no manual board scan needed
- **README updated**: `checkSquare` section documents the color shorthand form and shows a one-liner integration pattern
- **`ColorInput` re-exported** from `@mirasen/react-chessboard` so consumers can type `checkSquare` without importing from the core package

## Capabilities

### New Capabilities

_(none — the check highlight feature already has a spec)_

### Modified Capabilities

- `check-square`: `checkSquare` prop type widens to `SquareString | ColorInput | null`; color shorthand synchronisation semantics added

## Impact

- `src/types.ts` — `checkSquare` type change (additive, backwards-compatible)
- `src/index.ts` — add `ColorInput` to re-exports if not already present
- `examples/app/src/App.tsx` — simplify check detection logic
- `README.md` — update `checkSquare` prop documentation
