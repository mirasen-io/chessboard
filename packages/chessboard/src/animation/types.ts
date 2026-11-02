import { ReadonlyDeep } from 'type-fest';
import type { NonEmptyPieceCode, Square } from '../state/board/types/internal.js';
import { BoardStateSnapshot } from '../state/board/types/main.js';
import { ChangeStateSnapshot } from '../state/change/types/main.js';
import { InteractionStateSnapshot } from '../state/interaction/types/main.js';

export interface AnimationTrackMove {
	id: number;
	pieceCode: NonEmptyPieceCode;
	fromSq: Square;
	toSq: Square;
	effect: 'move';
}

export interface AnimationTrackFade {
	id: number;
	pieceCode: NonEmptyPieceCode;
	sq: Square;
	effect: 'fade-in' | 'fade-out';
}

export interface AnimationTrackStatic {
	id: number;
	pieceCode: NonEmptyPieceCode;
	sq: Square;
	effect: 'static';
}

export type AnimationTrack = AnimationTrackMove | AnimationTrackFade | AnimationTrackStatic; // Extendable for other effects in the future

export interface AnimationSession {
	id: number;
	plan: AnimationPlan;
	startTime: number; // performance.now() when started
	duration: number;
}

export type AnimationSessionSnapshot = ReadonlyDeep<AnimationSession>;

export interface AnimationPlanningInputSnapshot {
	readonly board: BoardStateSnapshot;
	readonly change: ChangeStateSnapshot;
	readonly interaction: InteractionStateSnapshot;
}

export interface AnimationPlanningSnapshot extends AnimationPlanningInputSnapshot {
	readonly lastMoveSource: 'state' | 'projected-deferred-ui-move';
}

export interface AnimationPlanningInput {
	previous: AnimationPlanningInputSnapshot;
	current: AnimationPlanningInputSnapshot;
}

export interface AnimationPlan {
	readonly tracks: readonly AnimationTrack[];
	readonly suppressedSquares: ReadonlySet<Square>;
}
