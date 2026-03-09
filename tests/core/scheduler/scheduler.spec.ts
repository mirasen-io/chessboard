import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { OverlayView } from '../../../src/core/input/types';
import type { Invalidation } from '../../../src/core/renderer/types';
import { createScheduler, type RenderCallback } from '../../../src/core/scheduler/scheduler';
import type { StateSnapshot } from '../../../src/core/state/types';
import { DirtyLayer } from '../../../src/core/state/types';

describe('scheduler/scheduler (rAF-only)', () => {
	let renders: Array<{
		snapshot: StateSnapshot;
		invalidation: Invalidation;
		overlay?: OverlayView;
	}>;
	let cleared: number;

	const fakeSnapshot = {} as unknown as StateSnapshot;
	const fakeInvalidation = (): Invalidation => ({ layers: DirtyLayer.Pieces, squares: new Set() });
	const fakeOverlay: OverlayView = { hover: null };

	let render: RenderCallback;
	let scheduler: ReturnType<typeof createScheduler>;

	beforeEach(() => {
		renders = [];
		cleared = 0;
		render = (snapshot, invalidation, overlay) => {
			renders.push({ snapshot, invalidation, overlay });
		};
		scheduler = createScheduler({
			render,
			getSnapshot: () => fakeSnapshot,
			getInvalidation: () => fakeInvalidation(),
			clearDirty: () => {
				cleared++;
			},
			getOverlay: () => undefined
		});
	});

	afterEach(() => {
		scheduler.destroy();
	});

	it('coalesces multiple schedule() calls into a single rAF render', async () => {
		// Polyfill rAF/c for Node
		const originalRaf = globalThis.requestAnimationFrame;
		const originalCaf = globalThis.cancelAnimationFrame;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(globalThis as any).requestAnimationFrame = (cb: (t: number) => void): number =>
			setTimeout(() => cb(Date.now()), 0) as unknown as number;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(globalThis as any).cancelAnimationFrame = (h: number) => clearTimeout(h as unknown as number);

		try {
			scheduler.schedule();
			scheduler.schedule();
			scheduler.schedule();

			// Wait for setTimeout(0) to fire our polyfilled rAF callback
			await new Promise((r) => setTimeout(r, 0));

			expect(renders.length).toBe(1);
			expect(cleared).toBe(1);
		} finally {
			// Restore rAF/cAF
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(globalThis as any).requestAnimationFrame = originalRaf;
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(globalThis as any).cancelAnimationFrame = originalCaf;
		}
	});

	it('flushNow performs immediate render and clears dirty once', async () => {
		// No rAF required for flushNow
		scheduler.flushNow();

		expect(renders.length).toBe(1);
		expect(cleared).toBe(1);

		// Ensure no extra render occurs asynchronously
		await new Promise((r) => setTimeout(r, 0));
		expect(renders.length).toBe(1);
		expect(cleared).toBe(1);
	});

	it('passes overlay from getOverlay to render', async () => {
		// Polyfill rAF/cAF for Node
		const originalRaf = globalThis.requestAnimationFrame;
		const originalCaf = globalThis.cancelAnimationFrame;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(globalThis as any).requestAnimationFrame = (cb: (t: number) => void): number =>
			setTimeout(() => cb(Date.now()), 0) as unknown as number;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(globalThis as any).cancelAnimationFrame = (h: number) => clearTimeout(h as unknown as number);

		try {
			// Recreate scheduler with overlay provider
			scheduler.destroy();
			scheduler = createScheduler({
				render,
				getSnapshot: () => fakeSnapshot,
				getInvalidation: () => fakeInvalidation(),
				clearDirty: () => {
					cleared++;
				},
				getOverlay: () => fakeOverlay
			});

			scheduler.schedule();
			await new Promise((r) => setTimeout(r, 0));

			expect(renders.length).toBe(1);
			expect(renders[0].overlay).toBe(fakeOverlay);
		} finally {
			// Restore rAF/cAF
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(globalThis as any).requestAnimationFrame = originalRaf;
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(globalThis as any).cancelAnimationFrame = originalCaf;
		}
	});

	it('schedule throws if requestAnimationFrame is unavailable', () => {
		const originalRaf = globalThis.requestAnimationFrame;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(globalThis as any).requestAnimationFrame = undefined;

		try {
			expect(() => scheduler.schedule()).toThrow(/requestAnimationFrame is required/);
		} finally {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(globalThis as any).requestAnimationFrame = originalRaf;
		}
	});
});
