/**
 * Scheduler: coalesce state mutations into a single render per tick.
 * Default timing is microtask for test/Node determinism.
 * A rAF strategy can be added later without changing the external API.
 */

import type { OverlayView } from '../input/types';
import type { Invalidation } from '../renderer/types';
import type { StateSnapshot } from '../state/types';

export type RenderCallback = (
	snapshot: StateSnapshot,
	invalidation: Invalidation,
	overlay?: OverlayView
) => void;

export interface SchedulerOptions {
	render: RenderCallback;
	getSnapshot: () => StateSnapshot;
	getInvalidation: () => Invalidation;
	clearDirty: () => void;
	getOverlay?: () => OverlayView | undefined;
	timing?: 'microtask' | 'raf';
}

export interface Scheduler {
	/** Request a render; multiple calls in the same tick coalesce into one. */
	schedule(): void;
	/** Flush immediately (synchronous), useful for deterministic tests. */
	flushNow(): void;
	/** Cancel any pending task/frame and dispose resources. */
	destroy(): void;
}

export function createScheduler(opts: SchedulerOptions): Scheduler {
	const {
		render,
		getSnapshot,
		getInvalidation,
		clearDirty,
		getOverlay,
		timing = 'microtask'
	} = opts;

	let scheduled = false;
	let runId = 0;
	let microtaskHandle: Promise<void> | null = null;
	let rafHandle: number | null = null;

	const flushCore = () => {
		// Reset scheduled flags first to allow schedule() during render to queue next tick.
		scheduled = false;
		microtaskHandle = null;
		if (rafHandle != null) {
			// rAF invokes the callback only once; nothing to cancel here.
			rafHandle = null;
		}

		// Build snapshot and invalidation payloads
		const snapshot = getSnapshot();
		const invalidation = getInvalidation();
		const overlay = getOverlay?.();

		try {
			render(snapshot, invalidation, overlay);
		} finally {
			// Ensure dirty flags are cleared even if render throws
			clearDirty();
		}
	};

	const scheduleMicrotask = () => {
		if (microtaskHandle) return;
		scheduled = true;
		const id = ++runId;
		microtaskHandle = Promise.resolve().then(() => {
			if (id !== runId) return;
			flushCore();
		});
	};

	const scheduleRaf = () => {
		if (rafHandle != null) return;
		// Fallback to microtask if rAF not available
		const raf = globalThis?.requestAnimationFrame;
		if (raf) {
			scheduled = true;
			const id = ++runId;
			rafHandle = raf(() => {
				if (id !== runId) return;
				flushCore();
			});
		} else {
			scheduleMicrotask();
		}
	};

	return {
		schedule() {
			if (scheduled) return;
			if (timing === 'raf') scheduleRaf();
			else scheduleMicrotask();
		},
		flushNow() {
			// Invalidate any pending scheduled task and render immediately.
			if (scheduled) {
				runId++;
				scheduled = false;
			}
			if (microtaskHandle) microtaskHandle = null;
			if (rafHandle != null) rafHandle = null;
			flushCore();
		},
		destroy() {
			scheduled = false;
			microtaskHandle = null;
			// Canceling rAF if it was set: only possible if we stored a handle and have cancelAnimationFrame.
			if (rafHandle != null) {
				const caf =
					(typeof globalThis !== 'undefined' &&
						(globalThis as unknown as { cancelAnimationFrame?: (h: number) => void })
							.cancelAnimationFrame) ||
					null;
				if (caf) caf(rafHandle);
			}
			rafHandle = null;
		}
	};
}
