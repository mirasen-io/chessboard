[![NPM Version](https://img.shields.io/npm/v/%40mirasen%2Fchessboard)](https://www.npmjs.com/package/@mirasen/chessboard)
[![CI](https://github.com/mirasen-io/chessboard/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/mirasen-io/chessboard/actions/workflows/ci.yml)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=mirasen-io_chessboard&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=mirasen-io_chessboard)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=mirasen-io_chessboard&metric=coverage)](https://sonarcloud.io/summary/new_code?id=mirasen-io_chessboard)
[![License](https://img.shields.io/npm/l/@mirasen/chessboard)](./LICENSE)

# @mirasen/chessboard

Framework-agnostic TypeScript chessboard library focused on clean architecture, explicit rendering ownership, and extension-driven features.

## Status

**Early public release (`0.1.x`)**

The core architecture is already usable, but the package is still pre-`1.0.0` and the API may evolve.

Current focus:

- stable core runtime
- extension-driven rendering and interaction
- public wrapper / package API
- early integration ergonomics

Not finalized yet:

- promotion flow
- some higher-level public APIs
- broader test coverage
- final `1.0.0` API guarantees

## Goals

- framework-agnostic board core
- explicit runtime / render / interaction boundaries
- extension-first architecture
- predictable rendering ownership
- room for advanced features without core hacks

## Current features

- board rendering
- orientation support
- selection and drag interaction
- move targeting
- move animation foundation
- built-in visual extensions such as selected square, active target, legal moves, and last move
- board events extension with `setOnUiMove(...)` and `setOnRawUpdate(...)`

## Installation

```bash
npm install @mirasen/chessboard
```

## Example

```ts
import { createBoard } from '@mirasen/chessboard';

const board = createBoard({
	// API still evolving in 0.1.x
});

board.extensions.events.setOnUiMove((move) => {
	console.log('UI move:', move);
});
```

## Artwork

### Chessnut piece set

This project uses the Chessnut chess piece set.

This is the current default piece set used by the library.

- Author: Alexis Luengas — https://github.com/LexLuengas
- Source: https://github.com/LexLuengas/chessnut-pieces
- License: Apache License 2.0 — https://github.com/LexLuengas/chessnut-pieces/blob/master/LICENSE.txt

For details, see:

- [./assets/pieces/chessnut/ATTRIBUTION.md](./assets/pieces/chessnut/ATTRIBUTION.md)
- [./assets/pieces/chessnut/LICENSE.txt](./assets/pieces/chessnut/LICENSE.txt)

## Versioning note

`0.1.x` is an early public package release.

It exists so the package can be installed, explored, integrated experimentally, and published publicly while the library continues moving toward a more complete `1.0.0`.

Breaking changes are still possible before `1.0.0`.

## License

MIT
