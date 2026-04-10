import { createSvgElement, updateElementAttributes } from '../../../render/svg/helpers';
import { decodePiece } from '../../../state/board/encode';
import { Square } from '../../../state/board/types';
import { ExtensionRenderStateContext } from '../../types';
import { getPieceShortKey, getPieceUrl } from '../helpers';
import { DirtyLayer } from '../types/extension';
import { MainRendererPiecesInternal } from './types';

export function rendererPiecesRender(
	state: MainRendererPiecesInternal,
	context: ExtensionRenderStateContext,
	layer: SVGElement
): void {
	if ((context.invalidation.dirtyLayers & DirtyLayer.Pieces) === 0) {
		return;
	}
	const geometry = context.current.layout.geometry;
	const pieces = context.current.state.board.pieces;

	for (let sq = 0 as Square; sq < 64; sq++) {
		const piece = decodePiece(pieces[sq]);
		const existing = state.pieceNodes.get(sq) || null;

		if (piece !== null) {
			const key = getPieceShortKey(piece);
			const url = getPieceUrl(state.config, key);
			const r = geometry.squareRect(sq);

			if (existing !== null) {
				updateElementAttributes(existing.root, {
					'data-chessboard-piece-key': key,
					x: r.x.toString(),
					y: r.y.toString(),
					width: r.size.toString(),
					height: r.size.toString(),
					href: url
				});
			} else {
				state.pieceNodes.set(sq, {
					root: createSvgElement(layer, 'image', {
						'data-chessboard-id': `piece-${sq}`,
						'data-chessboard-piece-key': key,
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
