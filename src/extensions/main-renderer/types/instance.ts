import { ExtensionRuntimeSurface } from '../../types/surface/main';
import { MainRendererBoard } from '../board/types';
import { MainRendererCoordinates } from '../coordinates/types';
import { MainRendererDrag } from '../drag/types';
import { MainRendererPieces } from '../pieces/types';
import { MainRendererSlotRoots } from './extension';

export interface MainRendererInstanceInternal {
	readonly board: MainRendererBoard;
	readonly coordinates: MainRendererCoordinates;
	readonly pieces: MainRendererPieces;
	readonly drag: MainRendererDrag;
	readonly runtimeSurface: ExtensionRuntimeSurface;
	slotRoots: MainRendererSlotRoots | null;
}
