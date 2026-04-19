import { Scheduler, SchedulerOptions } from './types.js';

export function createScheduler(opts: SchedulerOptions): Scheduler {
	const { render } = opts;

	let scheduled = false;
	let runId = 0;
	let rafHandle: number | null = null;

	const flushCore = () => {
		if (!scheduled && rafHandle == null) {
			// Maybe was cancelled after the rAF callback was scheduled but before it fired.
			return;
		}
		// Reset scheduled flags first to allow schedule() during render to queue the next frame.
		scheduled = false;
		if (rafHandle != null) {
			rafHandle = null;
		}

		render();
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
		cancel() {
			scheduled = false;
			if (rafHandle != null) {
				const caf = globalThis.cancelAnimationFrame;
				caf(rafHandle);
			}
			rafHandle = null;
		}
	};
}
