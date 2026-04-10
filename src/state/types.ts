import type { BoardState, BoardStateInitOptions, BoardStateSnapshot } from '../state/board/types';
import type { InteractionState, InteractionStateSnapshot } from '../state/interaction/types';
import type { ViewState, ViewStateInitOptions, ViewStateSnapshot } from '../state/view/types';
import type { ChangeState, ChangeStateSnapshot } from './change/types';
import type { VisualsState, VisualsStateSnapshot } from './visuals/types';

export interface BoardRuntimeStateInternal {
	readonly board: BoardState;
	readonly view: ViewState;
	readonly interaction: InteractionState;
	readonly change: ChangeState;
	readonly visuals: VisualsState;
}

export interface BoardRuntimeStateSnapshot {
	readonly board: BoardStateSnapshot;
	readonly view: ViewStateSnapshot;
	readonly interaction: InteractionStateSnapshot;
	readonly change: ChangeStateSnapshot;
	readonly visuals: VisualsStateSnapshot;
}

export interface BoardRuntimeStateInitOptions {
	board?: BoardStateInitOptions;
	view?: ViewStateInitOptions;
}

export interface BoardRuntimeState {
	readonly board: BoardState;
	readonly view: ViewState;
	readonly interaction: InteractionState;
	readonly change: ChangeState;
	readonly visuals: VisualsState;
	getSnapshot(): BoardRuntimeStateSnapshot;
}
