## Why

Users of `@mirasen/chessboard` who build real games need to highlight the king's square when it is in check — a near-universal expectation set by lichess/chess.com. A [real-world consumer](https://github.com/TheUnemployedHobo/multiplayer-chess/issues/1#issuecomment-5360389948) of `@mirasen/react-chessboard` asked for it, and it was raised as [issue #124](https://github.com/mirasen-io/chessboard/issues/124). The board is deliberately rules-agnostic, so today there is no first-party way to show a check indicator.

## What Changes

- Add a first-party `check` extension that highlights at most one square with a red radial "glow", rendered below the pieces.
- Expose a public, extension-owned property: `board.extensions.check.square = 'e1'` to set, `= null` to clear.
- The board does **not** compute whether the king is in check. The consumer supplies the square; determining check remains the responsibility of the game/rules layer.
- Ship a sensible default visual matching lichess/chessground (red radial gradient), with configurable color/opacity.
- Register `check` in the built-in extension factory map and the default built-in extension set so it is available out of the box.

Out of scope for this change:

- The React `checkSquare` prop lives in the separate `mirasen-io/react-chessboard` repository and will be handled there as its own change (a normal prop synchronized to `extensions.check.square` in a `useEffect`, following `autoPromoteToQueen`).

## Capabilities

### New Capabilities

- `check-highlight`: A first-party board extension that renders a single-square highlight for a consumer-supplied "in check" square, with an extension-owned public API and a configurable default visual.

### Modified Capabilities

<!-- None. -->

## Impact

- New extension source under `src/extensions/first-party/check/` (`types.ts`, `factory.ts`, and an `invalidation.ts` helper).
- Edits to `src/extensions/types/wrapper.ts`: add `check` to `builtInExtensionFactoryMap` and `DefaultBuiltinChessboardExtensions`.
- New public surface: `board.extensions.check.square: SquareString | null` (additive; no breaking changes).
- Renders into the existing `underPieces` slot; reuses `svgIds` for a unique `<radialGradient>` id.
- No core board mutations; the extension requests its own re-render via the runtime surface.
