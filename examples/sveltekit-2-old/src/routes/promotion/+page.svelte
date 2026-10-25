<script lang="ts">
	import { createBoard, type PiecePositionRecordString } from '@mirasen/chessboard';
	import { onDestroy, onMount } from 'svelte';

	let boardEl: HTMLDivElement;
	let board: ReturnType<typeof createBoard> | null = null;
	let snapshotText = $state('');
	let autoPromoteToQueen = $state(false);

	const START_POSITION: PiecePositionRecordString = {
		e2: 'wP',
		f7: 'wP',
		d7: 'bP',
		c2: 'bP'
	} as const;

	function refreshSnapshot() {
		if (!board) return;
		snapshotText = JSON.stringify(board.getSnapshot(), null, 2);
	}

	function setWhite() {
		board?.setOrientation('white');
		refreshSnapshot();
	}

	function setBlack() {
		board?.setOrientation('black');
		refreshSnapshot();
	}

	function resetPosition() {
		if (!board) return;
		board.setPosition({ pieces: START_POSITION, turn: 'w' });
		refreshSnapshot();
	}

	function clearSelection() {
		board?.select(null);
		refreshSnapshot();
	}

	function toggleAutoPromotion() {
		if (!board) return;
		board.extensions.autoPromote.toQueen = !board.extensions.autoPromote.toQueen;
		autoPromoteToQueen = board.extensions.autoPromote.toQueen;
	}

	onMount(() => {
		board = createBoard({
			element: boardEl,
			state: {
				board: {
					turn: 'b',
					pieces: START_POSITION
				},
				interaction: {
					movability: {
						mode: 'strict',
						destinations: (source) => {
							if (source === 'e2')
								return [
									{ to: 'e8', promotedTo: ['B', 'N'] },
									{ to: 'd8', promotedTo: ['R', 'N', 'Q'] },
									{ to: 'f8', promotedTo: ['R', 'N', 'Q'] }
								];
							if (source === 'f7')
								return [
									{ to: 'f8', promotedTo: ['B', 'R', 'N', 'Q'] },
									{ to: 'g8', promotedTo: ['B', 'R', 'N', 'Q'] }
								];
							if (source === 'd7')
								return [
									{ to: 'd1', promotedTo: ['B', 'N'] },
									{ to: 'e1', promotedTo: ['R', 'N', 'Q'] }
								];
							if (source === 'c2')
								return [
									{ to: 'c1', promotedTo: ['B', 'R', 'N', 'Q'] },
									{ to: 'b1', promotedTo: ['B', 'R', 'N', 'Q'] }
								];
							return undefined;
						}
					}
				}
			}
		});
		board.extensions.events.setOnRawUpdate((context) => {
			console.log('Raw update:', context);
		});
		board.extensions.events.setOnUIMove((move) => {
			console.log('Move played:', move);
		});
		autoPromoteToQueen = board.extensions.autoPromote.toQueen;
		refreshSnapshot();

		const intervalId = window.setInterval(refreshSnapshot, 100);
		return () => window.clearInterval(intervalId);
	});

	onDestroy(() => {
		board?.destroy();
		board = null;
	});
</script>

<svelte:head>
	<title>Promotion</title>
</svelte:head>

<div class="page">
	<div class="panel">
		<h1>Promotion</h1>
		<p class="subtitle">Strict mode · custom promotion destinations</p>

		<div class="controls">
			<button onclick={setWhite}>Orientation: white</button>
			<button onclick={setBlack}>Orientation: black</button>
			<button onclick={resetPosition}>Reset position</button>
			<button onclick={clearSelection}>Clear selection</button>
			<button onclick={refreshSnapshot}>Refresh snapshot</button>
			<button onclick={toggleAutoPromotion}>
				Toggle auto promotion: {autoPromoteToQueen ? 'On' : 'Off'}
			</button>
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
