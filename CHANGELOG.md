# @mirasen/chessboard

## 1.2.4

### Patch Changes

- eccb340: Fix fast drag-and-drop reliability in Chrome and other browsers that may dispatch `lostpointercapture` before or instead of `pointerup`.

  Active drag gestures now remember the pointer button that started them. When that button is released during `lostpointercapture`, the board resolves the gesture through the same terminal release path as `pointerup` instead of cancelling it prematurely.

  This fixes fast drops that could previously return a piece to its source square even when the target was valid, while preserving proper cleanup for fast releases outside the board and for extension-owned drag gestures such as annotations.

## 1.2.3

### Patch Changes

- d8df60e: Fix stale lifted-piece drag cleanup when pointer capture is lost.

  Fast drag gestures released outside the board could leave an active lifted-piece drag session alive if the browser delivered `lostpointercapture` instead of a normal `pointerup`. The input adapter now handles `lostpointercapture`, clears stale pointer tracking, and routes the event through the interaction controller so active drag sessions are cancelled cleanly.

  This prevents dragged pieces from remaining visually attached to the pointer after an outside-board release.

## 1.2.2

### Patch Changes

- 6adedbe: dependabot: directory '/', update @sveltejs/kit
- 6adedbe: dependabot: directory '/', update @types/node
- 6adedbe: dependabot: directory '/', update svelte
- 8b28f59: fix: graceful teardown in events extension unsubscribe during board.destroy()

  `unsubscribeEvent` no longer asserts that the input adapter is alive — if it's already destroyed, unsubscription is a no-op since subscriptions are gone with the adapter.

## 1.2.1

### Patch Changes

- 7f5649f: Update README and documentation entry points for the built-in annotations release.

  The README now describes annotations as part of the default first-party extension baseline, adds a short annotations section, updates the explicit extension-list example, and links to the new documentation hub.

## 1.2.0

### Minor Changes

- 101903a: Add board annotations with square markers, free arrows, live previews, and programmatic annotation APIs.
- 101903a: Refines extension/rendering internals before third-party extension APIs stabilize.

  Breaking for custom extension authors:
  - SVG helper exports were simplified around generic SVG helpers: `createSvgElement`, `createSvgRootElement`, `createSvgDefsElement`, and `clearSvgElementChildren`.
  - `defs` is now an extension-owned top-level `<defs>` slot under the root `<svg>`, instead of a shared `defs-root`.
  - `extensionUnmountBase` now clears the extension-owned slot roots directly and no longer accepts an `extensionId`.

  Board/runtime initialization is now element-first. Most consumers using direct container-based board creation should not need migration changes.

### Patch Changes

- 4ec620b: dependabot: directory '/', update @sveltejs/kit
- 4ec620b: dependabot: directory '/', update eslint
- 4ec620b: dependabot: directory '/', update globals
- 4ec620b: dependabot: directory '/', update svelte-check
- 49760cc: dependabot: directory '/', update @sveltejs/kit
- 49760cc: dependabot: directory '/', update @types/node
- 49760cc: dependabot: directory '/', update publint
- 49760cc: dependabot: directory '/', update svelte-check
- 49760cc: dependabot: directory '/', update typescript-eslint
- 559677e: dependabot: directory '/', update @eslint/compat
- 559677e: dependabot: directory '/', update publint
- 72a1480: dependabot: directory '/', update @playwright/test
- 72a1480: dependabot: directory '/', update @types/node
- 72a1480: dependabot: directory '/', update @vitest/browser-playwright
- 72a1480: dependabot: directory '/', update @vitest/coverage-istanbul
- 72a1480: dependabot: directory '/', update playwright
- 72a1480: dependabot: directory '/', update prettier-plugin-svelte
- 72a1480: dependabot: directory '/', update publint
- 72a1480: dependabot: directory '/', update typescript-eslint
- 72a1480: dependabot: directory '/', update vitest

## 1.1.5

### Patch Changes

- 1256271: Add a subtle default Mirasen board watermark.

## 1.1.4

### Patch Changes

- 86d630d: Link to the React chessboard package from the README.

## 1.1.3

### Patch Changes

- dc95241: Use an explicit ChessJsMoveInput type for chess.js adapter output.

## 1.1.2

### Patch Changes

- 6c108b6: Export public input types for wrapper packages.

## 1.1.1

### Patch Changes

- 8b3781c: dependabot: directory '/', update @ktarmyshov/assert
- 8b3781c: dependabot: directory '/', update es-toolkit
- 8b3781c: dependabot: directory '/', update typescript-eslint
- c877d35: dependabot: directory '/', update jsdom

## 1.1.0

### Minor Changes

- 3956358: Add a stable chess.js adapter with pure move conversion helpers.

### Patch Changes

- 3956358: Fix lifted-drag animation suppression for compound moves.
- 3956358: Fix `onUIMove` so it only fires for committed UI moves.

## 1.0.7

### Patch Changes

- 92c3a69: Fix promotion animation planning when cancelling deferred promotion moves after a previous promotion.
- 92c3a69: Fix piece suppression updates during deferred move animations.

## 1.0.6

### Patch Changes

- e81b3fd: Fix scheduler `flushNow()` so pending frames flush synchronously.

## 1.0.5

### Patch Changes

- 0422020: Fix fast drag-and-drop sometimes leaving a stale drag visual due to an unsynced target square.
- 0422020: Update dependencies
- 0422020: Fix promotion extension to accept renderer-compatible piece URL maps without throwing on extra entries.
- 0422020: Allow createBoard options to configure built-in extensions without direct factory calls.

## 1.0.4

### Patch Changes

- f586eea: Update README integration examples and export move-related public types.

## 1.0.3

### Patch Changes

- 09962d6: Prevent native mobile selection and callout behavior on the board surface and coordinate labels.

## 1.0.2

### Patch Changes

- db4969e: Fix README

## 1.0.1

### Patch Changes

- be927e3: Call `preventDefault()` for board-handled input events to suppress native browser behavior.

## 1.0.0

### Major Changes

- 2609920: First v1.0.0 release with the new extension-driven architecture, built-in chess interaction baseline, promotion flow, and auto-promote support.

### Patch Changes

- 31364b7: dependabot: directory '/', update @sveltejs/kit
- 31364b7: dependabot: directory '/', update @vitest/browser-playwright
- 31364b7: dependabot: directory '/', update eslint-plugin-svelte
- 31364b7: dependabot: directory '/', update svelte
- 2609920: Added promotion and auto-promotion to queen extensions

## 1.0.0-rc.0

### Major Changes

- 2609920: First 1.0 release candidate with the new extension-driven architecture, built-in chess interaction baseline, promotion flow, and auto-promote support.

### Patch Changes

- 2609920: Added promotion and auto-promotion to queen extensions

## 0.1.1

### Patch Changes

- f6ceb99: Fix relative import issues

## 0.1.0

### Minor Changes

- 18dd9f1: Early public release
