<script lang="ts">
	import { createLastMove } from '@mirasen/chessboard/unstable/extensions/first-party/last-move/factory.js';
	import { createMainRenderer } from '@mirasen/chessboard/unstable/extensions/first-party/main-renderer/factory.js';
	import { createSelectedSquare } from '@mirasen/chessboard/unstable/extensions/first-party/selected-square/factory.js';
	import { createRuntime } from '@mirasen/chessboard/unstable/runtime/factory/main.js';
	import type { PiecePositionRecordString } from '@mirasen/chessboard/unstable/state/board/types/input.js';
	import { onDestroy, onMount } from 'svelte';

	let boardEl: HTMLDivElement;
	let runtime: ReturnType<typeof createRuntime> | null = null;
	let snapshotText = $state('');

	const START_POSITION: PiecePositionRecordString = {
		a2: 'wP',
		b2: 'wP',
		c2: 'wP',
		d2: 'wP',
		e2: 'wP',
		f2: 'wP',
		g2: 'wP',
		h2: 'wP',

		a1: 'wR',
		b1: 'wN',
		c1: 'wB',
		d1: 'wQ',
		e1: 'wK',
		f1: 'wB',
		g1: 'wN',
		h1: 'wR',

		a7: 'bP',
		b7: 'bP',
		c7: 'bP',
		d7: 'bP',
		e7: 'bP',
		f7: 'bP',
		g7: 'bP',
		h7: 'bP',

		a8: 'bR',
		b8: 'bN',
		c8: 'bB',
		d8: 'bQ',
		e8: 'bK',
		f8: 'bB',
		g8: 'bN',
		h8: 'bR'
	} as const;

	function refreshSnapshot() {
		if (!runtime) return;
		snapshotText = JSON.stringify(runtime.getSnapshot(), null, 2);
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
		runtime.setPiecePosition(START_POSITION);
		refreshSnapshot();
	}

	function clearSelection() {
		if (!runtime) return;
		runtime.select(null);
		refreshSnapshot();
	}

	onMount(() => {
		runtime = createRuntime({
			doc: document,
			extensions: [createMainRenderer({}), createSelectedSquare(), createLastMove()]
		});
		runtime.setMovability({ mode: 'free' });
		runtime.mount(boardEl);
		refreshSnapshot();

		const intervalId = window.setInterval(refreshSnapshot, 100);

		return () => {
			window.clearInterval(intervalId);
		};
	});

	onDestroy(() => {
		runtime?.unmount();
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
			<button onclick={setWhite}>Orientation: white</button>
			<button onclick={setBlack}>Orientation: black</button>
			<button onclick={resetPosition}>Reset position</button>
			<button onclick={clearSelection}>Clear selection</button>
			<button onclick={refreshSnapshot}>Refresh snapshot</button>
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
