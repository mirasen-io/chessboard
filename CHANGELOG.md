# @mirasen/chessboard

## 1.1.1

### Patch Changes

- 8b3781c: dependabot: directory '/', update @ktarmyshov/assert
- 8b3781c: dependabot: directory '/', update es-toolkit
- 8b3781c: dependabot: directory '/', update typescript-eslint

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
