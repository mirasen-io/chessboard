import type { ExtensionOnEventContext } from '../../../extensions/types/context/events.js';
import { determineRuntimeInteractionAction } from './interaction.js';
import { transmitTransientInput } from './transient-visuals.js';
import type {
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
			const action = determineRuntimeInteractionAction(internalState, context);
			const extensionContext: ExtensionOnEventContext = {
				...context,
				runtimeInteractionActionPreview: action
			};
			internalState.surface.onEvent(extensionContext);
			if (context.rawEvent.defaultPrevented) {
				transmitTransientInput(internalState, context);
				return; // The event has been handled by the surface (extensions)
			}

			if (action) {
				switch (action.type) {
					case 'startLiftedDrag':
						internalState.surface.startLiftedDrag(action.source, action.target, action.startButton);
						break;
					case 'startReleaseTargetingDrag':
						internalState.surface.startReleaseTargetingDrag(
							action.source,
							action.target,
							action.startButton
						);
						break;
					case 'completeCoreDragTo':
						internalState.surface.completeCoreDragTo(action.target);
						break;
					case 'completeExtensionDrag':
						internalState.surface.completeExtensionDrag(action.target);
						break;
					case 'updateDragSessionCurrentTarget':
						internalState.surface.updateDragSessionCurrentTarget(action.target);
						break;
					case 'cancelActiveInteraction':
						internalState.surface.cancelActiveInteraction();
						break;
					case 'cancelInteraction':
						internalState.surface.cancelInteraction();
						break;
					default:
						throw new Error(
							// eslint-disable-next-line @typescript-eslint/no-explicit-any
							`Unhandled RuntimeInteractionAction type: ${String((action as any).type)}`
						);
				}
			}

			transmitTransientInput(internalState, context);
		}
	};
}
