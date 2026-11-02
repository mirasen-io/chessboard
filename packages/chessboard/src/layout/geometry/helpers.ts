import { Rect, RectSnapshot, Size, SizeSnapshot } from './types.js';

export function sceneRectsEqual(rect1: RectSnapshot | null, rect2: RectSnapshot | null): boolean {
	if (rect1 === null && rect2 === null) {
		return true;
	}
	if (rect1 === null || rect2 === null) {
		return false;
	}
	return (
		rect1.x === rect2.x &&
		rect1.y === rect2.y &&
		rect1.width === rect2.width &&
		rect1.height === rect2.height
	);
}

export function sceneSizesEqual(size1: SizeSnapshot | null, size2: SizeSnapshot | null): boolean {
	if (size1 === null && size2 === null) {
		return true;
	}
	if (size1 === null || size2 === null) {
		return false;
	}
	return size1.width === size2.width && size1.height === size2.height;
}

export function measureBoardSize(sceneSize: Size): number {
	return Math.min(sceneSize.width, sceneSize.height);
}

export function makeBoardRect(sceneSize: Size): Rect {
	const boardSize = measureBoardSize(sceneSize);
	return {
		x: (sceneSize.width - boardSize) / 2,
		y: (sceneSize.height - boardSize) / 2,
		width: boardSize,
		height: boardSize
	};
}
