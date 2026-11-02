import type { PieceSymbolResolver } from '../piece-symbols.js';
import { rendererPiecesRender } from './render.js';
import { MainRendererPieces, MainRendererPiecesInternal } from './types.js';
import { rendererPiecesOnUpdate, rendererPiecesRefreshSuppressedSquares } from './update.js';

export function createMainRendererPieces(resolver: PieceSymbolResolver): MainRendererPieces {
	const state: MainRendererPiecesInternal = {
		resolver,
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
		render(context, slot) {
			rendererPiecesRender(state, context, slot);
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
