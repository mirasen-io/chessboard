import { fileOf, rankOf } from '../../state/board/coords.js';
import { ColorCode } from '../../state/board/types/internal.js';
import { makeBoardRect, measureBoardSize } from './helpers.js';
import { SceneRenderGeometry, Size } from './types.js';

export function createRenderGeometry(sceneSize: Size, orientation: ColorCode): SceneRenderGeometry {
	if (
		!(
			sceneSize.height > 0 &&
			Number.isFinite(sceneSize.height) &&
			sceneSize.width > 0 &&
			Number.isFinite(sceneSize.width)
		)
	) {
		throw new RangeError(`Invalid sceneSize: ${JSON.stringify(sceneSize)}`);
	}
	const boardSize = measureBoardSize(sceneSize);
	const boardRect = makeBoardRect(sceneSize);
	const squareSize = boardSize / 8;
	const white = orientation === ColorCode.White;

	return {
		sceneSize: { ...sceneSize },
		boardRect,
		squareSize,
		orientation,
		getSquareRect(sq) {
			const f = fileOf(sq);
			const r = rankOf(sq);
			const xIndex = white ? f : 7 - f;
			const yIndex = white ? 7 - r : r;
			return {
				x: boardRect.x + xIndex * squareSize,
				y: boardRect.y + yIndex * squareSize,
				width: squareSize,
				height: squareSize
			};
		}
	};
}
