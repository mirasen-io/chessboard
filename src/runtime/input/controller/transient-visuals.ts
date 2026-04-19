import { SceneEvent, ScenePointerEvent } from '../../../extensions/types/basic/events.js';
import { ExtensionOnEventContext } from '../../../extensions/types/context/events.js';
import { InteractionControllerInternal } from './types.js';

function isPointerEvent(event: SceneEvent): event is ScenePointerEvent {
	return event.type.startsWith('pointer');
}

function isRawPointerEvent(event: Event): event is PointerEvent {
	return event instanceof PointerEvent;
}

export function transmitTransientInput(
	state: InteractionControllerInternal,
	context: ExtensionOnEventContext
): void {
	if (
		context.sceneEvent &&
		isPointerEvent(context.sceneEvent) &&
		isRawPointerEvent(context.rawEvent) &&
		context.sceneEvent.boardClampedPoint
	) {
		state.surface.transientInput({
			target: context.sceneEvent.targetSquare,
			point: context.sceneEvent.point,
			clampedPoint: context.sceneEvent.clampedPoint,
			boardClampedPoint: context.sceneEvent.boardClampedPoint
		});
	}
}
