import { MainRendererBoard } from '../board/types';
import { MainRendererCoordinates } from '../coordinates/types';
import { MainRendererSlotRoots } from './extension';

export interface MainRendererInstanceInternal {
	board: MainRendererBoard;
	coordinates: MainRendererCoordinates;
	slotRoots: MainRendererSlotRoots | null;
}
