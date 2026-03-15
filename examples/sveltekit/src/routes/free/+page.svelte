<script lang="ts">
	import { SvgRenderer } from '@mirasen/chessboard/unstable/core/renderer/SvgRenderer.js';
	import { createBoardRuntime } from '@mirasen/chessboard/unstable/core/runtime/boardRuntime.js';
	import type { PositionMapShort } from '@mirasen/chessboard/unstable/core/state/boardTypes.js';
	import { onDestroy, onMount } from 'svelte';

	let boardEl: HTMLDivElement;
	let runtime: ReturnType<typeof createBoardRuntime> | null = null;
	let snapshotText = '';

	const START_POSITION: PositionMapShort = {
		a2: { color: 'w', role: 'p' },
		b2: { color: 'w', role: 'p' },
		c2: { color: 'w', role: 'p' },
		d2: { color: 'w', role: 'p' },
		e2: { color: 'w', role: 'p' },
		f2: { color: 'w', role: 'p' },
		g2: { color: 'w', role: 'p' },
		h2: { color: 'w', role: 'p' },

		a1: { color: 'w', role: 'R' },
		b1: { color: 'w', role: 'N' },
		c1: { color: 'w', role: 'B' },
		d1: { color: 'w', role: 'Q' },
		e1: { color: 'w', role: 'K' },
		f1: { color: 'w', role: 'B' },
		g1: { color: 'w', role: 'N' },
		h1: { color: 'w', role: 'R' },

		a7: { color: 'b', role: 'p' },
		b7: { color: 'b', role: 'p' },
		c7: { color: 'b', role: 'p' },
		d7: { color: 'b', role: 'p' },
		e7: { color: 'b', role: 'p' },
		f7: { color: 'b', role: 'p' },
		g7: { color: 'b', role: 'p' },
		h7: { color: 'b', role: 'p' },

		a8: { color: 'b', role: 'R' },
		b8: { color: 'b', role: 'N' },
		c8: { color: 'b', role: 'B' },
		d8: { color: 'b', role: 'Q' },
		e8: { color: 'b', role: 'K' },
		f8: { color: 'b', role: 'B' },
		g8: { color: 'b', role: 'N' },
		h8: { color: 'b', role: 'R' }
	} as const;

	function refreshSnapshot() {
		if (!runtime) return;
		snapshotText = JSON.stringify(runtime.getInteractionSnapshot(), null, 2);
	}

	function setWhite() {
		if (!runtime) return;
		runtime.setOrientation('white');
		refreshSnapshot();
	}

	function setBlack() {
		if (!runtime) return;
		runtime.setOrientation('black');
		refreshSnapshot();
	}

	function resetPosition() {
		if (!runtime) return;
		runtime.setBoardPosition(START_POSITION);
		refreshSnapshot();
	}

	function clearSelection() {
		if (!runtime) return;
		runtime.select(null);
		refreshSnapshot();
	}

	onMount(() => {
		runtime = createBoardRuntime({
			renderer: new SvgRenderer(),
			board: {
				position: START_POSITION
			},
			view: {
				movability: {
					mode: 'free',
					color: 'both'
				}
			}
		});

		runtime.mount(boardEl);
		refreshSnapshot();

		const intervalId = window.setInterval(refreshSnapshot, 100);

		return () => {
			window.clearInterval(intervalId);
		};
	});

	onDestroy(() => {
		runtime?.destroy();
		runtime = null;
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
			<button on:click={setWhite}>Orientation: white</button>
			<button on:click={setBlack}>Orientation: black</button>
			<button on:click={resetPosition}>Reset position</button>
			<button on:click={clearSelection}>Clear selection</button>
			<button on:click={refreshSnapshot}>Refresh snapshot</button>
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
		border-radius: 12px;
		overflow: hidden;
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
