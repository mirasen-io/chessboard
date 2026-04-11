import { handlePointerDown } from './pointer';
import {
	InteractionController,
	InteractionControllerInitOptions,
	InteractionControllerInternal
} from './types';

function createInteractionControllerInternal(
	options: InteractionControllerInitOptions
): InteractionControllerInternal {
	return {
		surface: options.surface
	};
}

export function createInteractionController(
	options: InteractionControllerInitOptions
): InteractionController {
	const internalState = createInteractionControllerInternal(options);
	return {
		onEvent(event) {
			if (event.type === 'pointerdown') {
				handlePointerDown(internalState, event);
			}
		}
	};
}
