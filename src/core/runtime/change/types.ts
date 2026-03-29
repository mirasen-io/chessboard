import type { ReadonlyDeep } from 'type-fest';
import type { BoardStateSnapshot, Move } from '../../state/board/types';
import type { InteractionStateSnapshot } from '../../state/interaction/types';
import type { MutationPipe, MutationPipeline, MutationSession } from '../../state/mutation/types';
import type { ViewStateSnapshot } from '../../state/view/types';
import { BoardRuntimeStateInternal } from '../types';
import type { BoardRuntimeMutationCause } from './mutation';

export interface BoardRuntimeStateChangeContextPreviousStateChange {
	readonly lastMove: ReadonlyDeep<Move> | null;
}

export interface BoardRuntimeStateChangeContextPreviousState {
	readonly board: BoardStateSnapshot;
	readonly view: ViewStateSnapshot;
	readonly interaction: InteractionStateSnapshot;
	readonly change: BoardRuntimeStateChangeContextPreviousStateChange;
}

export interface BoardRuntimeStateChangeContextPreviousLayout {
	readonly layoutVersion: number;
}

export interface BoardRuntimeStateChangeContextPrevious {
	readonly state: BoardRuntimeStateChangeContextPreviousState;
	// readonly layout: BoardRuntimeStateChangeContextPreviousLayout;
}

export interface BoardRuntimeStateChangeContext {
	readonly previousContext: BoardRuntimeStateChangeContextPrevious | null;
	readonly currentContext: BoardRuntimeStateInternal;
}

export type BoardRuntimeMuitationPipe = MutationPipe<
	BoardRuntimeStateChangeContext,
	BoardRuntimeMutationCause
>;
export type BoardRuntimeMutationPipeline = MutationPipeline<
	BoardRuntimeStateInternal,
	BoardRuntimeMutationCause
>;

export type BoardRuntimeMutationSession = MutationSession<BoardRuntimeMutationCause>;
