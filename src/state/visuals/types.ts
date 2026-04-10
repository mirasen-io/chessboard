import { ReadonlyDeep } from 'type-fest';
import { VisualsStateMutationSession } from './mutation';

export interface BoardPoint {
	x: number;
	y: number;
}

export type BoardPointSnapshot = ReadonlyDeep<BoardPoint>;

export interface VisualsStateInternal {
	dragPointer: BoardPointSnapshot | null;
}

export type VisualsStateSnapshot = ReadonlyDeep<VisualsStateInternal>;

export interface VisualsState {
	getDragPointer(): BoardPointSnapshot | null;
	setDragPointer(
		point: BoardPointSnapshot | null,
		mutationSession: VisualsStateMutationSession
	): boolean;
	getSnapshot(): VisualsStateSnapshot;
}
