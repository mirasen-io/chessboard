import { ScenePointerEvent } from '../../../extensions/types/basic/events.js';
import { ScenePoint } from '../../../extensions/types/basic/transient-visuals.js';
import { Rect, SceneRenderGeometry } from '../../../layout/geometry/types.js';
import { ColorCode, Square } from '../../../state/board/types/internal.js';
import { InputAdapterInternal } from './types.js';

export function makeScenePointerEvent(
	state: InputAdapterInternal,
	e: PointerEvent
): ScenePointerEvent {
	const containerRect = state.container.getBoundingClientRect();
	const sceneRect = makeSceneRectFromDOMRect(containerRect);
	const point = toScenePoint(e, containerRect);
	const clampedPoint = clampToSceneRect(point, sceneRect);
	let clampedToBoardPoint: ScenePoint | null = null;
	let targetSquare: Square | null = null;
	const geometry = state.getRenderGeometry();
	if (geometry) {
		const sceneBoardRect = geometry.boardRect;
		clampedToBoardPoint = clampToSceneRect(point, sceneBoardRect);
		targetSquare = mapScenePointToSquare(point, geometry);
	}
	return {
		// DOM part
		type: e.type as ScenePointerEvent['type'],
		// scene part
		point,
		clampedPoint,
		boardClampedPoint: clampedToBoardPoint,
		// board part
		targetSquare
	};
}

function toScenePoint(e: PointerEvent, inRect: DOMRect): ScenePoint {
	return {
		x: e.clientX - inRect.x,
		y: e.clientY - inRect.y
	};
}

function makeSceneRectFromDOMRect(domRect: DOMRect): Rect {
	return {
		x: 0,
		y: 0,
		width: domRect.width,
		height: domRect.height
	};
}

function clampToSceneRect(point: ScenePoint, boundRect: Rect): ScenePoint {
	// X cannot go below boundRect.x, cannot go above boundRect.x + boundRect.width
	// Y cannot go below boundRect.y, cannot go above boundRect.y + boundRect.height
	return {
		x: Math.max(boundRect.x, Math.min(point.x, boundRect.x + boundRect.width)),
		y: Math.max(boundRect.y, Math.min(point.y, boundRect.y + boundRect.height))
	};
}

function mapScenePointToSquare(point: ScenePoint, geometry: SceneRenderGeometry): Square | null {
	const { x, y } = point;
	if (!Number.isFinite(x) || !Number.isFinite(y)) return null;

	const orientation = geometry.orientation;
	const boardRect = geometry.boardRect;
	const boardSize = boardRect.width;
	const squareSize = geometry.squareSize;

	if (
		x < boardRect.x ||
		x >= boardRect.x + boardSize ||
		y < boardRect.y ||
		y >= boardRect.y + boardSize
	)
		return null;

	// Grid cell indices, each in [0, 7].
	const xIndex = Math.floor((x - boardRect.x) / squareSize);
	const yIndex = Math.floor((y - boardRect.y) / squareSize);

	if (xIndex < 0 || xIndex > 7 || yIndex < 0 || yIndex > 7) return null;

	// Invert the orientation mapping used by geometry.squareRect:
	//   white: xIndex = file,     yIndex = 7 - rank  →  file = xIndex,     rank = 7 - yIndex
	//   black: xIndex = 7 - file, yIndex = rank       →  file = 7 - xIndex, rank = yIndex
	const file = orientation === ColorCode.White ? xIndex : 7 - xIndex;
	const rank = orientation === ColorCode.White ? 7 - yIndex : yIndex;

	return (rank * 8 + file) as Square;
}
