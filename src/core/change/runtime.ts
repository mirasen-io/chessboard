import type { ReadonlyDeep } from 'type-fest';
import type { TransientVisualsMutationCause } from '../renderer/types';
import type { InvalidationWriter } from '../scheduler/types';
import type { BoardMutationCause } from '../state/boardReducers';
import { getBoardStateSnapshot } from '../state/boardState';
import type { BoardStateInternal, BoardStateSnapshot, Move } from '../state/boardTypes';
import type { InteractionMutationCause } from '../state/interactionReducers';
import { getInteractionStateSnapshot } from '../state/interactionState';
import type { InteractionStateInternal, InteractionStateSnapshot } from '../state/interactionTypes';
import { getViewStateSnapshot } from '../state/viewState';
import type { ViewStateInternal, ViewStateSnapshot } from '../state/viewTypes';
import { createPipeline } from './pipeline';
import type { Pipe, Pipeline } from './types';

interface BoardRuntimeStateChangeContextPrevious {
	readonly board: BoardStateSnapshot;
	readonly view: ViewStateSnapshot;
	readonly interaction: InteractionStateSnapshot;
	readonly lastMove: ReadonlyDeep<Move> | null;
	readonly layoutVersion: number;
}

export interface BoardRuntimeStateChangeContextCurrent {
	readonly board: BoardStateInternal;
	readonly view: ViewStateInternal;
	readonly interaction: InteractionStateInternal;
	readonly lastMove: Readonly<Move> | null;
	readonly layoutVersion: number;
	readonly writer: InvalidationWriter;
}

export interface BoardRuntimeStateChangeContext {
	readonly previousContext: BoardRuntimeStateChangeContextPrevious | null;
	readonly currentContext: BoardRuntimeStateChangeContextCurrent;
}

export type BoardRuntimeMutationCause =
	| BoardMutationCause
	| InteractionMutationCause
	| TransientVisualsMutationCause
	| 'boardRuntime.reducer.setLastMove';

export function createBoardRuntimeStateChangePipeline(
	pipes: readonly Pipe<BoardRuntimeStateChangeContext, BoardRuntimeMutationCause>[]
): Pipeline<BoardRuntimeStateChangeContextCurrent, BoardRuntimeMutationCause> {
	let previousContext: BoardRuntimeStateChangeContextPrevious | null = null;
	const basicPipeline = createPipeline<BoardRuntimeStateChangeContext, BoardRuntimeMutationCause>(
		pipes
	);
	return {
		addMutation: basicPipeline.addMutation,

		run(currentContext: BoardRuntimeStateChangeContextCurrent) {
			const pipelineContext: BoardRuntimeStateChangeContext = {
				previousContext,
				currentContext
			};
			let didRun = false;
			try {
				didRun = basicPipeline.run(pipelineContext);
			} finally {
				if (didRun) {
					previousContext = {
						board: getBoardStateSnapshot(currentContext.board),
						view: getViewStateSnapshot(currentContext.view),
						interaction: getInteractionStateSnapshot(currentContext.interaction),
						lastMove: currentContext.lastMove ? { ...currentContext.lastMove } : null,
						layoutVersion: currentContext.layoutVersion
					};
				}
			}
			return didRun;
		}
	};
}
