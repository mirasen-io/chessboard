[![NPM Version](https://img.shields.io/npm/v/%40mirasen%2Fchessboard)](https://www.npmjs.com/package/@mirasen/chessboard)
[![CI](https://github.com/mirasen-io/chessboard/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/mirasen-io/chessboard/actions/workflows/ci.yml)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=mirasen-io_chessboard&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=mirasen-io_chessboard)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=mirasen-io_chessboard&metric=coverage)](https://sonarcloud.io/summary/new_code?id=mirasen-io_chessboard)
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

The default first-party extension baseline includes rendering, events, selection, active target feedback, legal move hints, last move feedback, promotion UI, and optional auto-promotion.

- `renderer` — the first-party rendering extension that validates the same extension architecture used for board features
- `events`
- `selectedSquare`
- `activeTarget`
- `legalMoves`
- `lastMove`
- `promotion`
- `autoPromote`

That means the board already covers a meaningful baseline chess UX instead of stopping at “draw squares and pieces”.

### Built-in chessboard behavior

Mirasen Chessboard provides a complete modern interaction and visual baseline out of the box: selection, deselection, reselection, drag-to-move, release targeting, legal destinations, promotion, auto-promotion, and state-diff animation. Moves are resolved on release rather than committed immediately on press, giving users a more forgiving interaction flow. Because animation is driven by board-state transitions, pieces can move, appear, disappear, promote, or return smoothly without app-level glue code.

## Highlights

- Real built-in chess interaction
- Easy game/rules layer integration
- Works on desktop and mobile out of the box, with pointer-based mouse and touch interaction
- State-diff animation beyond simple move events
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

// User moves are disabled by default.
// Enable free movement when you want unconstrained UI moves.
board.setMovability({
	mode: 'free'
});
```

### Connect to a game/rules layer

`@mirasen/chessboard` handles board interaction and move intent. Your application can keep chess rules and game state in its own game/rules layer.

A typical integration uses a small adapter between your game move format and the board move format. The `game` object below represents your own chess rules layer, such as chess.js, a server-backed game model, or a custom engine.

```ts
import {
	createBoard,
	type MoveDestinationInput,
	type MoveOutput,
	type MoveRequestInput
} from '@mirasen/chessboard';

type GameMove = {
	from: string;
	to: string;
	capturedSquare?: string;
	secondary?: {
		from: string;
		to: string;
	};
	promotedTo?: 'queen' | 'rook' | 'bishop' | 'knight';
};

type GameDestination = {
	to: string;
	capturedSquare?: string;
	secondary?: {
		from: string;
		to: string;
	};
	promotedTo?: ('queen' | 'rook' | 'bishop' | 'knight')[];
};

const element = document.getElementById('board');

if (!element) {
	throw new Error('Missing board element');
}

const game = createYourGameEngine(); // Your app/game layer.
const board = createBoard({
	element
});

board.setPosition(game.getPosition());

function toBoardDestination(gameDestination: GameDestination): MoveDestinationInput {
	return {
		to: gameDestination.to,
		capturedSquare: gameDestination.capturedSquare,
		secondary: gameDestination.secondary, // e.g. castling.
		promotedTo: gameDestination.promotedTo
	};
}

function toBoardMoveRequest(gameMove: GameMove): MoveRequestInput {
	return {
		from: gameMove.from,
		to: gameMove.to,
		capturedSquare: gameMove.capturedSquare,
		secondary: gameMove.secondary,
		promotedTo: gameMove.promotedTo
	};
}

function toGameMove(move: MoveOutput): GameMove {
	return {
		from: move.from,
		to: move.to,
		capturedSquare: move.capturedSquare,
		secondary: move.secondary,
		promotedTo: move.promotedTo
	};
}

board.setMovability({
	mode: 'strict',
	destinations: (source): MoveDestinationInput[] | undefined => {
		const gameDestinations = game.getDestinationsFor(source);

		return gameDestinations.length > 0 ? gameDestinations.map(toBoardDestination) : undefined;
	}
});

board.extensions.events.setOnUIMove((move) => {
	// The board accepted and applied this UI move.
	// Keep your game/rules layer in sync.
	game.move(toGameMove(move));
});

function applyExternalMove(gameMove: GameMove) {
	// Apply moves that come from outside the board UI:
	// server, engine, opponent, imported game, replay, etc.
	game.move(gameMove);

	// Then animate/apply the same move on the board.
	board.move(toBoardMoveRequest(gameMove));
}
```

`MoveDestinationInput` can describe more than a target square. For example, `secondary` can represent paired piece movement (e.g. castling), `capturedSquare` can represent captures away from the destination square (e.g. en passant), and `promotedTo` can represent promotion choices.

This lets your game/rules layer own chess legality and game state while the board owns interaction, selection, targeting, visual feedback, promotion UI, animation, and its own displayed position.

### Promotion and auto-promotion

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

### Movability modes

Movability controls how the board accepts user-initiated moves.

- `disabled` — user moves are ignored
- `free` — user moves are accepted without legal destination filtering
- `strict` — user moves are accepted only when the target is allowed by the destinations provided by your app/rules layer

### Advanced: explicit extension lists

Most users can rely on the default first-party extension baseline. Use an explicit extension list only when you want to control which built-in or custom extensions are installed.

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
