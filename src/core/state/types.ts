import type { ReadonlyDeep } from 'type-fest';
import type { BoardState, BoardStateInitOptions } from '../state/board/types';
import type { InteractionState } from '../state/interaction/types';
import type { ViewState, ViewStateInitOptions } from '../state/view/types';
import type { ChangeState } from './change/types';

export interface BoardRuntimeStateStateInternal {
	readonly board: BoardState;
	readonly view: ViewState;
	readonly interaction: InteractionState;
	readonly change: ChangeState;
}

export type BoardRuntimeStateStateSnapshot = ReadonlyDeep<BoardRuntimeStateStateInternal>;

export interface BoardRuntimeStateInitOptions {
	board?: BoardStateInitOptions;
	view?: ViewStateInitOptions;
}
