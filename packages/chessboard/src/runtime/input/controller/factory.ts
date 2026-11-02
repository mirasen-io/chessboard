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
			} else if (context.rawEvent.type === 'dragstart') {
				// Prevent native drag-and-drop behavior to avoid conflicts with custom drag handling
				context.rawEvent.preventDefault();
			}

			if (action) {
				switch (action.type) {
					case 'startLiftedDragSession':
						internalState.surface.startLiftedDragSession(
							action.phase === 'pending'
								? {
										phase: 'pending',
										sourceSquare: action.sourceSquare,
										targetSquare: action.targetSquare,
										startButton: action.startButton,
										startPoint: action.startPoint,
										thresholdPx: action.thresholdPx
									}
								: {
										phase: 'active',
										sourceSquare: action.sourceSquare,
										targetSquare: action.targetSquare,
										startButton: action.startButton
									}
						);
						break;
					case 'activatePendingLiftedDragSession':
						internalState.surface.activatePendingLiftedDragSession({
							targetSquare: action.targetSquare
						});
						break;
					case 'startReleaseTargetingDragSession':
						internalState.surface.startReleaseTargetingDragSession({
							sourceSquare: action.sourceSquare,
							targetSquare: action.targetSquare,
							startButton: action.startButton
						});
						break;
					case 'completeCoreDragSessionTo':
						internalState.surface.completeCoreDragSessionTo(action.targetSquare);
						break;
					case 'completeExtensionDragSession':
						internalState.surface.completeExtensionDragSession(action.targetSquare);
						break;
					case 'updateDragSessionCurrentTarget':
						internalState.surface.updateDragSessionCurrentTarget(action.targetSquare);
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
