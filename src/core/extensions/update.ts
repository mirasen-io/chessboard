import { isCurrentUpdateContextCommonMounted } from './helpers';
import {
	AnyExtensionOnUpdateStateContext,
	ExtensionOnUpdateStateContextCommon,
	ExtensionOnUpdateStateContextCommonUnmounted,
	ExtensionSystemInternal,
	ExtensionSystemUpdateRequest
} from './types';

export function extensionSystemUpdateState(
	state: ExtensionSystemInternal,
	request: ExtensionSystemUpdateRequest
): void {
	// Prepare base context
	const contextCommon: ExtensionOnUpdateStateContextCommon = {
		previous: state.lastUpdated?.current ?? null,
		mutation: request.mutation,
		current: request.state
	};

	// Update invalidation state based on the new request
	for (const extension of state.extensions.values()) {
		const context: AnyExtensionOnUpdateStateContext = isCurrentUpdateContextCommonMounted(
			contextCommon
		)
			? {
					...contextCommon,
					previousData: extension.storedData.previous,
					invalidation: extension.invalidation,
					animation: extension.animation
				}
			: {
					...(contextCommon as ExtensionOnUpdateStateContextCommonUnmounted),
					previousData: extension.storedData.previous
				};
		const newData = extension.instance.onStateUpdate(context);
		extension.storedData.previous = extension.storedData.current;
		extension.storedData.current = newData;
	}
	state.lastUpdated = contextCommon;
}
