import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createScheduler } from '../../../src/render/scheduler/scheduler.js';
import type { Scheduler } from '../../../src/render/scheduler/types.js';
import { createRafStub, type RafStub } from '../../test-utils/render/scheduler.js';

describe('createScheduler', () => {
	let rafStub: RafStub;
	let renderSpy: ReturnType<typeof vi.fn<() => void>>;
	let scheduler: Scheduler;

	beforeEach(() => {
		rafStub = createRafStub();
		rafStub.install();
		renderSpy = vi.fn();
		scheduler = createScheduler({ render: renderSpy });
	});

	afterEach(() => {
		rafStub.restore();
	});

	describe('schedule', () => {
		it('requests one RAF', () => {
			scheduler.schedule();
			expect(rafStub.raf).toHaveBeenCalledOnce();
		});

		it('repeated calls before flush coalesce into one RAF', () => {
			scheduler.schedule();
			scheduler.schedule();
			scheduler.schedule();
			expect(rafStub.raf).toHaveBeenCalledOnce();
		});

		it('RAF flush invokes render once', () => {
			scheduler.schedule();
			rafStub.flush();
			expect(renderSpy).toHaveBeenCalledOnce();
		});

		it('schedule during render queues a new RAF', () => {
			renderSpy.mockImplementation(() => {
				scheduler.schedule();
			});
			scheduler.schedule();
			rafStub.flush();
			expect(renderSpy).toHaveBeenCalledOnce();
			expect(rafStub.raf).toHaveBeenCalledTimes(2);
		});

		it('does not invoke render synchronously on schedule', () => {
			scheduler.schedule();
			expect(renderSpy).not.toHaveBeenCalled();
		});
	});

	describe('cancel', () => {
		it('cancels a pending RAF', () => {
			scheduler.schedule();
			scheduler.cancel();
			expect(rafStub.caf).toHaveBeenCalledOnce();
		});

		it('with nothing scheduled is a no-op and does not throw', () => {
			expect(() => scheduler.cancel()).not.toThrow();
			expect(rafStub.caf).not.toHaveBeenCalled();
		});

		it('stale RAF callback after cancel does not invoke render', () => {
			scheduler.schedule();
			// Capture the callback before cancel removes it from our stub
			const cb = [...rafStub.callbacks.values()][0];
			scheduler.cancel();
			// Simulate browser firing the stale callback anyway
			if (cb) cb(16);
			expect(renderSpy).not.toHaveBeenCalled();
		});

		it('allows re-scheduling after cancel', () => {
			scheduler.schedule();
			scheduler.cancel();
			scheduler.schedule();
			expect(rafStub.raf).toHaveBeenCalledTimes(2);
			rafStub.flush();
			expect(renderSpy).toHaveBeenCalledOnce();
		});
	});

	describe('flushNow', () => {
		it('invokes the render callback when a schedule is pending', () => {
			scheduler.schedule();
			scheduler.flushNow();
			expect(renderSpy).toHaveBeenCalledOnce();
		});

		it('cancels the pending RAF handle', () => {
			scheduler.schedule();
			scheduler.flushNow();
			expect(rafStub.caf).toHaveBeenCalledOnce();
		});

		it('stale RAF callback after flushNow does not invoke render again', () => {
			scheduler.schedule();
			const cb = [...rafStub.callbacks.values()][0];
			scheduler.flushNow();
			// Simulate browser firing the stale callback
			if (cb) cb(16);
			expect(renderSpy).toHaveBeenCalledOnce();
		});

		it('with nothing pending does not invoke render', () => {
			scheduler.flushNow();
			expect(renderSpy).not.toHaveBeenCalled();
		});

		it('allows scheduling again after flushNow', () => {
			scheduler.schedule();
			scheduler.flushNow();
			scheduler.schedule();
			expect(rafStub.raf).toHaveBeenCalledTimes(2);
			rafStub.flush();
			expect(renderSpy).toHaveBeenCalledTimes(2);
		});
	});
});
