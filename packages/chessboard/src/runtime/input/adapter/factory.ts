import assert from '@ktarmyshov/assert';
import { eventDestroy, eventHandler } from './event.js';
import {
	InputAdapter,
	InputAdapterInitOptions,
	InputAdapterInternal,
	NEED_EVENT_TYPES
} from './types.js';

function createInputAdapterInternal(options: InputAdapterInitOptions): InputAdapterInternal {
	return {
		container: options.container,
		getRenderGeometry: options.getRenderGeometry,
		controller: options.controller,
		activePointerId: null
	};
}

export function createInputAdapter(options: InputAdapterInitOptions): InputAdapter {
	const internalState = createInputAdapterInternal(options);
	const onEventHander = (e: Event) => {
		eventHandler(internalState, e);
	};
	const inputAdapter: InputAdapter = {
		subscribeEvent(type) {
			internalState.container.addEventListener(type, onEventHander);
		},
		unsubscribeEvent(type) {
			assert(
				!NEED_EVENT_TYPES.has(type),
				`Unsubscribe for event type ${type} is not supported. This is required event type for the board to function properly.`
			);
			internalState.container.removeEventListener(type, onEventHander);
		},
		destroy() {
			for (const type of NEED_EVENT_TYPES) {
				internalState.container.removeEventListener(type, onEventHander);
			}
			eventDestroy(internalState);
		}
	};
	for (const type of NEED_EVENT_TYPES) {
		internalState.container.addEventListener(type, onEventHander);
	}
	return inputAdapter;
}
