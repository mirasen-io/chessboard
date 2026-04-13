import { ReadonlyDeep } from 'type-fest';
import type { Piece, Square } from '../state/board/types';

export interface AnimationTrackMove {
	id: number;
	piece: Piece;
	fromSq: Square;
	toSq: Square;
	effect: 'move';
}

export interface AnimationTrackFade {
	id: number;
	piece: Piece;
	sq: Square;
	effect: 'fade-in' | 'fade-out';
}

export interface AnimationTrackStatic {
	id: number;
	piece: Piece;
	sq: Square;
	effect: 'static';
}

export type AnimationTrack = AnimationTrackMove | AnimationTrackFade | AnimationTrackStatic; // Extendable for other effects in the future

export interface AnimationPlan {
	tracks: AnimationTrack[];
	duration: number;
}

export interface AnimationSession {
	id: number;
	tracks: AnimationTrack[];
	startTime: number; // performance.now() when started
	duration: number;
}

export type AnimationSessionSnapshot = ReadonlyDeep<AnimationSession>;
