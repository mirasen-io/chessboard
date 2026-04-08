import {
	AnyExtensionOnUpdateStateContext,
	ExtensionOnUpdateStateContextCommon,
	ExtensionSystemInternal,
	ExtensionSystemUpdateRequest
} from './types';

export function extensionSystemUpdateState(
	state: ExtensionSystemInternal,
	request: ExtensionSystemUpdateRequest
): void {
	// Prepare base context
	const contextCommonBase: ExtensionOnUpdateStateContextCommon = {
		previous: state.lastUpdated?.current ?? null,
		mutation: request.mutation,
		current: request.state
	};

	// Update invalidation state based on the new request
	for (const extension of state.extensions.values()) {
		const context: AnyExtensionOnUpdateStateContext = {
			...contextCommonBase,
			previousData: extension.storedData.current,
			invalidation: extension.invalidation,
			animation: extension.animation
		};
		const newData = extension.instance.onStateUpdate(context);
		extension.storedData.previous = extension.storedData.current;
		extension.storedData.current = newData;
	}
	state.lastUpdated = contextCommonBase;
}
