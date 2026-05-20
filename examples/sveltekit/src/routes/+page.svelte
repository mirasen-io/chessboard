<script lang="ts">
	import { randomMove } from '$lib/board-utils';
	import { useBoard } from '$lib/use-board.svelte';

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

	const board = useBoard(
		() => boardEl,
		(b) => {
			b.setMovability({ mode: 'free' });

			b.extensions.events.setOnUIMove((move) => {
				console.log('Move played:', move);
			});
			b.extensions.events.setOnRawUpdate((context) => {
				const replacer = (_key: string, value: unknown) => {
					if (value instanceof Set) return Array.from(value);
					if (value instanceof Map) return Object.fromEntries(value.entries());
					return value;
				};
				snapshotText = JSON.stringify(context.currentFrame, replacer, 2);
				console.log('Raw update:', snapshotText);
				Array.from(context.mutation.getAll().keys()).forEach((key) => {
					console.log(`Mutation key: ${key}`);
				});
			});

			for (const [sq1, sq2, mod] of circleData) {
				b.extensions.annotations.circle(sq1, { color: annotationColors[mod] });
				b.extensions.annotations.circle(sq2, { color: annotationColors[mod] });
			}
			for (const [from, to, mod] of arrowData) {
				b.extensions.annotations.arrow(from, to, { color: annotationColors[mod] });
			}
			b.setInteractionConfig({
				drag: {
					liftedActivation: {
						thresholdPx: 5
					}
				}
			});
			b.extensions.renderer.setConfig({
				animation: {
					durationMs: 2000
				},
				drag: {
					pieceAnchor: 'bottom',
					pieceScale: 1.5
				}
			});
		}
	);

	function setAnnotationModifier(modifier: typeof drawModifier) {
		if (!board.current) return;
		drawModifier = modifier;
		board.current.extensions.annotations.drawModifier = modifier;
	}

	function toggleOrientation() {
		if (!board.current) return;
		orientation = orientation === 'white' ? 'black' : 'white';
		board.current.setOrientation(orientation);
	}

	function toggleAnnotationsDrawButton() {
		if (!board.current) return;
		const currentValue = board.current.extensions.annotations.drawButton;
		drawButton = currentValue === 0 ? 2 : 0;
		board.current.extensions.annotations.drawButton = drawButton;
	}

	function resetPosition() {
		if (!board.current) return;
		board.current.setPosition('start');
		board.current.extensions.annotations.clear();
	}

	function clearSelection() {
		if (!board.current) return;
		board.current.select(null);
	}

	function doRandomMove() {
		if (!board.current) return;
		randomMove(board.current);
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
