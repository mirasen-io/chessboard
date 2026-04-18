import { ExtensionUIMoveRequestContext } from './types/context/ui-move';
import {
	ExtensionUpdateContext,
	ExtensionUpdateContextCommon,
	ExtensionUpdateContextCommonUnmounted,
	isUpdateContextCommonMounted
} from './types/context/update';
import { ExtensionSystemInternal, ExtensionSystemUpdateRequest } from './types/main';

export function extensionSystemUpdateState(
	state: ExtensionSystemInternal,
	request: ExtensionSystemUpdateRequest
): void {
	// Prepare base context
	const contextCommon: ExtensionUpdateContextCommon = {
		previousFrame: state.currentFrame,
		mutation: request.mutation,
		currentFrame: request.state
	};

	// Update invalidation state based on the new request
	for (const extension of state.extensions.values()) {
		const context: ExtensionUpdateContext = isUpdateContextCommonMounted(contextCommon)
			? {
					...contextCommon,
					invalidation: extension.invalidation
				}
			: {
					...(contextCommon as ExtensionUpdateContextCommonUnmounted)
				};
		extension.instance.onUpdate(context);
	}
	state.currentFrame = request.state;
}

export function extensionSystemUpdateUIMoveRequest(
	state: ExtensionSystemInternal,
	context: ExtensionUIMoveRequestContext
): void {
	for (const extension of state.extensions.values()) {
		if (extension.instance.onUIMoveRequest) {
			extension.instance.onUIMoveRequest(context);
		}
	}
}
