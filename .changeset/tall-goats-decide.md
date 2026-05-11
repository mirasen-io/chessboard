---
'@mirasen/chessboard': minor
---

Refines extension/rendering internals before third-party extension APIs stabilize.

Breaking for custom extension authors:

- SVG helper exports were simplified around generic SVG helpers: `createSvgElement`, `createSvgRootElement`, `createSvgDefsElement`, and `clearSvgElementChildren`.
- `defs` is now an extension-owned top-level `<defs>` slot under the root `<svg>`, instead of a shared `defs-root`.
- `extensionUnmountBase` now clears the extension-owned slot roots directly and no longer accepts an `extensionId`.

Board/runtime initialization is now element-first. Most consumers using direct container-based board creation should not need migration changes.
