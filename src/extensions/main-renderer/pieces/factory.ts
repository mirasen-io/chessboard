import { ExtensionOnUpdateStateContext, ExtensionRenderStateContext } from '../../types';
import { PieceUrls } from '../types/config';
import { rendererPiecesRender } from './render';
import { MainRendererPieces, MainRendererPiecesInternal } from './types';
import { rendererPiecesOnUpdate } from './update';

export function createMainRendererPieces(config: PieceUrls): MainRendererPieces {
	const state: MainRendererPiecesInternal = {
		config,
		pieceNodes: new Map()
	};
	return {
		onUpdate(context: ExtensionOnUpdateStateContext): void {
			rendererPiecesOnUpdate(state, context);
		},
		render(context: ExtensionRenderStateContext, layer: SVGElement): void {
			rendererPiecesRender(state, context, layer);
		},
		unmount(): void {
			for (const nodeRecord of state.pieceNodes.values()) {
				nodeRecord.root.remove();
			}
			state.pieceNodes.clear();
		}
	};
}
