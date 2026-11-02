import { ExtensionPendingUIMoveRequestContext } from './types/context/ui-move.js';
import { ExtensionUpdateContext, ExtensionUpdateContextCommon } from './types/context/update.js';
import { ExtensionSystemInternal, ExtensionSystemUpdateRequest } from './types/main.js';

export function extensionSystemUpdateState(
	state: ExtensionSystemInternal,
	request: ExtensionSystemUpdateRequest
): void {
	// Prepare base context
	const contextCommonPart: Omit<ExtensionUpdateContextCommon, 'invalidation'> = {
		previousFrame: state.currentFrame,
		mutation: request.mutation,
		currentFrame: request.state
	};

	// Update invalidation state based on the new request
	for (const extension of state.extensions.values()) {
		const contextCommon: ExtensionUpdateContextCommon = {
			...contextCommonPart,
			invalidation: extension.invalidation
		};
		const context: ExtensionUpdateContext = contextCommon as ExtensionUpdateContext;
		extension.instance.onUpdate?.(context);
	}
	state.currentFrame = request.state;
}

export function extensionSystemUpdateUIMoveRequest(
	state: ExtensionSystemInternal,
	context: ExtensionPendingUIMoveRequestContext
): void {
	for (const extension of state.extensions.values()) {
		if (extension.instance.onUIMoveRequest) {
			extension.instance.onUIMoveRequest(context);
		}
	}
}
