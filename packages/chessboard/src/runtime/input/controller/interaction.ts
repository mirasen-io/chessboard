import type { RuntimeInteractionAction } from '../../../extensions/types/basic/events.js';
import {
	determineActionLostPointerCapture,
	determineActionPointerCancel,
	determineActionPointerDown,
	determineActionPointerMove,
	determineActionPointerUp
} from './pointer.js';
import type {
	InteractionControllerInternal,
	InteractionControllerOnEventContext
} from './types.js';

export function determineRuntimeInteractionAction(
	state: InteractionControllerInternal,
	context: InteractionControllerOnEventContext
): RuntimeInteractionAction | null {
	switch (context.rawEvent.type) {
		case 'pointerdown':
			return determineActionPointerDown(state, context);
		case 'pointermove':
			return determineActionPointerMove(state, context);
		case 'pointerup':
			return determineActionPointerUp(state, context);
		case 'pointercancel':
			return determineActionPointerCancel(state, context);
		case 'lostpointercapture':
			return determineActionLostPointerCapture(state, context);
	}
	return null;
}
