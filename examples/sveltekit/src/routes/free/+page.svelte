<script lang="ts">
	import { useBoard } from '$lib/use-board.svelte';
	import { randomMove } from '$lib/board-utils';

	let boardEl: HTMLDivElement;
	let orientation: 'white' | 'black' = $state('white');

	const { current: board } = useBoard(
		() => boardEl,
		(b) => {
			b.setMovability({ mode: 'free' });
		}
	);

	function toggleOrientation() {
		if (!board) return;
		orientation = orientation === 'white' ? 'black' : 'white';
		board.setOrientation(orientation);
	}

	function resetPosition() {
		if (!board) return;
		board.setPosition('start');
	}

	function clearSelection() {
		if (!board) return;
		board.select(null);
	}

	function doRandomMove() {
		if (!board) return;
		randomMove(board);
	}
</script>

<svelte:head>
	<title>Free Mode</title>
</svelte:head>

<div class="page">
	<div class="panel">
		<h1>Free Mode</h1>
		<p class="subtitle">Minimal chessboard · movable free · both colors</p>

		<div class="controls">
			<button onclick={toggleOrientation}>Orientation: {orientation}</button>
			<button onclick={resetPosition}>Reset position</button>
			<button onclick={clearSelection}>Clear selection</button>
			<button onclick={doRandomMove}>Random move</button>
		</div>

		<div class="board-wrap">
			<div bind:this={boardEl} class="board"></div>
		</div>
	</div>
</div>
