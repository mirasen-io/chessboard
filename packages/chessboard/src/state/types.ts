import { PositionInput } from './board/types/input.js';
import { BoardState, BoardStateSnapshot } from './board/types/main.js';
import type { ChangeState, ChangeStateSnapshot } from './change/types/main.js';
import {
	InteractionState,
	InteractionStateInitOptions,
	InteractionStateSnapshot
} from './interaction/types/main.js';
import { ViewStateSnapshot } from './view/types/internal.js';
import { ViewState, ViewStateInitOptions } from './view/types/main.js';

export interface RuntimeStateInternal {
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
	board?: PositionInput;
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
