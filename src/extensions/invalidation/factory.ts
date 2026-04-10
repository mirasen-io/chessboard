import type { ExtensionInvalidationState, ExtensionInvalidationStateInternal } from './types';

function createExtensionInvalidationStateInternal(): ExtensionInvalidationStateInternal {
	return {
		dirtyLayers: 0
	};
}

export function createExtensionInvalidationState(): ExtensionInvalidationState {
	const internalState = createExtensionInvalidationStateInternal();
	return {
		get dirtyLayers() {
			return internalState.dirtyLayers;
		},
		markDirty(layers) {
			internalState.dirtyLayers |= layers;
		},
		clearDirty(layers) {
			internalState.dirtyLayers &= ~layers;
		},
		clear() {
			internalState.dirtyLayers = 0;
		}
	};
}
