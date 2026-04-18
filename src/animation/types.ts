import { ReadonlyDeep } from 'type-fest';
import type { NonEmptyPieceCode, Square } from '../state/board/types/internal';

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

export interface AnimationPlan {
	sessionId: number;
	tracks: AnimationTrack[];
}

export interface AnimationSession {
	id: number;
	tracks: AnimationTrack[];
	startTime: number; // performance.now() when started
	duration: number;
}

export type AnimationSessionSnapshot = ReadonlyDeep<AnimationSession>;

export interface AnimationTrackMoveExclude {
	fromSq: Square;
	toSq: Square;
}

export interface AnimationTrackSquareExclude {
	sq: Square;
}

export type AnimationTrackExclude = AnimationTrackMoveExclude | AnimationTrackSquareExclude;

export function isMoveExclude(e: AnimationTrackExclude): e is AnimationTrackMoveExclude {
	return 'fromSq' in e && 'toSq' in e;
}

export function isSquareExclude(e: AnimationTrackExclude): e is AnimationTrackSquareExclude {
	return 'sq' in e && !('fromSq' in e) && !('toSq' in e);
}

export interface CalculateAnimationTracksOptions {
	exclude?: AnimationTrackExclude[];
}
