import { Square } from '../../../state/board/types/internal';

export interface ScenePoint {
	readonly x: number;
	readonly y: number;
}

export interface TransientInput {
	target: Square | null;
	rawPoint: ScenePoint;
	clampedPoint: ScenePoint;
}
