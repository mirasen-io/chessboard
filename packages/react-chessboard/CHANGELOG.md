# @mirasen/react-chessboard

## 2.0.1

### Patch Changes

- 203e689: dependabot: dependency updates for PR #119
- f25ea15: dependabot: dependency updates for PR #121
- 0977154: dependabot: dependency updates for PR #122

## 2.0.0

### Major Changes

- f146d13: Require React 19 or newer. React 18 is no longer supported.

### Patch Changes

- cdffe21: dependabot: dependency updates for PR #102
- 5cf4c2b: dependabot: dependency updates for PR #104
- 4b616c5: dependabot: dependency updates for PR #105
- 95d438c: dependabot: dependency updates for PR #106
- 7fe333f: dependabot: dependency updates for PR #108
- 0921e88: dependabot: dependency updates for PR #109
- ab1c979: dependabot: dependency updates for PR #112
- 6c3d801: dependabot: dependency updates for PR #113
- e576c26: dependabot: dependency updates for PR #114
- 9e3b7f6: dependabot: dependency updates for PR #115
- bd78bfa: dependabot: dependency updates for PR #116
- 973252e: dependabot: dependency updates for PR #117

## 1.2.1

### Patch Changes

- 545a69d: chore: update dependencies
- e41f65e: dependabot: dependency updates for PR #101
- 3afa25f: dependabot: dependency updates for PR #81
- e5cc87a: dependabot: dependency updates for PR #83
- 81d6a65: dependabot: dependency updates for PR #86
- a6a81ba: dependabot: dependency updates for PR #93
- f4877c3: dependabot: dependency updates for PR #94
- 487d69e: dependabot: dependency updates for PR #95
- abc3015: dependabot: dependency updates for PR #96
- e98b74e: dependabot: dependency updates for PR #97
- 817ed11: dependabot: dependency updates for PR #98
- 3667c45: dependabot: dependency updates for PR #99

## 1.2.0

### Minor Changes

- 8068804: Widen `checkSquare` prop type to accept `ColorInput` (e.g. `'w'`, `'white'`) in addition to `SquareString | null`, delegating king-location to the core check extension. Updates minimum `@mirasen/chessboard` peer to `^1.5.0`.

## 1.1.1

### Patch Changes

- 2297261: dependabot: directory '/', update @testing-library/react
- 2297261: dependabot: directory '/', update @types/node

## 1.1.0

### Minor Changes

- 26ef306: Expose board handle via ref and add `checkSquare` convenience prop.

  - `Chessboard` is now a `forwardRef` component. `ref.current` resolves to a `ChessboardHandle` — the full public surface of the underlying `@mirasen/chessboard` board instance, including all extensions and runtime methods. Future core extensions are accessible via `ref.current.extensions.<id>` without any wrapper changes.
  - New `checkSquare` prop (`SquareString | null`) — declaratively highlights the king's square when in check, delegating to the core `check` extension.
  - `ChessboardHandle` and `SquareString` are now exported from the package index.
  - Bumped `@mirasen/chessboard` minimum to `^1.4.0` (adds the `check` extension).

### Patch Changes

- ac62bcf: chore: switch coverage provider from istanbul to v8
- 0e001f0: dependabot: directory '/', update @mirasen/chessboard
- 68df85a: dependabot: directory '/', update globals
- 388cebc: dependabot: directory '/', update typescript-eslint
- 68df85a: dependabot: directory '/', update publint
- 78940bb: dependabot: directory '/', update @types/node
- 68df85a: dependabot: directory '/', update eslint
- 388cebc: dependabot: directory '/', update typescript-eslint
- 68df85a: dependabot: directory '/', update globals
- 916cc63: dependabot: directory '/', update @changesets/cli
- 2bbe950: dependabot: directory '/', update @vitest/coverage-istanbul
- 68df85a: dependabot: directory '/', update vitest
- 916cc63: dependabot: directory '/', update @changesets/cli
- 68df85a: dependabot: directory '/', update publint
- 68df85a: dependabot: directory '/', update eslint
- 78940bb: dependabot: directory '/', update @types/node
- 68df85a: dependabot: directory '/', update eslint
- 388cebc: dependabot: directory '/', update typescript-eslint

## 1.0.3

### Patch Changes

