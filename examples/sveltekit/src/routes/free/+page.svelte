<script lang="ts">
	import { createBoard } from '@mirasen/chessboard';
	import { onDestroy, onMount } from 'svelte';

	let boardEl: HTMLDivElement;
	let board: ReturnType<typeof createBoard> | null = null;

	// 1 - minimal example of chessboard runtime usage

	function setWhite() {
		if (!board) return;
		board.setOrientation('white');
	}

	function setBlack() {
		if (!board) return;
		board.setOrientation('black');
	}

	function resetPosition() {
		if (!board) return;
		board.setPosition('start');
	}

	function clearSelection() {
		if (!board) return;
		board.select(null);
	}

	function fileOf(square: number) {
		return 'abcdefgh'[square % 8];
	}

	function rankOf(square: number) {
		return Math.floor(square / 8) + 1;
	}

	function algebraic(square: number): string {
		return `${fileOf(square)}${rankOf(square)}`;
	}

	function randomMove() {
		if (!board) return;
		const snapshot = board.getSnapshot();
		// find random piece on random square
		let pieceCode = 0;
		let fromSquare = '';
		while (pieceCode <= 0) {
			const square = Math.floor(Math.random() * 64);
			pieceCode = snapshot.state.board.pieces[square];
			fromSquare = algebraic(square);
		}
		let toSquare = fromSquare;
		while (toSquare === fromSquare) {
			toSquare = algebraic(Math.floor(Math.random() * 64));
		}
		board.move({
			from: fromSquare,
			to: toSquare
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} as any);
	}

	onMount(() => {
		board = createBoard({
			element: boardEl
		});
		board.setMovability({
			mode: 'free'
		});
	});

	onDestroy(() => {
		board?.destroy();
		board = null;
	});
</script>

<svelte:head>
	<title>Chessboard Runtime Manual</title>
</svelte:head>

<div class="page">
	<div class="panel">
		<h1>Chessboard Runtime Manual</h1>
		<p class="subtitle">Internal runtime smoke page · movable free · both colors</p>

		<div class="controls">
			<button onclick={setWhite}>Orientation: white</button>
			<button onclick={setBlack}>Orientation: black</button>
			<button onclick={resetPosition}>Reset position</button>
			<button onclick={clearSelection}>Clear selection</button>
			<button onclick={randomMove}>Random move</button>
		</div>

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
