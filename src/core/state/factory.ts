import { createBoardState } from './board/factory';
import { createChangeState } from './change/factory';
import { createInteractionState } from './interaction/factory';
import type { BoardRuntimeStateInitOptions, BoardRuntimeStateStateInternal } from './types';
import { createViewState } from './view/factory';

export function createBoardRuntimeStateStateInternal(
	options: BoardRuntimeStateInitOptions = {}
): BoardRuntimeStateStateInternal {
	return {
		board: createBoardState(options.board),
		view: createViewState(options.view),
		interaction: createInteractionState(),
		change: createChangeState()
	};
}
