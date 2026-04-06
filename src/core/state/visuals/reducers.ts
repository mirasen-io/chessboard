import { cloneDeep } from 'es-toolkit/object';
import { BoardPointSnapshot, VisualsStateInternal } from './types';

export function visualsSetDragPointer(
	state: VisualsStateInternal,
	point: BoardPointSnapshot | null
): boolean {
	const changed = [state.dragPointer?.x !== point?.x, state.dragPointer?.y !== point?.y].some(
		Boolean
	);

	if (changed) {
		state.dragPointer = cloneDeep(point);
	}

	return changed;
}
