<script lang="ts">
	import { createBoard, type Chessboard, type ChessboardExtensionInput } from '@mirasen/chessboard';
	import { onDestroy, onMount } from 'svelte';
	import { randomMove } from '$lib/board-utils';

	let boardEl: HTMLDivElement;
	const extensionList = [
		'renderer',
		'lastMove',
		'autoPromote',
		'promotion'
	] as const satisfies ChessboardExtensionInput[];
	let board: Chessboard<typeof extensionList> | null = null;

	function setWhite() {
		board?.setOrientation('white');
	}

	function setBlack() {
		board?.setOrientation('black');
	}

	function resetPosition() {
		board?.setPosition('start');
	}

	function clearSelection() {
		board?.select(null);
	}

	function doRandomMove() {
		if (!board) return;
		randomMove(board);
	}

	onMount(() => {
		board = createBoard({
			element: boardEl,
			extensions: extensionList
		});
		board.setMovability({ mode: 'free' });
	});

	onDestroy(() => {
		board?.destroy();
		board = null;
	});
</script>

<svelte:head>
	<title>Custom Extension List</title>
</svelte:head>

<div class="page">
	<div class="panel">
		<h1>Custom Extension List</h1>
		<p class="subtitle">Extensions: renderer, lastMove, autoPromote, promotion</p>

		<div class="controls">
			<button onclick={setWhite}>Orientation: white</button>
			<button onclick={setBlack}>Orientation: black</button>
			<button onclick={resetPosition}>Reset position</button>
			<button onclick={clearSelection}>Clear selection</button>
			<button onclick={doRandomMove}>Random move</button>
		</div>

		<div class="board-wrap">
			<div bind:this={boardEl} class="board"></div>
		</div>
	</div>
</div>
