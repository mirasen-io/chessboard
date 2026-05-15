import { createBoard, type Chessboard } from '@mirasen/chessboard';
import { onDestroy, onMount } from 'svelte';

/**
 * Lifecycle helper: creates a board on mount, destroys on unmount.
 * The `setup` callback receives the board instance and may return a cleanup function.
 */
export function useBoard(
	getElement: () => HTMLElement,
	setup: (board: Chessboard) => (() => void) | void
): { readonly current: Chessboard | null } {
	let board: Chessboard | null = $state.raw(null);
	let teardown: (() => void) | void;

	onMount(() => {
		const b = createBoard({ element: getElement() });
		board = b;
		teardown = setup(b);
	});

	onDestroy(() => {
		teardown?.();
		board?.destroy();
		board = null;
	});

	return {
		get current() {
			return board;
		}
	};
}
