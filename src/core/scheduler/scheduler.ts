/**
 * Scheduler: rAF-only coalescing.
 * - Coalesces state mutations into a single render per animation frame.
 * - Requires requestAnimationFrame in the environment; use flushNow() if you need an immediate render without rAF (e.g., SSR/tests).
 */

import type { BoardStateSnapshot } from '../state/boardTypes';
import type { InvalidationStateSnapshot } from './types';

export type RenderCallback = (
	board: BoardStateSnapshot,
	invalidation: InvalidationStateSnapshot
) => void;

export interface SchedulerOptions {
	render: RenderCallback;
	getBoardSnapshot: () => BoardStateSnapshot;
	getInvalidationSnapshot: () => InvalidationStateSnapshot;
	clearDirty: () => void;
}

export interface Scheduler {
	/** Request a render; multiple calls before the next frame coalesce into one. */
	schedule(): void;
	/** Flush immediately (synchronous), useful for deterministic tests or SSR. */
	flushNow(): void;
	/** Cancel any pending frame and dispose resources. */
	destroy(): void;
}

export function createScheduler(opts: SchedulerOptions): Scheduler {
	const { render, getBoardSnapshot, getInvalidationSnapshot, clearDirty } = opts;

	let scheduled = false;
	let runId = 0;
	let rafHandle: number | null = null;

	const flushCore = () => {
		// Reset scheduled flags first to allow schedule() during render to queue the next frame.
		scheduled = false;
		if (rafHandle != null) {
			rafHandle = null;
		}

		// Build snapshot and invalidation payloads
		const boardSnapshot = getBoardSnapshot();
		const invalidationSnapshot = getInvalidationSnapshot();

		try {
			render(boardSnapshot, invalidationSnapshot);
		} finally {
			// Ensure dirty flags are cleared even if render throws
			clearDirty();
		}
	};

	return {
		schedule() {
			const raf = globalThis.requestAnimationFrame;
			if (scheduled || rafHandle != null) return;
			scheduled = true;
			const id = ++runId;
			rafHandle = raf(() => {
				if (id !== runId) return; // ignore stale callbacks invalidated by flushNow()
				flushCore();
			});
		},
		flushNow() {
			// Invalidate any pending rAF render immediately.
			if (scheduled) {
				runId++;
				scheduled = false;
			}
			if (rafHandle != null) {
				const caf = globalThis.cancelAnimationFrame;
				caf(rafHandle);
				rafHandle = null;
			}
			flushCore();
		},
		destroy() {
			scheduled = false;
			if (rafHandle != null) {
				const caf = globalThis.cancelAnimationFrame;
				caf(rafHandle);
			}
			rafHandle = null;
		}
	};
}
