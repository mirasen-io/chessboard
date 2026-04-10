import { ReadonlyDeep } from 'type-fest';
import type { Square } from '../state/board/types';

export interface AnimationTrackMove {
	pieceCode: number;
	fromSq: Square;
	toSq: Square;
	effect: 'move';
}

export interface AnimationTrackFade {
	pieceCode: number;
	sq: Square;
	effect: 'fade-in' | 'fade-out' | 'snap-out';
}

export type AnimationTrack = AnimationTrackMove | AnimationTrackFade; // Extendable for other effects in the future

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
