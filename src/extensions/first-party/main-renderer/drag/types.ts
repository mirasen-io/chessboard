import { ExtensionRenderTransientVisualsContext } from '../../../types/context/transient-visuals';
import { ExtensionUpdateContext } from '../../../types/context/update';
import { ExtensionRuntimeSurface } from '../../../types/surface/main';
import { PieceUrls } from '../types/internal';

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
