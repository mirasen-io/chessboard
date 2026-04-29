import { denormalizeMove } from '../../../state/board/denormalize.js';
import { extensionCreateInternalBase } from '../common/helpers.js';
import {
	BoardEventsDefinition,
	BoardEventsInstance,
	BoardEventsInstanceInternal,
	BoardEventsPublic,
	EXTENSION_ID,
	EXTENSION_SLOTS,
	ExtensionSlotsType
} from './types.js';

export function createBoardEvents(): BoardEventsDefinition {
	return {
		id: EXTENSION_ID,
		slots: EXTENSION_SLOTS,
		createInstance() {
			return createBoardEventsInstance();
		}
	};
}

function createBoardEventsInternal(): BoardEventsInstanceInternal {
	return {
		...extensionCreateInternalBase<ExtensionSlotsType>(),
		onUIMove: null,
		onRawUpdate: null
	};
}

function createBoardEventsInstancePublic(state: BoardEventsInstanceInternal): BoardEventsPublic {
	return {
		setOnUIMove(callback) {
			state.onUIMove = callback;
		},
		setOnRawUpdate(callback) {
			state.onRawUpdate = callback;
		}
	};
}

function createBoardEventsInstance(): BoardEventsInstance {
	const internalState = createBoardEventsInternal();
	const publicInterface = createBoardEventsInstancePublic(internalState);
	return {
		id: EXTENSION_ID,
		onUpdate(context) {
			if (internalState.onRawUpdate) {
				internalState.onRawUpdate({
					previousFrame: context.previousFrame,
					mutation: context.mutation,
					currentFrame: context.currentFrame
				});
			}
			const lastMoveChanged = context.mutation.hasMutation({
				causes: ['state.change.setLastMove']
			});
			const interactionCompleted = context.mutation.hasMutation({
				causes: [
					'runtime.interaction.completeCoreDragTo',
					'runtime.interaction.completeExtensionDragTo',
					'runtime.interaction.resolveDeferredUIMoveRequest'
				]
			});

			if (interactionCompleted && lastMoveChanged && context.currentFrame.state.change.lastMove) {
				internalState.onUIMove?.(denormalizeMove(context.currentFrame.state.change.lastMove));
			}
		},
		getPublic() {
			return publicInterface;
		}
	};
}
