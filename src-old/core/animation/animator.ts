/**
 * Animator: Core animation lifecycle manager.
 * Phase 3.10: Owns RAF, timing, session lifecycle; does not derive plans.
 */

import type { AnimationPlan, AnimationSession } from './types';

export interface AnimatorOptions {
	schedule: () => void;
}

export interface Animator {
	start(plan: AnimationPlan): void;
	stop(): void;
	getActiveSession(): AnimationSession | null;
}

let nextSessionId = 1;

/**
 * Create an Animator instance.
 *
 * Responsibilities:
 * - Accept explicit AnimationPlan from runtime.
 * - Own RAF loop and session timing.
 * - Call schedule() each frame while active.
 * - Auto-stop when session completes.
 *
 * Does NOT:
 * - Derive plans by observing board snapshots.
 * - Own renderer or DOM.
 *
 * @param opts - Animator options with schedule callback.
 * @returns Animator instance.
 */
export function createAnimator(opts: AnimatorOptions): Animator {
	const { schedule } = opts;

	let activeSession: AnimationSession | null = null;
	let rafHandle: number | null = null;

	function stopInternal(): void {
		if (rafHandle !== null) {
			cancelAnimationFrame(rafHandle);
			rafHandle = null;
		}
		activeSession = null;
	}

	function step(now: number): void {
		if (!activeSession) return;

		const elapsed = now - activeSession.startTime;

		// Check if complete
		if (elapsed >= activeSession.duration) {
			stopInternal();
			// Request final render for cleanup (session now null)
			schedule();
			return;
		}

		// Schedule next frame
		schedule();
		rafHandle = requestAnimationFrame(step);
	}

	return {
		start(plan: AnimationPlan): void {
			// Stop any existing session first
			if (activeSession) {
				stopInternal();
			}

			// Create new session with runtime timing
			activeSession = {
				id: nextSessionId++,
				tracks: plan.tracks,
				startTime: performance.now(),
				duration: plan.duration
			};

			// Start RAF loop
			rafHandle = requestAnimationFrame(step);
		},

		stop(): void {
			stopInternal();
		},

		getActiveSession(): AnimationSession | null {
			return activeSession;
		}
	};
}
