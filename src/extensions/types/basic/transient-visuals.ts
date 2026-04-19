import { Square } from '../../../state/board/types/internal.js';

export interface ScenePoint {
	readonly x: number;
	readonly y: number;
}

export interface TransientInput {
	target: Square | null;
	point: ScenePoint;
	clampedPoint: ScenePoint;
	boardClampedPoint: ScenePoint;
}
