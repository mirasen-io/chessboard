import { cloneDeep } from 'lodash-es';
import { invalidationClear, invalidationMarkLayer } from './reducers';
import type {
	InvalidationState,
	InvalidationStateBase,
	InvalidationStateBaseInternal,
	InvalidationStateExtensionSnapshot,
	InvalidationStateInternal,
	InvalidationStateSnapshot
} from './types';

function createInvalidationStateBaseInternal(): InvalidationStateBaseInternal {
	return {
		layers: 0
	};
}

function createInvalidationStateBase(
	internalState?: InvalidationStateBaseInternal
): InvalidationStateBase {
	internalState = internalState ?? createInvalidationStateBaseInternal();
	return {
		getLayers() {
			return internalState.layers;
		},
		getSnapshot() {
			return cloneDeep(internalState);
		},
		markLayer(layerMask, mutationSession) {
			return mutationSession.addMutation(
				'invalidation.state.marked',
				invalidationMarkLayer(internalState, layerMask)
			);
		},
		clear(mutationSession) {
			return mutationSession.addMutation(
				'invalidation.state.cleared',
				invalidationClear(internalState)
			);
		}
	};
}

const createInvalidationStateExtension = createInvalidationStateBase;

function createInvalidationStateInternal(): InvalidationStateInternal {
	const baseInternal = createInvalidationStateBaseInternal();
	return {
		...baseInternal,
		extensions: {}
	};
}

export function createInvalidationState(): InvalidationState {
	const internalState = createInvalidationStateInternal();
	const internalBase = createInvalidationStateBase(internalState);
	return {
		...internalBase,
		getExtensions() {
			return { ...internalState.extensions };
		},
		getExtension(extensionId) {
			return internalState.extensions[extensionId];
		},
		createExtension(extensionId, mutationSession) {
			if (internalState.extensions[extensionId]) {
				throw new Error(`Extension with id "${extensionId}" already exists in invalidation state.`);
			}
			const extension = createInvalidationStateExtension();
			internalState.extensions[extensionId] = extension;
			mutationSession.addMutation('invalidation.state.createExtension', true, { extensionId });
			return extension;
		},
		getSnapshot() {
			let prep = Object.fromEntries(
				Object.entries(internalState).filter(([key]) => key !== 'extensions')
			) as Omit<InvalidationStateInternal, 'extensions'>;
			prep = cloneDeep(prep);
			const extensionsSnapshot = Object.fromEntries(
				Object.entries(internalState.extensions).map(([id, ext]) => [id, ext.getSnapshot()])
			) as Record<string, InvalidationStateExtensionSnapshot>;
			const result: InvalidationStateSnapshot = {
				...prep,
				extensions: extensionsSnapshot
			};
			return result;
		}
	};
}
