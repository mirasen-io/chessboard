import { createBoardState } from './board/factory.js';
import { createChangeState } from './change/factory/main.js';
import { createInteractionState } from './interaction/factory.js';
import type { RuntimeState, RuntimeStateInitOptions, RuntimeStateInternal } from './types.js';
import { createViewState } from './view/factory.js';

function createRuntimeStateInternal(options: RuntimeStateInitOptions): RuntimeStateInternal {
	return {
		board: createBoardState(options.board ?? {}),
		view: createViewState(options.view ?? {}),
		interaction: createInteractionState(options.interaction ?? {}),
		change: createChangeState()
	};
}

export function createRuntimeState(options: RuntimeStateInitOptions): RuntimeState {
	const internalState = createRuntimeStateInternal(options);
	return {
		...internalState,
		getSnapshot: () => ({
			board: internalState.board.getSnapshot(),
			view: internalState.view.getSnapshot(),
			interaction: internalState.interaction.getSnapshot(),
			change: internalState.change.getSnapshot()
		})
	};
}
