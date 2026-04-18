import { ScenePoint } from '../../../extensions/types/basic/transient-visuals';
import { RenderGeometry } from '../../../layout/geometry/types';
import { ColorCode, Square } from '../../../state/board/types/internal';

export function mapBoardPointToSquare(
	x: number,
	y: number,
	geometry: RenderGeometry
): Square | null {
	if (!Number.isFinite(x) || !Number.isFinite(y)) return null;

	const { boardSize, squareSize, orientation } = geometry;

	if (x < 0 || x >= boardSize || y < 0 || y >= boardSize) return null;

	// Grid cell indices, each in [0, 7].
	const xIndex = Math.floor(x / squareSize);
	const yIndex = Math.floor(y / squareSize);

	// Invert the orientation mapping used by geometry.squareRect:
	//   white: xIndex = file,     yIndex = 7 - rank  →  file = xIndex,     rank = 7 - yIndex
	//   black: xIndex = 7 - file, yIndex = rank       →  file = 7 - xIndex, rank = yIndex
	const file = orientation === ColorCode.White ? xIndex : 7 - xIndex;
	const rank = orientation === ColorCode.White ? 7 - yIndex : yIndex;

	return (rank * 8 + file) as Square;
}

export function clampBoardPoint(point: ScenePoint, geometry: RenderGeometry): ScenePoint {
	const { boardSize } = geometry;
	return {
		x: Math.min(Math.max(point.x, 0), boardSize),
		y: Math.min(Math.max(point.y, 0), boardSize)
	};
}
