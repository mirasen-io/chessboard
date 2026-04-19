import { createSvgElement, updateElementAttributes } from '../../../../render/svg/helpers.js';
import { isNonEmptyPieceCode } from '../../../../state/board/check.js';
import { Square, SQUARE_COUNT } from '../../../../state/board/types/internal.js';
import { ExtensionRenderContext } from '../../../types/context/render.js';
import { DirtyLayer } from '../types/extension.js';
import { MainRendererPiecesInternal } from './types.js';

export function rendererPiecesRender(
	state: MainRendererPiecesInternal,
	context: ExtensionRenderContext,
	layer: SVGElement
): void {
	if ((context.invalidation.dirtyLayers & DirtyLayer.Pieces) === 0) {
		return;
	}
	const geometry = context.currentFrame.layout.geometry;
	const pieces = context.currentFrame.state.board.pieces;

	for (let sq = 0 as Square; sq < SQUARE_COUNT; sq++) {
		const pieceCode = pieces[sq];
		const existing = state.pieceNodes.get(sq) || null;
		const suppressed = state.suppressedSquares.has(sq);

		if (isNonEmptyPieceCode(pieceCode) && !suppressed) {
			const url = state.config[pieceCode];
			const r = geometry.getSquareRect(sq);

			if (existing !== null) {
				updateElementAttributes(existing.root, {
					x: r.x.toString(),
					y: r.y.toString(),
					width: r.width.toString(),
					height: r.height.toString(),
					href: url
				});
			} else {
				state.pieceNodes.set(sq, {
					root: createSvgElement(layer, 'image', {
						'data-chessboard-id': `piece-${pieceCode}-${sq}`,
						href: url,
						x: r.x.toString(),
						y: r.y.toString(),
						width: r.width.toString(),
						height: r.height.toString()
					})
				});
			}
		} else if (existing !== null) {
			layer.removeChild(existing.root);
			state.pieceNodes.delete(sq);
		}
	}
}
