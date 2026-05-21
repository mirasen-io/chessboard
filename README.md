[![NPM Version](https://img.shields.io/npm/v/%40mirasen%2Fchessboard)](https://www.npmjs.com/package/@mirasen/chessboard)
[![CI](https://github.com/mirasen-io/chessboard/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/mirasen-io/chessboard/actions/workflows/ci.yml)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=mirasen-io_chessboard&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=mirasen-io_chessboard)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=mirasen-io_chessboard&metric=coverage)](https://sonarcloud.io/summary/new_code?id=mirasen-io_chessboard)
[![License](https://img.shields.io/npm/l/@mirasen/chessboard)](./LICENSE)

# @mirasen/chessboard

A framework-agnostic TypeScript chessboard platform with real chess interaction built in and an extension-driven architecture.

## Try it live (including annotations)

- [Play a chess.js game](https://mirasen.io/chessboard/examples/chessjs.html)
- [Watch 12 live boards](https://mirasen.io/chessboard/examples/live-games-grid.html)
- [Try the promotion flow](https://mirasen.io/chessboard/examples/promotion.html)
- [Try the minimal example](https://mirasen.io/chessboard/examples/minimal.html)

## Using React?

Use [`@mirasen/react-chessboard`](https://www.npmjs.com/package/@mirasen/react-chessboard) for a React component with the same built-in interaction, annotations, promotion, animation, and chess.js integration.

## Native mobile apps

`@mirasen/chessboard` is not tied to React or any other web framework. It is plain TypeScript/JavaScript on top of DOM and SVG, so it should fit WebView-based native iOS or Android integrations.

A common integration pattern is to bundle a WebView host page, mount the board there, and communicate with the native app through the platform bridge.

This keeps the integration model lightweight while avoiding a separate native chessboard UI implementation.

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

The default first-party extension baseline includes rendering, events, selection, active target feedback, legal move hints, last move feedback, annotations, promotion UI, and optional auto-promotion.

- `renderer` — the first-party rendering extension that validates the same extension architecture used for board features
- `events`
- `selectedSquare`
- `activeTarget`
- `legalMoves`
- `lastMove`
- `annotations`
- `promotion`
- `autoPromote`

The package also includes `chess.js` adapter helpers for connecting legal destinations, UI moves, external moves, promotion, castling, and en passant without writing special-move glue code by hand.

That means the board already covers a meaningful baseline chess UX instead of stopping at “draw squares and pieces”: users can move pieces, see legal targets, promote naturally, animate state changes, and draw circles and arrows without rebuilding common board behavior in app code.

### Built-in chessboard behavior

Mirasen Chessboard provides a complete modern interaction and visual baseline out of the box: selection, deselection, reselection, drag-to-move, release targeting, legal destinations, circles and arrows, promotion, auto-promotion, and state-diff animation.

Moves are resolved on release rather than committed immediately on press, giving users a more forgiving interaction flow. Because animation is driven by board-state transitions, pieces can move, appear, disappear, promote, castle, or return smoothly without app-level rendering glue code.

Rules and legality still belong to your game layer. Use the built-in `chess.js` adapter when you want a ready-made bridge from `chess.js` legal moves and move results into the board.

## Highlights

- Real built-in chess interaction
- Built-in circles and arrows with live add/remove previews
- **Easy game/rules integration** — connect your own game model, or use the built-in `chess.js` adapter
- Works on desktop and mobile out of the box, with pointer-based mouse/touch interaction and tunable drag behavior
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

### Connect to chess.js

`@mirasen/chessboard` owns board interaction, rendering, annotations, promotion UI, and animation.  
Your game/rules layer owns legality and game state.

For `chess.js`, use the built-in adapter:

```bash
npm install chess.js
```

```ts
import { createBoard } from '@mirasen/chessboard';
import {
	toBoardMove,
	toBoardMoveDestinations,
	toGameMove
} from '@mirasen/chessboard/adapters/chessjs';
import { Chess } from 'chess.js';

const element = document.getElementById('board');

if (!element) {
	throw new Error('Missing board element');
}

const chess = new Chess();
const board = createBoard({
	element
});

// Let the user play white in this example.
const playerColor = 'w';

board.setPosition(chess.fen());

board.setMovability({
	mode: 'strict',
	destinations: (source) => {
		// During the computer's turn, do not allow user moves.
		if (chess.turn() !== playerColor) {
			return undefined;
		}

		const moves = chess.moves({ square: source, verbose: true });
		const destinations = toBoardMoveDestinations(moves);

		return destinations.length > 0 ? destinations : undefined;
	}
});

board.extensions.events.setOnUIMove((move) => {
	// The board has already accepted and applied this UI move.
	// Keep chess.js in sync.
	chess.move(toGameMove(move));

	if (!chess.isGameOver()) {
		makeRandomComputerMove();
	}
});

function makeRandomComputerMove() {
	const moves = chess.moves({ verbose: true });
	const randomMove = moves[Math.floor(Math.random() * moves.length)];

	if (!randomMove) {
		return;
	}

	// Apply the move to chess.js first.
	const appliedMove = chess.move(randomMove);

	// Then apply and animate the same move on the board.
	board.move(toBoardMove(appliedMove));
}

function resetGame() {
	chess.reset();
	board.setPosition(chess.fen());
}
```

The adapter exposes three small conversion helpers:

- `toGameMove` converts a board UI move into a move accepted by `chess.move(...)`.
- `toBoardMove` converts a `chess.js` move result into a board move request for external or computer moves.
- `toBoardMoveDestinations` converts verbose legal `chess.js` moves into strict board destinations.

This keeps the boundary explicit:

- `chess.js` decides which moves are legal.
- The board handles interaction, legal targets, annotations, promotion UI, castling/en-passant board updates, and animation.
- User moves flow from the board into `chess.js`.
- External moves flow from `chess.js` back into the board.

`toBoardMoveDestinations` preserves special move information such as promotion choices, en passant capture squares, and castling secondary rook movement, so those flows work through the normal board pipeline.

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

### Annotations

The default extension baseline includes built-in board annotations.

Users can draw circles and arrows directly on the board. Desktop users can right-click to annotate by default, while touch or mobile-style UIs can switch annotation drawing to the primary pointer button with `drawButton`.

Annotation gestures show live previews before commit. Repeating the same-color circle or arrow removes it, with a low-opacity remove preview so users can see that release will delete the existing annotation.

Color selection can come from keyboard modifiers, or be forced through `drawModifier` for on-screen controls.

### Movability modes

Movability controls how the board accepts user-initiated moves.

- `disabled` — user moves are ignored
- `free` — user moves are accepted without legal destination filtering
- `strict` — user moves are accepted only when the target is allowed by the destinations provided by your app/rules layer

### Desktop and mobile drag tuning

The board exposes interaction-level and renderer-level drag configuration so you can tune mouse-first and touch-first surfaces without replacing the built-in interaction model.

Interaction config controls when lifted-piece drag becomes active:

```ts
const board = createBoard({
	element
});

board.setInteractionConfig({
	drag: {
		liftedActivation: {
			thresholdPx: 5
		}
	}
});
```

Use `thresholdPx: 0` for immediate desktop-style drag activation, or a small threshold for mobile/touch UIs where the piece should not jump on the first tiny pointer movement.

The first-party renderer controls how the lifted piece looks while dragging:

```ts
board.extensions.renderer.setConfig({
	drag: {
		pieceScale: 1.5,
		pieceAnchor: 'bottom',
		pieceAnchorOffsetY: 0.14
	}
});
```

You can reuse the calibrated mobile renderer preset:

```ts
import { DefaultMainRendererMobileConfig } from '@mirasen/chessboard/extensions';

board.extensions.renderer.setConfig({
	drag: DefaultMainRendererMobileConfig.drag
});
```

### Animation tuning

The first-party renderer exposes animation duration config:

```ts
board.extensions.renderer.setConfig({
	animation: {
		durationMs: 0
	}
});
```

Set `animation.durationMs` to `0` when you want position updates to render instantly without creating movement animations.

### Advanced: explicit extension lists

Most users can rely on the default first-party extension baseline. Use an explicit extension list only when you want to control which built-in or custom extensions are installed.

```ts
import { createBoard, type Chessboard, type ChessboardExtensionInput } from '@mirasen/chessboard';
import { builtInExtensionFactoryMap } from '@mirasen/chessboard/extensions';

const pieceUrls = {
	wK: '/pieces/wK.svg',
	wQ: '/pieces/wQ.svg',
	wR: '/pieces/wR.svg',
	wB: '/pieces/wB.svg',
	wN: '/pieces/wN.svg',
	wP: '/pieces/wP.svg',
	bK: '/pieces/bK.svg',
	bQ: '/pieces/bQ.svg',
	bR: '/pieces/bR.svg',
	bB: '/pieces/bB.svg',
	bN: '/pieces/bN.svg',
	bP: '/pieces/bP.svg'
};

const extensionList = [
	// Always add renderer first, otherwise nothing will be rendered.
	{
		builtin: 'renderer',
		options: {
			pieceUrls,
			colors: {
				board: {
					light: '#d7dde5',
					dark: '#707a8a'
				}
			}
		}
	},
	'lastMove',
	'annotations',
	// Keep autoPromote before promotion, otherwise promotion may defer the move first.
	'autoPromote',
	builtInExtensionFactoryMap.promotion({
		pieceUrls
	})
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

Configured built-in extensions can be provided either as declarative `{ builtin, options }` objects or through the built-in extension factory map. If you use custom piece assets, pass the same `pieceUrls` map to renderer and promotion when you want the board and promotion UI to use the same piece set.

### Default visual identity and attribution

The default first-party extension baseline includes a subtle Mirasen board watermark.

If you want full control over the visual baseline, use an explicit extension list and omit the `watermark` extension.

Attribution is not required by the MIT license, but it is appreciated. If Mirasen Chessboard helps your project, please consider keeping the default watermark or linking to `@mirasen/chessboard`.

## Documentation

See [Documentation](./documentation.md) for the documentation hub.

## Versioning and breaking changes

`@mirasen/chessboard` follows semantic versioning for public API changes.

Breaking public API changes are released as major versions.

We do not add backward-compatibility aliases or runtime compatibility bridges by default. When a public contract changes, the new API is kept explicit and clean, and the required migration is documented in the release notes / changelog.

Migration notes for breaking changes are included directly in the corresponding changelog entry, so users can see:

- what changed
- why it changed
- what old usage looked like
- what new usage should look like

See the [CHANGELOG](./CHANGELOG.md) for release history and migration notes.

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

### Opt out, don’t build up, focus on your app

`@mirasen/chessboard` aims for a middle path:

- strong built-in baseline interaction
- clean internal architecture
- extension-driven feature growth

Common chessboard behavior is included by default: rendering, interaction, selection, legal target feedback, annotations, promotion, and animation. You start from a working interaction baseline, remove or replace extensions only when you need something different, and keep your own code focused on your application domain.

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
