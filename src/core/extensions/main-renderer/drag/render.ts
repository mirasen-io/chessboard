import { decodePiece } from '../../../state/board/encode';
import { cburnettPieceUrl } from '../assets';
import { clearElementChildren, createSvgImage } from '../helpers';
import { DragRenderContext, SvgRendererDragInternals } from './types';

export function renderDrag(state: SvgRendererDragInternals, context: DragRenderContext): void {
	const { interaction, visuals, board, geometry } = context;
	const layer = state.root;
	clearElementChildren(layer);

	if (interaction.dragSession === null || visuals.dragPointer === null) {
		throw new Error('Invalid drag render context: missing drag session or drag pointer');
	}

	const sq = interaction.dragSession.fromSquare;
	const piece = decodePiece(board.pieces[sq]);
	if (!piece) {
		throw new Error(`Invalid drag render context: no piece found on fromSquare ${sq}`);
	}

	const pieceUrl = cburnettPieceUrl(piece.color, piece.role);
	const squareSize = geometry.squareSize;
	const x = visuals.dragPointer.x - squareSize / 2;
	const y = visuals.dragPointer.y - squareSize / 2;

	const img = createSvgImage(state.root.ownerDocument, {
		id: 'drag-piece',
		x: x.toString(),
		y: y.toString(),
		width: squareSize.toString(),
		height: squareSize.toString(),
		href: pieceUrl
	});

	layer.appendChild(img);
}
