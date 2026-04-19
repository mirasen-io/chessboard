import { ExtensionRenderTransientVisualsContext } from '../../../types/context/transient-visuals.js';
import { ExtensionUpdateContext } from '../../../types/context/update.js';
import { ExtensionRuntimeSurface } from '../../../types/surface/main.js';
import { PieceUrls } from '../types/internal.js';

export interface MainRendererDragInternal {
	readonly config: PieceUrls;
	readonly runtimeSurface: ExtensionRuntimeSurface;
	isDragActive: boolean;
	pieceUrl: string | null;
	pieceNode: SVGImageElement | null;
}

export interface MainRendererDrag {
	onUpdate(context: ExtensionUpdateContext): void;
	renderTransientVisuals(context: ExtensionRenderTransientVisualsContext, layer: SVGElement): void;
	unmount(): void;
}
