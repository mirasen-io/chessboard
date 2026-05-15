<script lang="ts">
	import { useBoard } from '$lib/use-board.svelte';
	import { randomMove } from '$lib/board-utils';

	let boardEl: HTMLDivElement;
	let snapshotText = $state('');

	function refreshSnapshot() {
		if (!board) return;
		snapshotText = JSON.stringify(board.getSnapshot(), null, 2);
	}

	const { current: board } = useBoard(
		() => boardEl,
		(b) => {
			b.setMovability({ mode: 'free' });
			b.extensions.events.setOnUIMove((move) => {
				console.log('Move played:', move);
			});
			b.extensions.events.setOnRawUpdate((context) => {
				console.log('Raw update:', context);
			});
			refreshSnapshot();

			const intervalId = window.setInterval(refreshSnapshot, 100);
			return () => window.clearInterval(intervalId);
		}
	);

	function setWhite() {
		board?.setOrientation('white');
		refreshSnapshot();
	}

	function setBlack() {
		board?.setOrientation('black');
		refreshSnapshot();
	}

	function resetPosition() {
		board?.setPosition('start');
		refreshSnapshot();
	}

	function clearSelection() {
		board?.select(null);
		refreshSnapshot();
	}

	function doRandomMove() {
		if (!board) return;
		randomMove(board);
		refreshSnapshot();
	}
</script>

<svelte:head>
	<title>setOnUIMove</title>
</svelte:head>

<div class="page">
	<div class="panel">
		<h1>setOnUIMove</h1>
		<p class="subtitle">Event handler registration · movable free · both colors</p>

		<div class="controls">
			<button onclick={setWhite}>Orientation: white</button>
			<button onclick={setBlack}>Orientation: black</button>
			<button onclick={resetPosition}>Reset position</button>
			<button onclick={clearSelection}>Clear selection</button>
			<button onclick={refreshSnapshot}>Refresh snapshot</button>
			<button onclick={doRandomMove}>Random move</button>
		</div>

		<div class="board-wrap">
			<div bind:this={boardEl} class="board"></div>
		</div>
	</div>

	<div class="panel">
		<h2>Interaction snapshot</h2>
		<pre class="snapshot">{snapshotText}</pre>
	</div>
</div>
