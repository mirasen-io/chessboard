<script lang="ts">
	import { useBoard } from '$lib/use-board.svelte';
	import { randomMove } from '$lib/board-utils';

	let boardEl: HTMLDivElement;
	let snapshotText = $state('');
	let orientation: 'white' | 'black' = $state('white');
	let drawButton = $state(2);
	let drawModifier: 'ctrl' | 'shift' | 'alt' | 'meta' | null = $state(null);

	const annotationColors: Record<string, string> = {
		none: '#15781B',
		ctrl: '#882020',
		shift: '#e68f00',
		alt: '#003088',
		meta: '#6f2da8'
	};

	const circleData = [
		['d4', 'e4', 'none'],
		['c4', 'f4', 'ctrl'],
		['b4', 'g4', 'shift'],
		['a4', 'h4', 'alt'],
		['d5', 'e5', 'meta']
	] as const;

	const arrowData = [
		['a2', 'a4', 'none'],
		['b2', 'b4', 'ctrl'],
		['c2', 'c4', 'shift'],
		['d2', 'd4', 'alt'],
		['e2', 'e4', 'meta']
	] as const;

	const { current: board } = useBoard(
		() => boardEl,
		(b) => {
			b.setMovability({ mode: 'free' });

			b.extensions.events.setOnUIMove((move) => {
				console.log('Move played:', move);
			});
			b.extensions.events.setOnRawUpdate((context) => {
				console.log('Raw update:', context);
				const replacer = (_key: string, value: unknown) => {
					if (value instanceof Set) return Array.from(value);
					if (value instanceof Map) return Object.fromEntries(value.entries());
					return value;
				};
				snapshotText = JSON.stringify(context.currentFrame, replacer, 2);
			});

			for (const [sq1, sq2, mod] of circleData) {
				b.extensions.annotations.circle(sq1, { color: annotationColors[mod] });
				b.extensions.annotations.circle(sq2, { color: annotationColors[mod] });
			}
			for (const [from, to, mod] of arrowData) {
				b.extensions.annotations.arrow(from, to, { color: annotationColors[mod] });
			}
		}
	);

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

	function doRandomMove() {
		if (!board) return;
		randomMove(board);
	}
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
			<button onclick={doRandomMove}>Random move</button>

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
		<pre class="snapshot">{snapshotText}</pre>
	</div>
</div>

<style>
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
