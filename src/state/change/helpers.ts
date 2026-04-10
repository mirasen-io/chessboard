import type { MoveBaseSnapshot, MoveSnapshot } from '../board/types';

function baseMovesEqual(moveA: MoveBaseSnapshot, moveB: MoveBaseSnapshot): boolean {
	const diffs: boolean[] = [
		moveA.from !== moveB.from,
		moveA.to !== moveB.to,
		moveA.moved.color !== moveB.moved.color,
		moveA.moved.role !== moveB.moved.role
	];
	return !diffs.some(Boolean);
}

export function movesEqual(moveA: MoveSnapshot | null, moveB: MoveSnapshot | null): boolean {
	if (moveA === null && moveB === null) {
		return true;
	}
	if (moveA === null || moveB === null) {
		return false;
	}
	if (!baseMovesEqual(moveA, moveB)) {
		return false;
	}
	const diffs: boolean[] = [
		moveA.promotion !== moveB.promotion,
		moveA.captured?.color !== moveB.captured?.color,
		moveA.captured?.role !== moveB.captured?.role,
		moveA.capturedSquare !== moveB.capturedSquare
	];
	if (diffs.some(Boolean)) {
		return false;
	}
	// Now check secondary moves
	if (moveA.secondary === undefined && moveB.secondary === undefined) {
		return true;
	}
	if (moveA.secondary === undefined || moveB.secondary === undefined) {
		return false;
	}
	return movesEqual(moveA.secondary, moveB.secondary);
}
