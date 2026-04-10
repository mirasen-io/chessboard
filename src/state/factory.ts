import { createBoardState } from './board/factory';
import { createChangeState } from './change/factory';
import { createInteractionState } from './interaction/factory';
import type {
	BoardRuntimeState,
	BoardRuntimeStateInitOptions,
	BoardRuntimeStateInternal
} from './types';
import { createViewState } from './view/factory';
import { createVisualsState } from './visuals/factory';

function createBoardRuntimeStateInternal(
	options: BoardRuntimeStateInitOptions
): BoardRuntimeStateInternal {
	return {
		board: createBoardState(options.board ?? {}),
		view: createViewState(options.view ?? {}),
		interaction: createInteractionState(),
		change: createChangeState(),
		visuals: createVisualsState()
	};
}

export function createBoardRuntimeState(options: BoardRuntimeStateInitOptions): BoardRuntimeState {
	const internalState = createBoardRuntimeStateInternal(options);
	return {
		...internalState,
		getSnapshot: () => ({
			board: internalState.board.getSnapshot(),
			view: internalState.view.getSnapshot(),
			interaction: internalState.interaction.getSnapshot(),
			change: internalState.change.getSnapshot(),
			visuals: internalState.visuals.getSnapshot()
		})
	};
}
