import { Square } from '../state/boardTypes';
import { markDirtyLayer, markDirtySquares } from './reducers';
import { InvalidationStateInternal, InvalidationStateSnapshot, InvalidationWriter } from './types';

export function createInitialInvalidationState(): InvalidationStateInternal {
	return {
		layers: 0,
		squares: new Set<Square>()
	};
}

export function createInvalidationWriter(state: InvalidationStateInternal): InvalidationWriter {
	return {
		markLayer(layerMask: number): void {
			markDirtyLayer(state, layerMask);
		},
		markSquares(layerMask: number, square: Square | Iterable<Square>): void {
			markDirtySquares(state, layerMask, square);
		}
	};
}

export function getInvalidationSnapshot(
	state: InvalidationStateInternal
): InvalidationStateSnapshot {
	return {
		layers: state.layers,
		squares: state.squares.size > 0 ? new Set(state.squares) : undefined
	};
}
