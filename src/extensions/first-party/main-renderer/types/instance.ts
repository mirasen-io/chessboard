import { ExtensionRuntimeSurface } from '../../../types/surface/main.js';
import { ExtensionInternalBase } from '../../common/types.js';
import { MainRendererAnimation } from '../animation/types.js';
import { MainRendererBoard } from '../board/types.js';
import { MainRendererCoordinates } from '../coordinates/types.js';
import { MainRendererDrag } from '../drag/types.js';
import { MainRendererPieces } from '../pieces/types.js';
import { ExtensionSlotsType } from './extension.js';

export interface MainRendererInstanceInternal extends ExtensionInternalBase<ExtensionSlotsType> {
	readonly board: MainRendererBoard;
	readonly coordinates: MainRendererCoordinates;
	readonly pieces: MainRendererPieces;
	readonly drag: MainRendererDrag;
	readonly animation: MainRendererAnimation;
	readonly runtimeSurface: ExtensionRuntimeSurface;
}
