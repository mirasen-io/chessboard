/**
 * Measure board size from container (square board fits within host).
 */
export function measureBoardSize(container: HTMLElement): number {
	return Math.min(container.clientWidth, container.clientHeight);
}
