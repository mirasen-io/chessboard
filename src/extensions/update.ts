import { isCurrentUpdateContextCommonMounted } from './helpers';
import {
	ExtensionOnUpdateStateContext,
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
		const context: ExtensionOnUpdateStateContext = isCurrentUpdateContextCommonMounted(
			contextCommon
		)
			? {
					...contextCommon,
					invalidation: extension.invalidation,
					animation: extension.animation
				}
			: {
					...(contextCommon as ExtensionOnUpdateStateContextCommonUnmounted)
				};
		extension.instance.onStateUpdate(context);
	}
	state.lastUpdated = contextCommon;
}
