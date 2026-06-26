---
'@mirasen/chessboard': patch
---

main-renderer: fix `setConfig` spuriously marking `Board` and `Coordinates` layers dirty (and requesting a render) when only unrelated fields like `drag` or `animation` were patched, or when called with `{}`.

The check relied on reference-equality of nested config objects across `toMerged` calls — which held under es-toolkit ≤ 1.47.1 by accident (a bug where `toMerged` reused references from `base` for untouched branches). es-toolkit 1.49.0 fixed that, exposing our bad assumption. Switched to structural equality via `isEqual`.
