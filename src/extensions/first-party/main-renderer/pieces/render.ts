import { createSvgElement, updateElementAttributes } from '../../../../render/svg/helpers';
import { isNonEmptyPieceCode } from '../../../../state/board/check';
import { Square, SQUARE_COUNT } from '../../../../state/board/types/internal';
import { ExtensionRenderContext } from '../../../types/context/render';
import { DirtyLayer } from '../types/extension';
import { MainRendererPiecesInternal } from './types';

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
			const r = geometry.squareRect(sq);

			if (existing !== null) {
				updateElementAttributes(existing.root, {
					x: r.x.toString(),
					y: r.y.toString(),
					width: r.size.toString(),
					height: r.size.toString(),
					href: url
				});
			} else {
				state.pieceNodes.set(sq, {
					root: createSvgElement(layer, 'image', {
						'data-chessboard-id': `piece-${pieceCode}-${sq}`,
						href: url,
						x: r.x.toString(),
						y: r.y.toString(),
						width: r.size.toString(),
						height: r.size.toString()
					})
				});
			}
		} else if (existing !== null) {
			layer.removeChild(existing.root);
			state.pieceNodes.delete(sq);
		}
	}
}
