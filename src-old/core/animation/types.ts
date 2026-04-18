/**
 * Animation types for committed move animations.
 * Phase 3.10: Core animation architecture.
 */

import type { Square } from '../state/boardTypes';

/**
 * Animation effect vocabulary.
 * Only 'move' is implemented in Phase 3.10.
 */
export type AnimationEffect = 'move' | 'fade-in' | 'fade-out' | 'snap-out';

/**
 * Single animation track representing one piece's animation.
 * Used for both ordinary moves and castling (king + rook as separate tracks).
 */
export interface AnimationTrack {
	pieceId: number;
	fromSq: Square;
	toSq: Square;
	effect: AnimationEffect;
}

/**
 * Semantic animation plan computed on the commit path.
 * Contains no runtime timing; duration is session-level.
 */
export interface AnimationPlan {
	tracks: AnimationTrack[];
	duration: number;
}

/**
 * Active animation session with runtime timing.
 * Animator owns session lifecycle and provides this to renderer.
 */
export interface AnimationSession {
	id: number;
	tracks: AnimationTrack[];
	startTime: number; // performance.now() when started
	duration: number;
}
