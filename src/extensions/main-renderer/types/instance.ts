import { MainRendererBoard } from '../board/types';
import { MainRendererCoordinates } from '../coordinates/types';
import { MainRendererPieces } from '../pieces/types';
import { MainRendererSlotRoots } from './extension';

export interface MainRendererInstanceInternal {
	board: MainRendererBoard;
	coordinates: MainRendererCoordinates;
	pieces: MainRendererPieces;
	slotRoots: MainRendererSlotRoots | null;
}
