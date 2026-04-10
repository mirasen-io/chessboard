import { createBoardState } from './board/factory';
import { createChangeState } from './change/factory';
import { createInteractionState } from './interaction/factory';
import type { RuntimeState, RuntimeStateInitOptions, RuntimeStateInternal } from './types';
import { createViewState } from './view/factory';

function createRuntimeStateInternal(options: RuntimeStateInitOptions): RuntimeStateInternal {
	return {
		board: createBoardState(options.board ?? {}),
		view: createViewState(options.view ?? {}),
		interaction: createInteractionState(),
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
