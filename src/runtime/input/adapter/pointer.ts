import assert from '@ktarmyshov/assert';
import { ALL_SCENE_POINTER_EVENT_TYPES } from '../../../extensions/types/basic/events.js';
import { ExtensionOnEventContext } from '../../../extensions/types/context/events.js';
import { makeScenePointerEvent } from './helpers.js';
import { InputAdapterInternal } from './types.js';

export function pointerEventHandler(
	state: InputAdapterInternal,
	e: PointerEvent
): ExtensionOnEventContext {
	assert(ALL_SCENE_POINTER_EVENT_TYPES.has(e.type), `Unexpected pointer event type: ${e.type}`);
	// First convert to scene event for controller
	const sceneEvent = makeScenePointerEvent(state, e);
	// Then handle pointer event within the adapter logic (e.g. tracking active pointer, capturing, etc.)
	pointerEventAdapterHandler(state, e);
	// Then create context and pass to controller for extension handling
	return {
		rawEvent: e,
		sceneEvent
	};
}

function pointerEventAdapterHandler(state: InputAdapterInternal, e: PointerEvent): void {
	switch (e.type) {
		case 'pointerdown':
			adapterOnPointerDown(state, e);
			break;
		case 'pointerup':
			adapterOnPointerUp(state, e);
			break;
		case 'pointercancel':
			adapterOnPointerCancel(state, e);
			break;
	}
}

/** Release capture for the currently tracked pointer and clear tracking state. */
export function releaseCapture(state: InputAdapterInternal): void {
	if (state.activePointerId === null) return;
	if (state.container.hasPointerCapture(state.activePointerId)) {
		state.container.releasePointerCapture(state.activePointerId);
	}
	state.activePointerId = null;
}

export function adapterOnPointerDown(state: InputAdapterInternal, e: PointerEvent): void {
	assert(e.type === 'pointerdown', `Expected pointerdown event, got ${e.type}`);
	if (!e.isPrimary) return; // ignore non-primary pointers
	if (state.activePointerId !== null) return; // already tracking
	state.activePointerId = e.pointerId;
	state.container.setPointerCapture(e.pointerId);
}

export function adapterOnPointerUp(state: InputAdapterInternal, e: PointerEvent): void {
	assert(e.type === 'pointerup', `Expected pointerup event, got ${e.type}`);
	if (e.pointerId !== state.activePointerId) return;
	releaseCapture(state);
}

export function adapterOnPointerCancel(state: InputAdapterInternal, e: PointerEvent): void {
	assert(e.type === 'pointercancel', `Expected pointercancel event, got ${e.type}`);
	if (e.pointerId !== state.activePointerId) return;
	releaseCapture(state);
}

export function pointerEventDestroy(state: InputAdapterInternal): void {
	if (state.activePointerId !== null) {
		releaseCapture(state);
	}
	state.activePointerId = null;
}
