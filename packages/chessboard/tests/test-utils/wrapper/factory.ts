import type { Chessboard, ChessboardInitOptions } from '../../../src/index.js';
import { createBoard } from '../../../src/index.js';

// Stub ResizeObserver for jsdom (runtime.mount uses it)
if (typeof globalThis.ResizeObserver === 'undefined') {
	globalThis.ResizeObserver = class ResizeObserver {
		observe() {}
		unobserve() {}
		disconnect() {}
	} as unknown as typeof globalThis.ResizeObserver;
}

/**
 * Creates an HTMLElement to serve as a mount container.
 */
export function createTestContainer(): HTMLElement {
	return document.createElement('div');
}

/**
 * Creates a test board with minimal defaults.
 * Uses element-first immediate-mount contract.
 * Returns an already-mounted board with a minimal extension set.
 */
export function createTestBoard(
	opts?: Partial<ChessboardInitOptions>
): Chessboard<readonly ['renderer']> {
	const container = createTestContainer();
	const defaults: ChessboardInitOptions<readonly ['renderer']> = {
		element: container,
		extensions: ['renderer'] as const
	};
	return createBoard({ ...defaults, ...opts } as ChessboardInitOptions<readonly ['renderer']>);
}

/**
 * Creates a test board and returns both the board and the container element it was mounted into.
 */
export function createTestBoardWithContainer(opts?: Partial<ChessboardInitOptions>): {
	board: Chessboard<readonly ['renderer']>;
	container: HTMLElement;
} {
	const container = createTestContainer();
	const defaults: ChessboardInitOptions<readonly ['renderer']> = {
		element: container,
		extensions: ['renderer'] as const
	};
	const board = createBoard({
		...defaults,
		...opts,
		element: container
	} as ChessboardInitOptions<readonly ['renderer']>);
	return { board, container };
}
