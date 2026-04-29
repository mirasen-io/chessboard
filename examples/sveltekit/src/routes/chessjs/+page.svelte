<script lang="ts">
	import { createBoard } from '@mirasen/chessboard';
	import {
		toBoardMove,
		toBoardMoveDestinations,
		toGameMove
	} from '@mirasen/chessboard/adapters/chessjs';
	import { Chess } from 'chess.js';
	import { onDestroy, onMount } from 'svelte';

	let boardEl: HTMLDivElement;
	let board: ReturnType<typeof createBoard> | null = null;
	const playerColor = 'w';
	const computerTimeoutDuration = 3000; // milliseconds
	let chess = new Chess();
	let status = $state('Your move');
	let computerTimeout: ReturnType<typeof setTimeout> | null = null;
	let gameVersion = 0;

	function getStatus(): string {
		if (chess.isCheckmate()) return 'Checkmate';
		if (chess.isDraw()) return 'Draw';
		if (chess.isGameOver()) return 'Game over';
		if (chess.isCheck()) return 'Check';
		return chess.turn() === 'w' ? 'Your move' : 'Computer thinking…';
	}

	function makeComputerMove() {
		if (!board) return;
		const moves = chess.moves({ verbose: true });
		if (moves.length === 0) return;

		const randomMove = moves[Math.floor(Math.random() * moves.length)]!;
		const appliedMove = chess.move(randomMove);
		board.move(toBoardMove(appliedMove));
		status = getStatus();
	}

	function resetGame() {
		gameVersion++;
		if (computerTimeout !== null) {
			clearTimeout(computerTimeout);
			computerTimeout = null;
		}
		chess = new Chess();
		if (board) {
			board.setPosition(chess.fen());
		}
		status = 'Your move';
	}

	onMount(() => {
		board = createBoard({
			element: boardEl
		});

		board.setPosition(chess.fen());
		board.setMovability({
			mode: 'strict',
			destinations: (source) => {
				if (chess.turn() !== playerColor) {
					return undefined;
				}
				const moves = chess.moves({ square: source, verbose: true });
				const destinations = toBoardMoveDestinations(moves);
				return destinations.length > 0 ? destinations : undefined;
			}
		});

		board.extensions.events.setOnUIMove((move) => {
			chess.move(toGameMove(move));
			status = getStatus();

			if (!chess.isGameOver()) {
				const scheduledVersion = gameVersion;
				computerTimeout = setTimeout(() => {
					if (scheduledVersion !== gameVersion || !board) return;
					makeComputerMove();
					computerTimeout = null;
				}, computerTimeoutDuration);
			}
		});
	});

	onDestroy(() => {
		gameVersion++;
		if (computerTimeout !== null) {
			clearTimeout(computerTimeout);
			computerTimeout = null;
		}
		board?.destroy();
		board = null;
	});
</script>

<svelte:head>
	<title>Chess.js Adapter Example</title>
</svelte:head>

<div class="page">
	<div class="panel">
		<h1>Chess.js Adapter Example</h1>
		<p class="subtitle">Play against a random-move computer · chess.js + adapter</p>

		<div class="controls">
			<button onclick={resetGame}>Reset game</button>
		</div>

		<p class="status">{status}</p>

		<div class="board-wrap">
			<div bind:this={boardEl} class="board"></div>
		</div>
	</div>
</div>

<style>
	:global(body) {
		margin: 0;
		font-family:
			Inter,
			ui-sans-serif,
			system-ui,
			-apple-system,
			BlinkMacSystemFont,
			'Segoe UI',
			sans-serif;
		background: #f5f5f5;
		color: #111827;
	}

	.page {
		display: grid;
		grid-template-columns: minmax(360px, 720px) minmax(320px, 1fr);
		gap: 24px;
		padding: 24px;
		align-items: start;
	}

	.panel {
		background: white;
		border-radius: 16px;
		padding: 20px;
		box-shadow: 0 6px 24px rgba(0, 0, 0, 0.08);
	}

	h1,
	.subtitle {
		margin: 0 0 16px;
		color: #4b5563;
	}

	.status {
		margin: 0 0 16px;
		font-weight: 600;
		font-size: 1.1rem;
	}

	.controls {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
		margin-bottom: 20px;
	}

	button {
		border: 0;
		border-radius: 10px;
		padding: 10px 14px;
		font: inherit;
		cursor: pointer;
		background: #111827;
		color: white;
	}

	button:hover {
		opacity: 0.92;
	}

	.board-wrap {
		width: min(80vw, 640px);
	}

	.board {
		width: 100%;
		aspect-ratio: 1 / 1;
		background: #e5e7eb;
		overflow: hidden;
		touch-action: pinch-zoom;
		user-select: none;
	}

	@media (max-width: 1100px) {
		.page {
			grid-template-columns: 1fr;
		}

		.board-wrap {
			width: min(92vw, 640px);
		}
	}
</style>
