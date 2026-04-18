import { SceneEvent, ScenePointerEvent } from '../../../extensions/types/basic/events';
import { InteractionControllerInternal } from './types';

function isPointerEvent(event: SceneEvent): event is ScenePointerEvent {
	return event.type.startsWith('pointer');
}

export function transmitTransientInput(
	state: InteractionControllerInternal,
	event: SceneEvent
): void {
	if (isPointerEvent(event) && event.rawPoint && event.clampedPoint) {
		state.surface.transientInput({
			target: event.target,
			rawPoint: event.rawPoint,
			clampedPoint: event.clampedPoint
		});
	}
}
