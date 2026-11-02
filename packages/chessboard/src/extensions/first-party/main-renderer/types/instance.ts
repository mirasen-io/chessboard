import type { ExtensionRuntimeSurface } from '../../../types/surface/main.js';
import type { ExtensionInternalBase } from '../../common/types.js';
import type { MainRendererAnimation } from '../animation/types.js';
import type { MainRendererBoard } from '../board/types.js';
import type { MainRendererCoordinates } from '../coordinates/types.js';
import type { MainRendererDrag } from '../drag/types.js';
import type { PieceSymbolResolver } from '../piece-symbols.js';
import type { MainRendererPieces } from '../pieces/types.js';
import type { ExtensionSlotsType } from './extension.js';
import type { MainRendererConfig } from './internal.js';

export interface MainRendererInstanceInternal extends ExtensionInternalBase<ExtensionSlotsType> {
	readonly board: MainRendererBoard;
	readonly coordinates: MainRendererCoordinates;
	readonly pieces: MainRendererPieces;
	readonly drag: MainRendererDrag;
	readonly animation: MainRendererAnimation;
	readonly runtimeSurface: ExtensionRuntimeSurface;
	readonly pieceSymbolResolver: PieceSymbolResolver;
	config: MainRendererConfig;
}
