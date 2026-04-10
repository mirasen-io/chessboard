import { Color } from '../state/board/types';
import { createRenderGeometry } from './geometry/factory';
import { measureBoardSize } from './helpers';
import { LayoutInternal } from './types';

function layoutRefreshGeometryInternal(
	state: LayoutInternal,
	boardSize: number,
	orientation: Color
): boolean {
	if (boardSize < 0) boardSize = 0;
	const changed = [
		boardSize !== state.boardSize,
		boardSize > 0 && orientation !== state.geometry?.orientation
	].some(Boolean);
	if (changed) {
		if (boardSize === 0) {
			// Remove geometry if boardSize is invalid, but still update version to trigger re-render.
			state.boardSize = 0;
			state.layoutVersion++;
			state.geometry = null;
			return true;
		}
		state.boardSize = boardSize;
		state.layoutVersion++;
		state.geometry = createRenderGeometry(boardSize, orientation);
	}
	return changed;
}

export function layoutRefreshGeometry(
	state: LayoutInternal,
	container: HTMLElement,
	orientation: Color
): boolean {
	const boardSize = measureBoardSize(container);
	return layoutRefreshGeometryInternal(state, boardSize, orientation);
}

export function layoutRefreshGeometryForOrientation(
	state: LayoutInternal,
	orientation: Color
): boolean {
	return layoutRefreshGeometryInternal(state, state.boardSize, orientation);
}
