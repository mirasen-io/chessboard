import {
	isPointerRelevantEvent,
	onPointerCancel,
	onPointerDown,
	onPointerLeave,
	onPointerMove,
	onPointerUp,
	releaseCapture
} from './pointer';
import { InputAdapter, InputAdapterInitOptions, InputAdapterInternal } from './types';

function createInputAdapterInternal(options: InputAdapterInitOptions): InputAdapterInternal {
	return {
		container: options.container,
		getGeometry: options.getGeometry,
		controller: options.controller,
		activePointerId: null
	};
}

export function createInputAdapter(options: InputAdapterInitOptions): InputAdapter {
	const internalState = createInputAdapterInternal(options);
	const onPointerDownHandler = (e: PointerEvent) => {
		if (!isPointerRelevantEvent(e)) return;
		onPointerDown(internalState, e);
	};
	const onPointerMoveHandler = (e: PointerEvent) => {
		if (!isPointerRelevantEvent(e)) return;
		onPointerMove(internalState, e);
	};
	const onPointerUpHandler = (e: PointerEvent) => {
		if (!isPointerRelevantEvent(e)) return;
		onPointerUp(internalState, e);
	};
	const onPointerCancelHandler = (e: PointerEvent) => {
		if (!isPointerRelevantEvent(e)) return;
		onPointerCancel(internalState, e);
	};
	const onPointerLeaveHandler = (e: PointerEvent) => {
		if (!isPointerRelevantEvent(e)) return;
		onPointerLeave(internalState, e);
	};
	const inputAdapter: InputAdapter = {
		destroy() {
			if (internalState.activePointerId !== null) {
				releaseCapture(internalState);
			}
			internalState.container.removeEventListener('pointerdown', onPointerDownHandler);
			internalState.container.removeEventListener('pointermove', onPointerMoveHandler);
			internalState.container.removeEventListener('pointerup', onPointerUpHandler);
			internalState.container.removeEventListener('pointercancel', onPointerCancelHandler);
			internalState.container.removeEventListener('pointerleave', onPointerLeaveHandler);
		}
	};
	internalState.container.addEventListener('pointerdown', onPointerDownHandler);
	internalState.container.addEventListener('pointermove', onPointerMoveHandler);
	internalState.container.addEventListener('pointerup', onPointerUpHandler);
	internalState.container.addEventListener('pointercancel', onPointerCancelHandler);
	internalState.container.addEventListener('pointerleave', onPointerLeaveHandler);
	return inputAdapter;
}
