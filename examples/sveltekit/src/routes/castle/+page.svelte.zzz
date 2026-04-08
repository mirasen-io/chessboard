<script lang="ts">
	import { SvgRenderer } from '@mirasen/chessboard/unstable/core/renderer/SvgRenderer.js';
	import { createBoardRuntime } from '@mirasen/chessboard/unstable/core/runtime/boardRuntime.js';
	import type { MoveOptions } from '@mirasen/chessboard/unstable/core/state/boardReducers.js';
	import type {
		Move,
		MoveInputString,
		PositionMapShort
	} from '@mirasen/chessboard/unstable/core/state/boardTypes.js';
	import type { Orientation } from '@mirasen/chessboard/unstable/core/state/viewTypes.js';
	import { onDestroy, onMount } from 'svelte';

	let boardEl: HTMLDivElement;
	let runtime: ReturnType<typeof createBoardRuntime> | null = null;
	let orientation: Orientation = 'white';
	let snapshotText = '';
	let lastMoveText = 'No move yet';

	const CASTLE_POSITION: PositionMapShort = {
		a1: { color: 'w', role: 'R' },
		e1: { color: 'w', role: 'K' },
		h1: { color: 'w', role: 'R' },

		a8: { color: 'b', role: 'R' },
		e8: { color: 'b', role: 'K' },
		h8: { color: 'b', role: 'R' }
	} as const;

	function refreshSnapshot() {
		if (!runtime) return;
		snapshotText = JSON.stringify(runtime.getInteractionSnapshot(), null, 2);
	}

	function resetPosition() {
		if (!runtime) return;
		runtime.setBoardPosition(CASTLE_POSITION);
		lastMoveText = 'Position reset';
		refreshSnapshot();
	}

	function setOrientation(next: Orientation) {
		if (!runtime) return;
		orientation = next;
		runtime.setOrientation(next);
		refreshSnapshot();
	}

	function toggleOrientation() {
		setOrientation(orientation === 'white' ? 'black' : 'white');
	}

	function runMove(label: string, move: MoveInputString, opts: MoveOptions) {
		if (!runtime) return;

		try {
			const result: Move = runtime.move(move, opts);
			lastMoveText = `${label}\n${JSON.stringify(result, null, 2)}`;
		} catch (error) {
			lastMoveText = `${label}\nERROR: ${error instanceof Error ? error.message : String(error)}`;
		}

		refreshSnapshot();
	}

	function whiteKingside() {
		runMove(
			'White kingside castle',
			{ from: 'e1', to: 'g1', castleSide: 'kingside' },
			{ castle: { rookFrom: 'h1', rookTo: 'f1' } }
		);
	}

	function whiteQueenside() {
		runMove(
			'White queenside castle',
			{ from: 'e1', to: 'c1', castleSide: 'queenside' },
			{ castle: { rookFrom: 'a1', rookTo: 'd1' } }
		);
	}

	function blackKingside() {
		runMove(
			'Black kingside castle',
			{ from: 'e8', to: 'g8', castleSide: 'kingside' },
			{ castle: { rookFrom: 'h8', rookTo: 'f8' } }
		);
	}

	function blackQueenside() {
		runMove(
			'Black queenside castle',
			{ from: 'e8', to: 'c8', castleSide: 'queenside' },
			{ castle: { rookFrom: 'a8', rookTo: 'd8' } }
		);
	}

	onMount(() => {
		runtime = createBoardRuntime({
			renderer: new SvgRenderer(),
			board: {
				position: CASTLE_POSITION
			},
			view: {
				movability: {
					mode: 'free',
					color: 'both'
				}
			}
		});

		runtime.mount(boardEl);
		runtime.setOrientation(orientation);
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
	<title>Chessboard Castle Manual</title>
</svelte:head>

<div class="page">
	<div class="panel">
		<h1>Castling Manual</h1>
		<p class="subtitle">Runtime.move(...) smoke page · movable free · both colors</p>

		<div class="controls">
			<button on:click={toggleOrientation}>Orientation: {orientation}</button>
			<button on:click={resetPosition}>Reset position</button>
			<button on:click={refreshSnapshot}>Refresh snapshot</button>
		</div>

		<div class="controls">
			<button on:click={whiteKingside}>White O-O</button>
			<button on:click={whiteQueenside}>White O-O-O</button>
			<button on:click={blackKingside}>Black O-O</button>
			<button on:click={blackQueenside}>Black O-O-O</button>
		</div>

		<div class="board-wrap">
			<div bind:this={boardEl} class="board"></div>
		</div>
	</div>

	<div class="panel">
		<h2>Last move result</h2>
		<pre>{lastMoveText}</pre>

		<h2 class="section">Interaction snapshot</h2>
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

	.section {
		margin-top: 20px;
	}

	.subtitle {
		margin: 0 0 16px;
		color: #4b5563;
	}

	.controls {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
		margin-bottom: 16px;
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
		max-height: 34vh;
		white-space: pre-wrap;
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
