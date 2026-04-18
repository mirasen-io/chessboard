import { Square } from '../state/boardTypes';
import { markDirtyLayer, markDirtySquares } from './reducers';
import {
	InvalidationStateExtensionSnapshot,
	InvalidationStateInternal,
	InvalidationStateSnapshot,
	InvalidationWriter
} from './types';

export function createInvalidationState(): InvalidationStateInternal {
	return {
		layers: 0,
		squares: new Set<Square>(),
		extensions: {}
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

export function createExtensionInvalidationWriter(
	state: InvalidationStateInternal,
	extensionId: string
): InvalidationWriter {
	const extState = state.extensions[extensionId];
	if (!extState) {
		throw new Error(`Extension with id "${extensionId}" does not exist in invalidation state.`);
	}
	return {
		markLayer(layerMask: number): void {
			markDirtyLayer(extState, layerMask);
		},
		markSquares(layerMask: number, square: Square | Iterable<Square>): void {
			markDirtySquares(extState, layerMask, square);
		}
	};
}

/**
 * Build a snapshot of the current invalidation state.
 * Squares are copied into a new Set (not the live internal set).
 */
export function getInvalidationSnapshot(
	state: InvalidationStateInternal
): InvalidationStateSnapshot {
	return {
		layers: state.layers,
		squares: new Set(state.squares),
		extensions: Object.fromEntries(
			Object.entries(state.extensions).map(([key, ext]) => [
				key,
				{
					layers: ext.layers,
					squares: new Set(ext.squares)
				}
			])
		)
	};
}

export function initializeExtensionInvalidation(
	state: InvalidationStateInternal,
	extensionId: string
): void {
	if (state.extensions[extensionId]) {
		throw new Error(`Extension "${extensionId}" invalidation already initialized`);
	}
	state.extensions[extensionId] = {
		layers: 0,
		squares: new Set()
	};
}

export function getExtensionInvalidationSnapshot(
	state: InvalidationStateInternal,
	extensionId: string
): InvalidationStateExtensionSnapshot {
	const extState = state.extensions[extensionId];
	if (!extState) {
		throw new Error(`Extension "${extensionId}" not found in invalidation state`);
	}
	return {
		layers: extState.layers,
		squares: new Set(extState.squares)
	};
}
