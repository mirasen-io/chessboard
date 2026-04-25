[![NPM Version](https://img.shields.io/npm/v/%40mirasen%2Fchessboard)](https://www.npmjs.com/package/@mirasen/chessboard)
[![CI](https://github.com/mirasen-io/chessboard/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/mirasen-io/chessboard/actions/workflows/ci.yml)
[![License](https://img.shields.io/npm/l/@mirasen/chessboard)](./LICENSE)

# @mirasen/chessboard

A framework-agnostic TypeScript chessboard platform with real chess interaction built in and an extension-driven architecture.

## Why this exists

Most chessboards fall into one of two buckets:

- rendering primitives that leave core interaction UX to app code
- tightly coupled monoliths that are hard to extend cleanly

`@mirasen/chessboard` aims for a better balance:

- meaningful built-in chess interaction out of the box
- first-party extensions for common board UX
- explicit rendering and ownership boundaries
- extension-driven growth without turning the board into glue hell

This is not just a board renderer. It is a chessboard platform designed for real chess interaction.

## What you get out of the box

The built-in first-party extension baseline currently includes both foundational runtime-facing extensions and user-facing board features.

- `renderer` — the first-party rendering extension that validates the same extension architecture used for board features
- `events`
- `selectedSquare`
- `activeTarget`
- `legalMoves`
- `lastMove`
- `promotion`
- `autoPromote`

That means the board already covers a meaningful baseline chess UX instead of stopping at “draw squares and pieces”.

## Highlights

- Real built-in chess interaction
- Extension-driven architecture
- First-party baseline extensions
- Explicit SVG slot ownership
- Clean separation between runtime, rendering, interaction, and animation
- Promotion flow built into the board pipeline
- Optional auto-promotion as a separate behavior extension

## Installation

```bash
npm install @mirasen/chessboard
```

## Live examples

Interactive examples are available on the Mirasen website:

- [Examples overview](https://mirasen.io/chessboard/examples/)
- [Minimal interactive example](https://mirasen.io/chessboard/examples/minimal.html)
- [Legal moves example](https://mirasen.io/chessboard/examples/legal-moves.html)
- [Promotion example](https://mirasen.io/chessboard/examples/promotion.html)

## Usage

### Minimal example

```ts
import { createBoard } from '@mirasen/chessboard';

const element = document.getElementById('board');

if (!element) {
	throw new Error('Missing board element');
}

const board = createBoard({
	element
});
// Set free movability, default - disabled
board.setMovability({
	mode: 'free'
});
```

### Explicit extensions

```ts
import { createBoard, type Chessboard, type ChessboardExtensionInput } from '@mirasen/chessboard';

const extensionList = [
	// Always add renderer first, otherwise nothing will be rendered
	'renderer',
	'lastMove',
	// Keep autoPromote before promotion, otherwise promotion may defer the move first
	'autoPromote',
	'promotion'
	// customExtensionDefinition
] as const satisfies readonly ChessboardExtensionInput[];
let board: Chessboard<typeof extensionList> | null = null;

const element = document.getElementById('board');

if (!element) {
	throw new Error('Missing board element');
}

board = createBoard({
	element,
	extensions: extensionList
});
```

### setOnUIMove

```ts
import { createBoard } from '@mirasen/chessboard';

const element = document.getElementById('board');

if (!element) {
	throw new Error('Missing board element');
}

const board = createBoard({
	element,
	state: {
		board: 'start',
		interaction: {
			movability: {
				mode: 'free'
			}
		}
	}
});

board.extensions.events.setOnUIMove((move) => {
	console.log('UI move:', move);
});
```

### setMovability - strict with explicit destinations

```ts
import { createBoard } from '@mirasen/chessboard';

const element = document.getElementById('board');

if (!element) {
	throw new Error('Missing board element');
}

const board = createBoard({
	element
});

board.setMovability({
	mode: 'strict',
	destinations: {
		e2: [{ to: 'e3' }, { to: 'e4' }],
		d7: [
			{ to: 'c8', promotedTo: ['queen', 'rook', 'bishop', 'knight'] },
			{ to: 'd8', promotedTo: ['queen', 'rook', 'bishop', 'knight'] }
		],
		g1: [{ to: 'f3' }, { to: 'h3' }]
	}
});
```

### setMovability - strict with a resolver

```ts
import { createBoard } from '@mirasen/chessboard';

const element = document.getElementById('board');

if (!element) {
	throw new Error('Missing board element');
}

const board = createBoard({
	element
});

board.setMovability({
	mode: 'strict',
	destinations: (source) => {
		if (source === 'e2')
			return [
				{ to: 'e8', promotedTo: ['bishop', 'queen'] },
				{ to: 'd8', promotedTo: ['rook', 'knight', 'queen'] }
			];
		if (source === 'f7')
			return [
				{ to: 'f8', promotedTo: ['bishop', 'rook', 'knight', 'queen'] },
				{ to: 'g8', promotedTo: ['bishop', 'rook', 'knight', 'queen'] }
			];
		if (source === 'd7')
			return [
				{ to: 'd1', promotedTo: ['bishop', 'knight'] },
				{ to: 'e1', promotedTo: ['rook', 'knight', 'queen'] }
			];
		if (source === 'c2')
			return [
				{ to: 'c1', promotedTo: ['bishop', 'rook', 'knight', 'queen'] },
				{ to: 'b1', promotedTo: ['bishop', 'rook', 'knight', 'queen'] }
			];
		return undefined;
	}
});
```

## Promotion and auto-promotion

Promotion is handled inside the board interaction pipeline through a natural deferred move flow.

That means the board does not need the awkward pattern of:

- reject move
- open external dialog
- replay the move later

Instead:

- `promotion` provides the built-in promotion chooser UI
- `autoPromote` provides behavior-only auto-promotion logic

These are separate extensions on purpose:

- `promotion` is UI
- `autoPromote` is behavior

This separation is a good example of the architecture: common chess UX can be built in without collapsing everything into one hardcoded board layer.

```ts
import { createBoard } from '@mirasen/chessboard';

const element = document.getElementById('board');

if (!element) {
	throw new Error('Missing board element');
}

const board = createBoard({
	element
});

board.extensions.autoPromote.toQueen = true;
```

## Architecture

`@mirasen/chessboard` is built around explicit boundaries:

- runtime owns board, interaction, and update semantics
- renderer owns SVG structure and visual layers
- animation owns transition planning and temporary visual occupancy
- extensions render through declared slots instead of ad hoc DOM access

The goal is to make common chess interaction powerful without making the system brittle.

## Not just a primitive, not a monolith

The project is intentionally positioned between two weak extremes:

### Primitive-only board

A board that only renders pieces and leaves everything else to app code often forces consumers to rebuild the same interaction UX repeatedly.

### Hardcoded monolith

A board that handles everything internally without clean boundaries becomes difficult to evolve, customize, or extend.

`@mirasen/chessboard` aims for a middle path:

- strong built-in baseline interaction
- clean internal architecture
- extension-driven feature growth

## Project direction

This platform is being built as a foundation for richer chess learning and interaction workflows, but the board itself is designed to stand as a serious open-source UI platform in its own right.

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
