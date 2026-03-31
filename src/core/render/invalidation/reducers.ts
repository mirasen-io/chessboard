import { DirtyLayerMask, InvalidationStateBaseInternal } from './types';

export function invalidationMarkLayer(
	state: InvalidationStateBaseInternal,
	layerMask: DirtyLayerMask
): boolean {
	const prevLayers = state.layers;
	state.layers |= layerMask;
	return state.layers !== prevLayers;
}

export function invalidationClear(state: InvalidationStateBaseInternal): boolean {
	const changed = state.layers !== 0;
	state.layers = 0;
	return changed;
}
