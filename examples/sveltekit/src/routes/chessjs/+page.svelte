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
	const computerTimeoutDuration = 1000;
	let chess = new Chess();
	let status = $state('Your move');
	let computerTimeout: ReturnType<typeof setTimeout> | null = null;
	let gameVersion = 0;
	let orientation: 'white' | 'black' = $state('white');
	let drawButton = $state(2);

	function toggleOrientation() {
		if (!board) return;
		orientation = orientation === 'white' ? 'black' : 'white';
		board.setOrientation(orientation);
	}

	function toggleAnnotationsDrawButton() {
		if (!board) return;
		const currentValue = board.extensions.annotations.drawButton;
		drawButton = currentValue === 0 ? 2 : 0;
		board.extensions.annotations.drawButton = drawButton;
	}

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

		const move = moves[Math.floor(Math.random() * moves.length)]!;
		const appliedMove = chess.move(move);
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
		board = createBoard({ element: boardEl });

		board.setPosition(chess.fen());
		board.setMovability({
			mode: 'strict',
			destinations: (source) => {
				if (chess.turn() !== playerColor) return undefined;
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
	<title>Chess.js Adapter</title>
</svelte:head>

<div class="page">
	<div class="panel">
		<h1>Chess.js Adapter</h1>
		<p class="subtitle">Play against a random-move computer · chess.js + adapter</p>

		<div class="controls">
			<button onclick={toggleOrientation}>Orientation: {orientation}</button>
			<button onclick={resetGame}>Reset game</button>
			<button onclick={toggleAnnotationsDrawButton}>
				Annotation: {drawButton === 0 ? 'on' : 'off'}
			</button>
		</div>

		<p class="status">{status}</p>

		<div class="board-wrap">
			<div bind:this={boardEl} class="board"></div>
		</div>
	</div>
</div>

<style>
	.status {
		margin: 0 0 16px;
		font-weight: 600;
		font-size: 1.1rem;
	}
</style>
