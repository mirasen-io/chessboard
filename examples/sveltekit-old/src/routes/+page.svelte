<script lang="ts">
	import { createBoard } from '@mirasen/chessboard';
	import { onDestroy, onMount } from 'svelte';

	let boardEl: HTMLDivElement;
	let board: ReturnType<typeof createBoard> | null = null;
	let snapshotText = $state('');
	let orientation: 'white' | 'black' = $state('white');
	let drawButton = $state(2);
	let drawModifier: 'ctrl' | 'shift' | 'alt' | 'meta' | null = $state(null);

	function setAnnotationModifier(modifier: typeof drawModifier) {
		if (!board) return;
		drawModifier = modifier;
		board.extensions.annotations.drawModifier = modifier;
	}

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

	function resetPosition() {
		if (!board) return;
		board.setPosition('start');
		board.extensions.annotations.clear();
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
		board.extensions.events.setOnUIMove((move) => {
			console.log('Move played:', move);
		});
		board.extensions.events.setOnRawUpdate((context) => {
			console.log('Raw update:', context);
			const currentFrame = context.currentFrame;
			// Convert sets and maps into arrays for better readability in the snapshot
			const replacer = (key: string, value: unknown) => {
				if (value instanceof Set) {
					return Array.from(value);
				}
				if (value instanceof Map) {
					return Object.fromEntries(value.entries());
				}
				return value;
			};
			snapshotText = JSON.stringify(currentFrame, replacer, 2);
		});

		const annotationColors = {
			none: '#15781B',
			ctrl: '#882020',
			shift: '#e68f00',
			alt: '#003088',
			meta: '#6f2da8'
		};

		// Circles: each color on one light square and one dark square.
		board.extensions.annotations.circle('d4', { color: annotationColors.none }); // green, light
		board.extensions.annotations.circle('e4', { color: annotationColors.none }); // green, dark

		board.extensions.annotations.circle('c4', { color: annotationColors.ctrl }); // red, dark
		board.extensions.annotations.circle('f4', { color: annotationColors.ctrl }); // red, light

		board.extensions.annotations.circle('b4', { color: annotationColors.shift }); // orange, light
		board.extensions.annotations.circle('g4', { color: annotationColors.shift }); // orange, dark

		board.extensions.annotations.circle('a4', { color: annotationColors.alt }); // blue, dark
		board.extensions.annotations.circle('h4', { color: annotationColors.alt }); // blue, light

		board.extensions.annotations.circle('d5', { color: annotationColors.meta }); // purple, dark
		board.extensions.annotations.circle('e5', { color: annotationColors.meta }); // purple, light

		// Arrows: each default color once.
		board.extensions.annotations.arrow('a2', 'a4', { color: annotationColors.none });
		board.extensions.annotations.arrow('b2', 'b4', { color: annotationColors.ctrl });
		board.extensions.annotations.arrow('c2', 'c4', { color: annotationColors.shift });
		board.extensions.annotations.arrow('d2', 'd4', { color: annotationColors.alt });
		board.extensions.annotations.arrow('e2', 'e4', { color: annotationColors.meta });

		return () => {};
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
			<button onclick={toggleOrientation}>Orientation: {orientation}</button>
			<button onclick={resetPosition}>Reset position</button>
			<button onclick={clearSelection}>Clear selection</button>
			<button onclick={randomMove}>Random move</button>

			<button onclick={toggleAnnotationsDrawButton}>
				Annotation: {drawButton === 0 ? 'on' : 'off'}
			</button>

			<div class="segmented" aria-label="Annotation color modifier">
				<button
					class:active={drawModifier === null}
					aria-pressed={drawModifier === null}
					onclick={() => setAnnotationModifier(null)}
				>
					None
				</button>
				<button
					class:active={drawModifier === 'ctrl'}
					aria-pressed={drawModifier === 'ctrl'}
					onclick={() => setAnnotationModifier('ctrl')}
				>
					Ctrl
				</button>
				<button
					class:active={drawModifier === 'shift'}
					aria-pressed={drawModifier === 'shift'}
					onclick={() => setAnnotationModifier('shift')}
				>
					Shift
				</button>
				<button
					class:active={drawModifier === 'alt'}
					aria-pressed={drawModifier === 'alt'}
					onclick={() => setAnnotationModifier('alt')}
				>
					Alt
				</button>
				<button
					class:active={drawModifier === 'meta'}
					aria-pressed={drawModifier === 'meta'}
					onclick={() => setAnnotationModifier('meta')}
				>
					Meta
				</button>
			</div>
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

	.segmented {
		display: inline-flex;
		gap: 0;
	}

	.segmented button {
		border-radius: 0;
	}

	.segmented button:first-child {
		border-top-left-radius: 6px;
		border-bottom-left-radius: 6px;
	}

	.segmented button:last-child {
		border-top-right-radius: 6px;
		border-bottom-right-radius: 6px;
	}

	.segmented button.active {
		font-weight: 700;
	}
</style>
