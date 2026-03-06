import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { OverlayView } from '../../../src/core/input/types';
import type { Invalidation } from '../../../src/core/renderer/types';
import { createScheduler, type RenderCallback } from '../../../src/core/scheduler/scheduler';
import type { StateSnapshot } from '../../../src/core/state/types';
import { DirtyLayer } from '../../../src/core/state/types';

describe('scheduler/scheduler', () => {
	let renders: Array<{
		snapshot: StateSnapshot;
		invalidation: Invalidation;
		overlay?: OverlayView;
	}>;
	let cleared: number;

	const fakeSnapshot = {} as unknown as StateSnapshot;
	const fakeInvalidation = (): Invalidation => ({ layers: DirtyLayer.Pieces, squares: new Set() });
	const fakeOverlay: OverlayView = { hover: -1 };

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
			getOverlay: () => undefined,
			timing: 'microtask'
		});
	});

	afterEach(() => {
		scheduler.destroy();
	});

	it('coalesces multiple schedule() calls into a single microtask render', async () => {
		scheduler.schedule();
		scheduler.schedule();
		scheduler.schedule();

		// wait for microtask tick
		await Promise.resolve();

		expect(renders.length).toBe(1);
		expect(cleared).toBe(1);
	});

	it('flushNow performs immediate render and clears dirty once', async () => {
		scheduler.schedule();
		scheduler.flushNow();

		expect(renders.length).toBe(1);
		expect(cleared).toBe(1);

		// ensure no extra render occurs on the next microtask tick
		await Promise.resolve();
		expect(renders.length).toBe(1);
		expect(cleared).toBe(1);
	});

	it('passes overlay from getOverlay to render', async () => {
		// Recreate scheduler with overlay provider
		scheduler.destroy();
		scheduler = createScheduler({
			render,
			getSnapshot: () => fakeSnapshot,
			getInvalidation: () => fakeInvalidation(),
			clearDirty: () => {
				cleared++;
			},
			getOverlay: () => fakeOverlay,
			timing: 'microtask'
		});

		scheduler.schedule();
		await Promise.resolve();

		expect(renders.length).toBe(1);
		expect(renders[0].overlay).toBe(fakeOverlay);
	});

	it('timing: raf falls back to microtask if requestAnimationFrame is unavailable', async () => {
		// Temporarily remove rAF if present
		const originalRaf = globalThis.requestAnimationFrame;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(globalThis as any).requestAnimationFrame = undefined;

		try {
			scheduler.destroy();
			scheduler = createScheduler({
				render,
				getSnapshot: () => fakeSnapshot,
				getInvalidation: () => fakeInvalidation(),
				clearDirty: () => {
					cleared++;
				},
				getOverlay: () => undefined,
				timing: 'raf'
			});

			scheduler.schedule();
			await Promise.resolve();

			expect(renders.length).toBe(1);
			expect(cleared).toBe(1);
		} finally {
			// Restore rAF
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(globalThis as any).requestAnimationFrame = originalRaf;
		}
	});
});
