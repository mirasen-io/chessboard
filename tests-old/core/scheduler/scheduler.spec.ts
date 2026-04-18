import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createScheduler, type RenderCallback } from '../../../src/core/scheduler/scheduler';
import type { InvalidationStateSnapshot } from '../../../src/core/scheduler/types';
import { DirtyLayer } from '../../../src/core/scheduler/types';
import type { BoardStateSnapshot } from '../../../src/core/state/boardTypes';

describe('scheduler/scheduler (rAF-only)', () => {
	let renders: Array<{
		board: BoardStateSnapshot;
		invalidation: InvalidationStateSnapshot;
	}>;
	let cleared: number;

	const fakeBoardSnapshot = {} as unknown as BoardStateSnapshot;
	const fakeInvalidation = (): InvalidationStateSnapshot => ({
		layers: DirtyLayer.Pieces,
		squares: new Set(),
		extensions: {}
	});

	let render: RenderCallback;
	let scheduler: ReturnType<typeof createScheduler>;

	beforeEach(() => {
		renders = [];
		cleared = 0;
		render = (board, invalidation) => {
			renders.push({ board, invalidation });
		};
		scheduler = createScheduler({
			render,
			getBoardSnapshot: () => fakeBoardSnapshot,
			getInvalidationSnapshot: () => fakeInvalidation(),
			clearDirty: () => {
				cleared++;
			}
		});
	});

	afterEach(() => {
		scheduler.destroy();
	});

	it('coalesces multiple schedule() calls into a single rAF render', async () => {
		// Polyfill rAF/cAF for Node
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

	it('flushNow passes board snapshot and invalidation snapshot to render', () => {
		scheduler.flushNow();

		expect(renders.length).toBe(1);
		expect(renders[0].board).toBe(fakeBoardSnapshot);
		expect(renders[0].invalidation.layers).toBe(DirtyLayer.Pieces);
	});

	it('destroy cancels pending rAF and prevents further renders', async () => {
		// Polyfill rAF/cAF for Node
		const originalRaf = globalThis.requestAnimationFrame;
		const originalCaf = globalThis.cancelAnimationFrame;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(globalThis as any).requestAnimationFrame = (cb: (t: number) => void): number =>
			setTimeout(() => cb(Date.now()), 0) as unknown as number;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(globalThis as any).cancelAnimationFrame = (h: number) => clearTimeout(h as unknown as number);

		try {
			scheduler.schedule();
			scheduler.destroy();

			await new Promise((r) => setTimeout(r, 0));

			// No render should have occurred after destroy
			expect(renders.length).toBe(0);
		} finally {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(globalThis as any).requestAnimationFrame = originalRaf;
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(globalThis as any).cancelAnimationFrame = originalCaf;
		}
	});
});
