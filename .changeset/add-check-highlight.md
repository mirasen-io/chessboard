---
'@mirasen/chessboard': minor
---

feat: add first-party `check` extension for king-in-check square highlighting

Adds a built-in `check` extension that renders a red radial glow on a consumer-supplied square to indicate a king in check. The board remains rules-agnostic — the highlighted square is entirely determined by the caller.

```ts
board.extensions.check.square = 'e1'; // highlight
board.extensions.check.square = null; // clear
```

The extension is included in the default built-in set, so no extra registration is needed. The default visual is a red radial gradient (center-to-transparent) rendered below pieces in the `underPieces` slot. Color and opacity are configurable via `createCheck({ color, opacity })`.
