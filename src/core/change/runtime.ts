import { getBoardStateSnapshot } from '../state/boardState';
import type { BoardStateInternal, BoardStateSnapshot } from '../state/boardTypes';
import { getInteractionStateSnapshot } from '../state/interactionState';
import type { InteractionStateInternal, InteractionStateSnapshot } from '../state/interactionTypes';
import { getViewStateSnapshot } from '../state/viewState';
import type { ViewStateInternal, ViewStateSnapshot } from '../state/viewTypes';
import { createPipeline } from './pipeline';
import type { Pipeline } from './types';

interface BoardRuntimePipelineCtxPrev {
	readonly board: BoardStateSnapshot;
	readonly view: ViewStateSnapshot;
	readonly interaction: InteractionStateSnapshot;
}

interface BoardRuntimePipelineCtxCurrent {
	readonly board: BoardStateInternal;
	readonly view: ViewStateInternal;
	readonly interaction: InteractionStateInternal;
}

export interface BoardRuntimePipelineContext {
	previousSnapshot: BoardRuntimePipelineCtxPrev | null;
	currentState: BoardRuntimePipelineCtxCurrent;
}

export function createBoardRuntimePipeline(): Pipeline<BoardRuntimePipelineCtxCurrent> {
	let previousSnapshot: BoardRuntimePipelineCtxPrev | null = null;
	const basicPipeline = createPipeline<BoardRuntimePipelineContext>([
		// TODO: Add pipes here as needed, e.g.:
	]);
	return {
		addMutation: basicPipeline.addMutation,

		run(state: BoardRuntimePipelineCtxCurrent) {
			const ctx: BoardRuntimePipelineContext = {
				previousSnapshot,
				currentState: state
			};
			let didRun = false;
			try {
				didRun = basicPipeline.run(ctx);
			} finally {
				if (didRun) {
					previousSnapshot = {
						board: getBoardStateSnapshot(state.board),
						view: getViewStateSnapshot(state.view),
						interaction: getInteractionStateSnapshot(state.interaction)
					};
				}
			}
			return didRun;
		}
	};
}
