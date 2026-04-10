import type { BoardState, BoardStateInitOptions, BoardStateSnapshot } from '../state/board/types';
import type {
	InteractionState,
	InteractionStateInitOptions,
	InteractionStateSnapshot
} from '../state/interaction/types';
import type { ViewState, ViewStateInitOptions, ViewStateSnapshot } from '../state/view/types';
import type { ChangeState, ChangeStateSnapshot } from './change/types';

export interface RuntimeStateInternal {
	// TODO: rename to Runtime to Runtime
	readonly board: BoardState;
	readonly view: ViewState;
	readonly interaction: InteractionState;
	readonly change: ChangeState;
}

export interface RuntimeStateSnapshot {
	readonly board: BoardStateSnapshot;
	readonly view: ViewStateSnapshot;
	readonly interaction: InteractionStateSnapshot;
	readonly change: ChangeStateSnapshot;
}

export interface RuntimeStateInitOptions {
	board?: BoardStateInitOptions;
	view?: ViewStateInitOptions;
	interaction?: InteractionStateInitOptions;
}

export interface RuntimeState {
	readonly board: BoardState;
	readonly view: ViewState;
	readonly interaction: InteractionState;
	readonly change: ChangeState;
	getSnapshot(): RuntimeStateSnapshot;
}
