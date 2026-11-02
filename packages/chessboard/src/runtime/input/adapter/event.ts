import { ALL_SCENE_POINTER_EVENT_TYPES } from '../../../extensions/types/basic/events.js';
import { InteractionControllerOnEventContext } from '../controller/types.js';
import { pointerEventDestroy, pointerEventHandler } from './pointer.js';
import { InputAdapterInternal } from './types.js';

export function eventHandler(state: InputAdapterInternal, e: Event): void {
	let context: InteractionControllerOnEventContext;
	if (ALL_SCENE_POINTER_EVENT_TYPES.has(e.type)) {
		context = pointerEventHandler(state, e as PointerEvent);
	} else {
		context = {
			rawEvent: e,
			sceneEvent: null
		};
	}

	// Pass to controller for extension handling
	state.controller.onEvent(context);
}

export function eventDestroy(state: InputAdapterInternal): void {
	pointerEventDestroy(state);
}
