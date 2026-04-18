import { createRenderGeometry } from './geometry/factory';
import { measureBoardSize } from './helpers';
import { LayoutInternal, LayoutRefreshOptions } from './types';

export function layoutRefreshGeometry(
	state: LayoutInternal,
	options: LayoutRefreshOptions
): boolean {
	const orientation = options.orientation ?? state.orientation;

	if (orientation === null) {
		// At this point we should decide if the geometry is invalid or we throw because we expect that the first pass must deliver the orientation?
		// For now we throw
		throw new Error(
			'Orientation is expected to be provided on the first pass of layout.refreshGeometry'
		);
	}

	let boardSize = options.container ? measureBoardSize(options.container) : state.boardSize;

	if (boardSize !== null && boardSize <= 0) boardSize = null;

	const changed = boardSize !== state.boardSize || orientation !== state.orientation;
	if (!changed) {
		return false; // no-op, no relevant changes
	}

	// Update the state
	state.boardSize = boardSize;
	state.orientation = orientation;
	if (boardSize === null || orientation === null) {
		// General invalid-geometry rule. Orientation is currently guarded above,
		// but this branch stays explicit in case null orientation is allowed later.
		state.geometry = null;
	} else {
		state.geometry = createRenderGeometry(boardSize, orientation);
	}
	state.layoutEpoch++;
	return true;
}
