import { TransientInput } from '../../extensions/types/basic/transient-visuals';
import { ExtensionRenderTransientVisualsContext } from '../../extensions/types/context/transient-visuals';
import { RenderSystemInternal } from '../types';
import { validateIsMounted } from './helpers';

export function performRenderTransientVisualsPass(
	state: RenderSystemInternal,
	request: TransientInput
): void {
	validateIsMounted(state);
	const currentFrame = state.currentFrame;
	if (!currentFrame) {
		throw new Error(
			'renderTransientVisuals() called but no previous render state found. render() must be called before renderTransientVisuals().'
		);
	}

	// Loop over the subscribers and call renderTransientVisuals on each)
	const context: ExtensionRenderTransientVisualsContext = {
		currentFrame,
		transientInput: request
	};
	for (const extensionId of state.transientVisualsSubscribers) {
		const extensionRec = state.extensions.get(extensionId);
		if (!extensionRec) {
			throw new Error(
				`Extension with id ${extensionId} is subscribed to transient visuals but not found in render system extensions.`
			);
		}
		const extension = extensionRec.extension.instance;
		extension.renderTransientVisuals?.(context);
	}
}
