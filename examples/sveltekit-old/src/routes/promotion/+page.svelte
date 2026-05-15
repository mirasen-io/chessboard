<script lang="ts">
	import { createBoard, type PiecePositionRecordString } from '@mirasen/chessboard';
	import { onDestroy, onMount } from 'svelte';

	let boardEl: HTMLDivElement;
	let board: ReturnType<typeof createBoard> | null = null;
	let snapshotText = $state('');

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
		if (!board) return;
		board.setOrientation('white');
		refreshSnapshot();
	}

	function setBlack() {
		if (!board) return;
		board.setOrientation('black');
		refreshSnapshot();
	}

	function resetPosition() {
		if (!board) return;
		board.setPosition({
			pieces: START_POSITION,
			turn: 'w'
		});
		refreshSnapshot();
	}

	function clearSelection() {
		if (!board) return;
		board.select(null);
		refreshSnapshot();
	}

	let autoPromoteToQueen = $state(false);

	function toggleAutoPromotion() {
		console.log('Toggling auto promotion', board?.extensions.autoPromote.toQueen);
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

		return () => {
			window.clearInterval(intervalId);
		};
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
			<button onclick={refreshSnapshot}>Refresh snapshot</button>
			<button onclick={toggleAutoPromotion}
				>Toggle auto promotion: {autoPromoteToQueen ? 'On' : 'Off'}</button
			>
		</div>

		<div class="board-wrap">
			<div bind:this={boardEl} class="board"></div>
		</div>
	</div>

	<div class="panel">
		<h2>Interaction snapshot</h2>
		<pre>{snapshotText}</pre>
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
	h2 {
		margin: 0 0 12px;
	}

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

	pre {
		margin: 0;
		padding: 16px;
		border-radius: 12px;
		background: #111827;
		color: #e5e7eb;
		font-size: 12px;
		line-height: 1.45;
		overflow: auto;
		max-height: 70vh;
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
