[![NPM Version](https://img.shields.io/npm/v/%40mirasen%2Freact-chessboard)](https://www.npmjs.com/package/@mirasen/react-chessboard)
[![CI](https://github.com/mirasen-io/react-chessboard/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/mirasen-io/react-chessboard/actions/workflows/ci.yml)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=mirasen-io_react-chessboard&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=mirasen-io_react-chessboard)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=mirasen-io_react-chessboard&metric=coverage)](https://sonarcloud.io/summary/new_code?id=mirasen-io_react-chessboard)
[![License](https://img.shields.io/npm/l/@mirasen/react-chessboard)](./LICENSE)

# @mirasen/react-chessboard

A React chessboard component with built-in interaction, promotion, animation, and chess.js integration.

Start with a working chessboard, not a board primitive.

## Try it live

These examples use the same mirasen chessboard runtime that powers the React component.

- [Play a chess.js game](https://mirasen.k-tarmyshov.workers.dev/chessboard/examples/chessjs)
- [Watch 12 live boards](https://mirasen.k-tarmyshov.workers.dev/chessboard/examples/live-games-grid)
- [Try the promotion flow](https://mirasen.k-tarmyshov.workers.dev/chessboard/examples/promotion)
- [Try the minimal example](https://mirasen.k-tarmyshov.workers.dev/chessboard/examples/minimal)

## Why this exists

Most React chessboard components give you a board primitive and leave the real chess UX to your app:

- click and drag behavior
- legal target feedback
- promotion flow
- special move glue
- animation
- synchronization with a rules engine

`@mirasen/react-chessboard` wraps `@mirasen/chessboard` in a small React component so React apps can start from a working chessboard instead.

React owns lifecycle and props. mirasen owns board rendering, input, interaction, animation, promotion, and extension behavior.

## Real-world migration feedback

After initially using `react-chessboard` and implementing click-to-move and move highlighting in application code, [TheUnemployedHobo](https://github.com/TheUnemployedHobo) explained why he migrated to mirasen:

> "But the code ended up getting so messy that I didn't even want to look at it anymore. It was painful to read. That's when I decided I needed a library that handled those things properly out of the box, and that's how I ended up switching to yours."

— Author of [multiplayer-chess](https://github.com/TheUnemployedHobo/multiplayer-chess) · [Full discussion](https://github.com/TheUnemployedHobo/multiplayer-chess/issues/1#issuecomment-5356049391)

## Installation

```bash
npm install @mirasen/react-chessboard
```

For chess.js integration:

```bash
npm install @mirasen/react-chessboard chess.js
```

React and React DOM are peer dependencies. The package supports React 18 and newer.

## Usage

### Minimal React component

```tsx
import { Chessboard } from '@mirasen/react-chessboard';

export function App() {
	return (
		<div style={{ width: 420, height: 420 }}>
			<Chessboard position={{ id: 'game-1', position: 'start' }} />
		</div>
	);
}
```

The outer container needs a visible size. The board fills that container.

User moves are disabled unless you provide `movability`. For a playable chess game, connect the component to a game/rules layer such as `chess.js`.

### Connect to chess.js

`@mirasen/react-chessboard` owns board interaction and UI move output.  
`chess.js` owns legality and game state.

The package re-exports the mirasen chess.js adapter helpers:

```tsx
import {
	Chessboard,
	type BoardOrientation,
	type MoveOutput,
	type MovabilityInput
} from '@mirasen/react-chessboard';
import { toBoardMoveDestinations, toGameMove } from '@mirasen/react-chessboard/adapters/chessjs';
import { Chess } from 'chess.js';
import { useCallback, useMemo, useRef, useState } from 'react';

type PositionRequest = {
	id: number;
	position: string;
};

export function App() {
	const chessRef = useRef(new Chess());

	const [position, setPosition] = useState<PositionRequest>({
		id: 0,
		position: chessRef.current.fen()
	});
	const [orientation, setOrientation] = useState<BoardOrientation>('white');
	const [autoPromoteToQueen, setAutoPromoteToQueen] = useState(false);
	const [lastMove, setLastMove] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	const syncPosition = useCallback(() => {
		setPosition((current) => ({
			id: current.id + 1,
			position: chessRef.current.fen()
		}));
	}, []);

	const movability = useMemo<MovabilityInput>(
		() => ({
			mode: 'strict',
			destinations: (source) => {
				const moves = chessRef.current.moves({
					square: source,
					verbose: true
				});
				const destinations = toBoardMoveDestinations(moves);

				return destinations.length > 0 ? destinations : undefined;
			}
		}),
		[position.position]
	);

	const onUIMove = useCallback(
		(move: MoveOutput) => {
			try {
				chessRef.current.move(toGameMove(move));
				setLastMove(`${move.from}-${move.to}`);
				setError(null);
				syncPosition();
			} catch (cause) {
				setError(cause instanceof Error ? cause.message : 'Illegal move');
				syncPosition();
			}
		},
		[syncPosition]
	);

	function resetGame() {
		chessRef.current.reset();
		setLastMove(null);
		setError(null);
		syncPosition();
	}

	function flipBoard() {
		setOrientation((current) => (current === 'white' ? 'black' : 'white'));
	}

	return (
		<main>
			<div style={{ width: 420, height: 420 }}>
				<Chessboard
					position={position}
					orientation={orientation}
					movability={movability}
					onUIMove={onUIMove}
					autoPromoteToQueen={autoPromoteToQueen}
				/>
			</div>

			<button type="button" onClick={resetGame}>
				Reset
			</button>
			<button type="button" onClick={flipBoard}>
				Flip board
			</button>
			<label>
				<input
					type="checkbox"
					checked={autoPromoteToQueen}
					onChange={(event) => setAutoPromoteToQueen(event.currentTarget.checked)}
				/>
				Auto-promote to queen
			</label>

			<p>FEN: {position.position}</p>
			<p>Last move: {lastMove ?? 'none'}</p>
			{error ? <p role="alert">{error}</p> : null}
		</main>
	);
}
```

For a complete local smoke example, see [`examples/app`](./examples/app).

## Request-based props

The component intentionally uses request objects for board-changing commands.

```tsx
<Chessboard position={{ id: gameId, position: fen }} />
```

`position` is not a controlled prop that reapplies on every render. It is an id-based set-position request:

- same `position.id` → ignored
- new `position.id` → `board.setPosition(...)` is applied once

This makes React rerenders safe and prevents repeated prop/effect synchronization from resetting board state or clearing visual feedback.

### External moves

Use `externalMove` for computer, remote, replay, or engine moves that should be applied to the board as moves rather than full-position resets.

```tsx
import { toBoardMove } from '@mirasen/react-chessboard/adapters/chessjs';

const appliedMove = chess.move(randomMove);

setExternalMove((current) => ({
	id: (current?.id ?? 0) + 1,
	move: toBoardMove(appliedMove)
}));

<Chessboard position={{ id: gameId, position: chess.fen() }} externalMove={externalMove} />;
```

`externalMove` is also id-based:

- same `externalMove.id` → ignored
- new `externalMove.id` → `board.move(...)` is applied once

This prevents duplicate React renders from replaying the same move.

## Props

```ts
import type { CSSProperties } from 'react';
import type {
	BoardOrientation,
	MoveOutput,
	MoveRequestInput,
	MovabilityInput,
	PositionInput,
	SquareString
} from '@mirasen/react-chessboard';

type PositionRequest = {
	id: string | number;
	position: PositionInput;
};

type ExternalMoveRequest = {
	id: string | number;
	move: MoveRequestInput;
};

type ChessboardProps = {
	position: PositionRequest;
	externalMove?: ExternalMoveRequest;
	orientation?: BoardOrientation;
	movability?: MovabilityInput;
	onUIMove?: (move: MoveOutput) => void;
	autoPromoteToQueen?: boolean;
	checkSquare?: SquareString | null;
	className?: string;
	style?: CSSProperties;
};
```

### `position`

Id-based set-position request. Use a new `id` when you want the board to apply a new position.

### `externalMove`

Id-based move request for moves coming from outside the user interaction flow.

### `orientation`

Board orientation. Accepts the same color input as `@mirasen/chessboard`, such as `'white'` or `'black'`.

### `movability`

Controls user-initiated moves. Use strict movability with legal destinations when integrating with a rules engine.

### `onUIMove`

Called when the user completes a board move. Use this to update your game/rules layer.

### `autoPromoteToQueen`

When `true`, promotion automatically selects a queen. When omitted or `false`, the normal built-in promotion flow is used.

### `checkSquare`

Type: `SquareString | ColorInput | null`

Highlights the king's square when in check with a red radial glow. Pass `null` or omit to remove the highlight. The chessboard does not detect check itself — your rules layer (e.g. `chess.js`) is responsible for determining when to apply it.

Two forms are accepted:

**Color shorthand** — pass the side to move (`'w'`/`'b'` or `'white'`/`'black'`); the extension auto-locates the king on the board. Recommended when integrating with a rules engine like chess.js:

```tsx
<Chessboard
  checkSquare={chess.isCheck() ? chess.turn() : null}
  ...
/>
```

**Explicit square** — pass the king's square string directly if you already know it:

```tsx
<Chessboard checkSquare={chess.isCheck() ? 'e1' : null} ... />
```

### `className` and `style`

Applied to the outer container only. They are for layout, not board theming.

## chess.js adapter helpers

The React package re-exports the core chess.js adapter helpers:

```ts
import {
	toBoardMove,
	toBoardMoveDestinations,
	toGameMove,
	type ChessJsMoveInput
} from '@mirasen/react-chessboard/adapters/chessjs';
```

- `toGameMove` converts a board UI move into a move accepted by `chess.move(...)`.
- `toBoardMove` converts a `chess.js` move result into a board move request.
- `toBoardMoveDestinations` converts verbose legal `chess.js` moves into strict board destinations.

This keeps the integration boundary explicit:

- `chess.js` decides which moves are legal.
- The React component displays and collects user moves.
- mirasen handles board interaction, target feedback, promotion UI, special-move board updates, and animation.

## Board handle (ref)

`Chessboard` forwards a `ChessboardHandle` via `ref`. The handle is the full public surface of the underlying `@mirasen/chessboard` board instance — all extensions, all runtime methods, typed directly from the core package.

```tsx
import { Chessboard, type ChessboardHandle } from '@mirasen/react-chessboard';
import { useEffect, useRef } from 'react';

const boardRef = useRef<ChessboardHandle>(null);

// once on mount — draw a circle via the annotations extension
useEffect(() => {
  boardRef.current?.extensions.annotations.circle('e4', { color: 'green' });
}, []);

<Chessboard ref={boardRef} position={...} />
```

The ref gives access to everything the core board exposes: `extensions.*`, `move(...)`, `setPosition(...)`, `setOrientation(...)`, `select(...)`, `getSnapshot()`, and more. When the core package adds a new extension, it is immediately accessible via `ref.current.extensions.<id>` — no wrapper update needed.

**When to use ref vs props**

Convenience props (`autoPromoteToQueen`, `checkSquare`, `onUIMove`) cover the most common declarative settings. Use the ref when:

- you need an extension that has no convenience prop (e.g. `annotations`, `renderer` config)
- you need to call an imperative method (`annotations.arrow(...)`, `select(...)`)
- you want to read board state (`getSnapshot()`, `extensions.annotations.getCircles()`)

**One channel per setting.** If a convenience prop already covers a setting, do not also write to the same extension property via ref in the same component — they write to the same underlying state and the last write wins.

## What you get out of the box

The underlying mirasen board provides the default first-party chessboard baseline:

- SVG rendering
- pointer-based click and drag interaction
- selected-square feedback
- active-target feedback
- legal move hints
- last-move feedback
- check square highlight
- promotion UI
- optional auto-promotion
- animation for board-state changes
- mobile-friendly pointer behavior

## Styling and customization

The React component intentionally exposes a small high-level API and uses the default mirasen board appearance.

It does not expose color, square, piece, renderer, or extension customization props in v1.

This is deliberate: the React package is the simple path for users who want a working chessboard quickly.

For custom visuals, custom extensions, custom piece sets, or low-level runtime control, use `@mirasen/chessboard` directly from React.

## Advanced: use the core package directly from React

Power users can use the framework-agnostic core package directly:

```tsx
import { createBoard, type Chessboard as CoreChessboard } from '@mirasen/chessboard';
import { useEffect, useRef } from 'react';

export function CustomBoard() {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const boardRef = useRef<CoreChessboard | null>(null);

	useEffect(() => {
		const element = containerRef.current;

		if (!element) {
			return;
		}

		const board = createBoard({
			element
			// extensions/config/custom visuals
		});

		boardRef.current = board;

		return () => {
			board.destroy();
			boardRef.current = null;
		};
	}, []);

	return <div ref={containerRef} style={{ width: 420, height: 420 }} />;
}
```

Use this route when you need lower-level runtime access than the React component intentionally provides.

## Local example app

```bash
cd examples/app
npm install
npm run dev
```

Production build:

```bash
cd examples/app
npm run build
```

## Relationship to @mirasen/chessboard

`@mirasen/react-chessboard` is a thin wrapper over `@mirasen/chessboard`.

Use this package when you want a React component with a small high-level API.

Use `@mirasen/chessboard` directly when you want the full framework-agnostic runtime and extension system.

## Artwork

The default board appearance uses the same Chessnut piece set as `@mirasen/chessboard`.

- Author: Alexis Luengas — https://github.com/LexLuengas
- Source: https://github.com/LexLuengas/chessnut-pieces
- License: Apache License 2.0 — https://github.com/LexLuengas/chessnut-pieces/blob/master/LICENSE.txt

For full attribution, see the core package artwork documentation in `@mirasen/chessboard`.
