import { PieceUrls } from '../types/internal.js';
import { rendererPiecesRender } from './render.js';
import { MainRendererPieces, MainRendererPiecesInternal } from './types.js';
import { rendererPiecesOnUpdate, rendererPiecesRefreshSuppressedSquares } from './update.js';

export function createMainRendererPieces(config: PieceUrls): MainRendererPieces {
	const state: MainRendererPiecesInternal = {
		config,
		pieceNodes: new Map(),
		suppressedSquares: new Set()
	};
	return {
		onUpdate(context, animationSuppressedSquares) {
			rendererPiecesOnUpdate(state, context, animationSuppressedSquares);
		},
		refreshSuppressedSquares(context, animationSuppressedSquares) {
			rendererPiecesRefreshSuppressedSquares(state, context, animationSuppressedSquares);
		},
		render(context, layer) {
			rendererPiecesRender(state, context, layer);
		},
		unmount() {
			for (const nodeRecord of state.pieceNodes.values()) {
				nodeRecord.root.remove();
			}
			state.pieceNodes.clear();
			state.suppressedSquares = new Set();
		}
	};
}
