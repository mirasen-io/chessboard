import {
	handlePointerCancel,
	handlePointerDown,
	handlePointerMove,
	handlePointerUp
} from './pointer.js';
import { transmitTransientInput } from './transient-visuals.js';
import {
	InteractionController,
	InteractionControllerInitOptions,
	InteractionControllerInternal
} from './types.js';

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
		onEvent(context) {
			internalState.surface.onEvent(context);
			if (context.rawEvent.defaultPrevented) {
				transmitTransientInput(internalState, context);
				return; // The event has been handled by the surface (extensions)
			}
			switch (context.rawEvent.type) {
				case 'pointerdown':
					handlePointerDown(internalState, context);
					break;
				case 'pointermove':
					handlePointerMove(internalState, context);
					break;
				case 'pointerup':
					handlePointerUp(internalState, context);
					break;
				case 'pointercancel':
					handlePointerCancel(internalState, context);
					break;
			}
			transmitTransientInput(internalState, context);
		}
	};
}
