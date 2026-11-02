## Context

See proposal.md — Why. The core `@mirasen/chessboard` check extension already accepts `SquareString | ColorInput | null` on its `square` setter. The `Chessboard.tsx` sync effect passes `checkSquare` directly to `board.extensions.check.square`, so no logic change is needed — only the TypeScript type declaration and docs need updating. `ColorInput` is already re-exported from `@mirasen/react-chessboard/src/index.ts`.

## Goals / Non-Goals

**Goals:**

- Widen `checkSquare` prop type to `SquareString | ColorInput | null`
- Update the example to use the color shorthand (remove manual king-scan)
- Update README to document the color shorthand form

**Non-Goals:**

- Changes to the synchronisation effect in `Chessboard.tsx` (no logic change needed)
- Adding auto-check detection to the component (caller responsibility by design)

## Decisions

**Type widening only — no runtime change**: The extension setter already handles `ColorInput`, so the sync effect in `Chessboard.tsx` needs no modification. The change is a TypeScript declaration update at the prop boundary.

**Example uses `chess.turn()` directly**: Rather than maintaining state as `SquareString | null`, the example can pass `chess.isCheck() ? chess.turn() : null` — the `ColorInput` shorthand — eliminating the `getCheckSquare` helper entirely.

## Risks / Trade-offs

- **Type widening is backwards-compatible**: existing callers passing `SquareString | null` continue to work without changes.
- **`ColorInput` resolution is positional at render time**: if the board position changes and `checkSquare` doesn't, the highlight moves with the king on the next render cycle — this is the correct behavior and matches what the core extension does.