- 8d3e6e8: dependabot: directory '/', update @types/node
- c253682: dependabot: directory '/', update @vitest/coverage-istanbul
- c253682: dependabot: directory '/', update vitest
- 9d21c86: dependabot: directory '/', update typescript-eslint
- 4fccb91: dependabot: directory '/', update @types/node
- 9687055: dependabot: directory '/', update prettier
- c8b9790: dependabot: directory '/', update eslint
- e8350e0: dependabot: directory '/', update typescript-eslint
- f58e882: dependabot: directory '/', update @changesets/cli
- 56ee8d5: dependabot: directory '/', update typescript-eslint
- aff046b: dependabot: directory '/', update prettier
- 33fcf8f: dependabot: directory '/', update publint
- 819d6a6: dependabot: directory '/', update eslint
- 337792b: dependabot: directory '/', update globals
- 434d635: dependabot: directory '/', update @types/node
- f7ed029: dependabot: directory '/', update jsdom
- 7a453ee: dependabot: directory '/', update jsdom

## 1.0.2

### Patch Changes

- bffad2d: dependabot: directory '/', update @mirasen/chessboard
- bffad2d: dependabot: directory '/', update @vitest/coverage-istanbul
- bffad2d: dependabot: directory '/', update eslint
- bffad2d: dependabot: directory '/', update typescript-eslint
- bffad2d: dependabot: directory '/', update vitest
- 53d1362: dependabot: directory '/', update @types/node
- 01672dd: dependabot: directory '/', update typescript-eslint
- da2523f: dependabot: directory '/', update prettier
- a2453df: dependabot: directory '/', update @types/node
- bb08fe3: dependabot: directory '/', update eslint
- 46afc66: dependabot: directory '/', update @vitest/coverage-istanbul
- 46afc66: dependabot: directory '/', update vitest
- 1e8f79b: dependabot: directory '/', update typescript-eslint
- 43b7e05: dependabot: directory '/', update @types/node
- 1c4356b: dependabot: directory '/', update globals
- 1c4356b: dependabot: directory '/', update typescript-eslint
- bccd72f: dependabot: directory '/', update @types/node
- a50bae8: dependabot: directory '/', update @mirasen/chessboard
- a50bae8: dependabot: directory '/', update prettier
- 13b8f0d: dependabot: directory '/', update eslint
- 13b8f0d: dependabot: directory '/', update prettier
- 0da601f: dependabot: directory '/', update prettier
- e3fafbc: dependabot: directory '/', update prettier
- 6c0701e: dependabot: directory '/', update typescript-eslint
- 51ad26b: dependabot: directory '/', update prettier

## 1.0.1

### Patch Changes

- 9f46bc4: dependabot: directory '/', update @eslint/compat
- 9f46bc4: dependabot: directory '/', update @mirasen/chessboard
- 9f46bc4: dependabot: directory '/', update @types/node
- 9f46bc4: dependabot: directory '/', update @vitest/coverage-istanbul
- 9f46bc4: dependabot: directory '/', update publint
- 9f46bc4: dependabot: directory '/', update typescript-eslint
- 9f46bc4: dependabot: directory '/', update vitest
- 74c67ed: dependabot: directory '/', update @mirasen/chessboard
- 74c67ed: dependabot: directory '/', update @types/node
- 74c67ed: dependabot: directory '/', update @vitest/coverage-istanbul
- 74c67ed: dependabot: directory '/', update eslint
- 74c67ed: dependabot: directory '/', update typescript-eslint
- 74c67ed: dependabot: directory '/', update vitest
- fd99828: dependabot: directory '/', update typescript
- 08c6067: dependabot: directory '/', update typescript-eslint
- 9ffb114: dependabot: directory '/', update @mirasen/chessboard
- 9ffb114: dependabot: directory '/', update eslint
- 9ffb114: dependabot: directory '/', update globals
- f481791: dependabot: directory '/', update @types/node
- f481791: dependabot: directory '/', update publint
- f481791: dependabot: directory '/', update typescript-eslint

## 1.0.0

### Major Changes

- 72c5e89: Initial stable release of the React chessboard wrapper.

  Adds a `Chessboard` component backed by `@mirasen/chessboard`, id-based position and external move requests, built-in UI move handling, auto-promotion control, chess.js adapter re-exports, and a Vite React smoke example.
