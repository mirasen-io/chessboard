import { handlePointerDown, handlePointerMove, handlePointerUp } from './pointer';
import { transmitTransientInput } from './transient-visuals';
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
			switch (event.type) {
				case 'pointerdown':
					handlePointerDown(internalState, event);
					break;
				case 'pointermove':
					handlePointerMove(internalState, event);
					break;
				case 'pointerup':
					handlePointerUp(internalState, event);
					break;
			}
			transmitTransientInput(internalState, event);
		}
	};
}
