import { ExtensionRuntimeSurface } from '../../../types/surface/main.js';
import { PieceUrls } from '../types/internal.js';
import { rendererDragRenderTransientVisuals } from './render.js';
import { MainRendererDrag, MainRendererDragInternal } from './types.js';
import { rendererDragOnUpdate } from './update.js';

function createMainRendererDragInternal(
	config: PieceUrls,
	runtimeSurface: ExtensionRuntimeSurface
): MainRendererDragInternal {
	return { config, runtimeSurface, isDragActive: false, pieceUrl: null, pieceNode: null };
}

export function createMainRendererDrag(
	config: PieceUrls,
	runtimeSurface: ExtensionRuntimeSurface
): MainRendererDrag {
	const internalState = createMainRendererDragInternal(config, runtimeSurface);
	return {
		onUpdate(context) {
			rendererDragOnUpdate(internalState, context);
		},
		renderTransientVisuals(context, layer) {
			rendererDragRenderTransientVisuals(internalState, context, layer);
		},
		unmount() {
			internalState.pieceNode?.remove();
			internalState.pieceNode = null;
			internalState.pieceUrl = null;
			internalState.isDragActive = false;
			internalState.runtimeSurface.transientVisuals.unsubscribe();
		}
	};
}
