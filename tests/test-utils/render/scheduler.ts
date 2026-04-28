import { vi, type Mock } from 'vitest';

export interface RafStub {
	/** Captured RAF callbacks keyed by handle id. */
	callbacks: Map<number, FrameRequestCallback>;
	/** The stub for requestAnimationFrame. */
	raf: Mock;
	/** The stub for cancelAnimationFrame. */
	caf: Mock;
	/** Fire all pending RAF callbacks with the given timestamp (default 16). */
	flush(timestamp?: number): void;
	/** Install stubs on globalThis. */
	install(): void;
	/** Restore original globals. */
	restore(): void;
}

/**
 * Creates manual RAF/CAF stubs for deterministic scheduler testing.
 */
export function createRafStub(): RafStub {
	let nextHandle = 1;
	const callbacks = new Map<number, FrameRequestCallback>();

	const raf = vi.fn((cb: FrameRequestCallback): number => {
		const handle = nextHandle++;
		callbacks.set(handle, cb);
		return handle;
	});

	const caf = vi.fn((handle: number): void => {
		callbacks.delete(handle);
	});

	return {
		callbacks,
		raf,
		caf,
		flush(timestamp = 16) {
			// Snapshot current callbacks so callbacks added during flush don't fire in same pass
			const pending = [...callbacks.entries()];
			callbacks.clear();
			for (const [, cb] of pending) {
				cb(timestamp);
			}
		},
		install() {
			vi.stubGlobal('requestAnimationFrame', raf);
			vi.stubGlobal('cancelAnimationFrame', caf);
		},
		restore() {
			vi.unstubAllGlobals();
		}
	};
}
