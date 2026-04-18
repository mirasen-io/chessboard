import { ExtensionRuntimeSurface } from '../../../types/surface/main';
import { ExtensionInternal } from '../../common/types';
import { MainRendererAnimation } from '../animation/types';
import { MainRendererBoard } from '../board/types';
import { MainRendererCoordinates } from '../coordinates/types';
import { MainRendererDrag } from '../drag/types';
import { MainRendererPieces } from '../pieces/types';
import { ExtensionSlotsType } from './extension';

export interface MainRendererInstanceInternal extends ExtensionInternal<ExtensionSlotsType> {
	readonly board: MainRendererBoard;
	readonly coordinates: MainRendererCoordinates;
	readonly pieces: MainRendererPieces;
	readonly drag: MainRendererDrag;
	readonly animation: MainRendererAnimation;
	readonly runtimeSurface: ExtensionRuntimeSurface;
}
