import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	createExtensionAnimationController,
	createExtensionAnimationSession
} from '../../../src/extensions/animation/factory.js';

describe('createExtensionAnimationSession', () => {
	let nowValue: number;

	beforeEach(() => {
		nowValue = 1000;
		vi.spyOn(performance, 'now').mockImplementation(() => nowValue);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('has correct id and duration from constructor args', () => {
		const session = createExtensionAnimationSession(42, { duration: 300 });
		expect(session.id).toBe(42);
		expect(session.duration).toBe(300);
	});

	it('startTime reflects performance.now() at creation', () => {
		const session = createExtensionAnimationSession(1, { duration: 200 });
		expect(session.startTime).toBe(1000);
	});

	it('status starts as submitted', () => {
		const session = createExtensionAnimationSession(1, { duration: 200 });
		expect(session.status).toBe('submitted');
	});

	it('setStatus changes status', () => {
		const session = createExtensionAnimationSession(1, { duration: 200 });
		session.setStatus('active');
		expect(session.status).toBe('active');
		session.setStatus('ended');
		expect(session.status).toBe('ended');
	});

	it('elapsedTime reflects passage of time', () => {
		const session = createExtensionAnimationSession(1, { duration: 500 });
		nowValue = 1150;
		expect(session.elapsedTime).toBe(150);
	});

	it('progress is 0 at start time', () => {
		const session = createExtensionAnimationSession(1, { duration: 400 });
		// nowValue is still 1000 = startTime
		expect(session.progress).toBe(0);
	});

	it('progress reflects fraction of duration elapsed', () => {
		const session = createExtensionAnimationSession(1, { duration: 400 });
		nowValue = 1200; // 200ms elapsed out of 400ms
		expect(session.progress).toBeCloseTo(0.5);
	});

	it('progress caps at 1 when elapsed exceeds duration', () => {
		const session = createExtensionAnimationSession(1, { duration: 300 });
		nowValue = 2000; // well past duration
		expect(session.progress).toBe(1);
	});

	it('pendingCleanup starts false', () => {
		const session = createExtensionAnimationSession(1, { duration: 200 });
		expect(session.pendingCleanup).toBe(false);
	});

	it('markPendingCleanup sets pendingCleanup to true', () => {
		const session = createExtensionAnimationSession(1, { duration: 200 });
		session.markPendingCleanup();
		expect(session.pendingCleanup).toBe(true);
	});
});

describe('createExtensionAnimationController', () => {
	beforeEach(() => {
		vi.spyOn(performance, 'now').mockReturnValue(500);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('submit', () => {
		it('returns a session with status submitted', () => {
			const controller = createExtensionAnimationController();
			const session = controller.submit({ duration: 200 });
			expect(session.status).toBe('submitted');
			expect(session.duration).toBe(200);
		});

		it('creates sessions with unique ids', () => {
			const controller = createExtensionAnimationController();
			const s1 = controller.submit({ duration: 100 });
			const s2 = controller.submit({ duration: 100 });
			const s3 = controller.submit({ duration: 100 });
			const ids = new Set([s1.id, s2.id, s3.id]);
			expect(ids.size).toBe(3);
		});
	});

	describe('cancel', () => {
		it('marks an existing session as cancelled', () => {
			const controller = createExtensionAnimationController();
			const session = controller.submit({ duration: 200 });
			controller.cancel(session.id);
			expect(session.status).toBe('cancelled');
		});

		it('does not throw on a missing session id', () => {
			const controller = createExtensionAnimationController();
			expect(() => controller.cancel(99999)).not.toThrow();
		});
	});

	describe('getAll', () => {
		it('returns all sessions when called without arguments', () => {
			const controller = createExtensionAnimationController();
			controller.submit({ duration: 100 });
			controller.submit({ duration: 200 });
			const all = controller.getAll();
			expect(all).toHaveLength(2);
		});

		it('filters by single status string', () => {
			const controller = createExtensionAnimationController();
			const s1 = controller.submit({ duration: 100 });
			controller.submit({ duration: 200 });
			// Use getAll() which returns ExtensionAnimationSessionInternalSurface with setStatus
			const s1Internal = controller.getAll().find((s) => s.id === s1.id)!;
			s1Internal.setStatus('active');
			const active = controller.getAll('active');
			expect(active).toHaveLength(1);
			expect(active[0].id).toBe(s1.id);
		});

		it('filters by iterable of statuses', () => {
			const controller = createExtensionAnimationController();
			const s1 = controller.submit({ duration: 100 });
			const s2 = controller.submit({ duration: 200 });
			controller.submit({ duration: 300 });
			const allSessions = controller.getAll();
			const s1Internal = allSessions.find((s) => s.id === s1.id)!;
			const s2Internal = allSessions.find((s) => s.id === s2.id)!;
			s1Internal.setStatus('active');
			s2Internal.setStatus('ended');
			const result = controller.getAll(['active', 'ended']);
			expect(result).toHaveLength(2);
			const ids = result.map((s) => s.id);
			expect(ids).toContain(s1.id);
			expect(ids).toContain(s2.id);
		});

		it('returns empty array when no sessions match status', () => {
			const controller = createExtensionAnimationController();
			controller.submit({ duration: 100 });
			const result = controller.getAll('cancelled');
			expect(result).toHaveLength(0);
		});
	});

	describe('remove', () => {
		it('removes a single session by id', () => {
			const controller = createExtensionAnimationController();
			const s1 = controller.submit({ duration: 100 });
			controller.submit({ duration: 200 });
			controller.remove(s1.id);
			const all = controller.getAll();
			expect(all).toHaveLength(1);
			expect(all[0].id).not.toBe(s1.id);
		});

		it('removes multiple sessions by iterable of ids', () => {
			const controller = createExtensionAnimationController();
			const s1 = controller.submit({ duration: 100 });
			const s2 = controller.submit({ duration: 200 });
			controller.submit({ duration: 300 });
			controller.remove([s1.id, s2.id]);
			const all = controller.getAll();
			expect(all).toHaveLength(1);
		});

		it('does not throw when removing a non-existent id', () => {
			const controller = createExtensionAnimationController();
			expect(() => controller.remove(99999)).not.toThrow();
		});
	});

	describe('clear', () => {
		it('removes all sessions', () => {
			const controller = createExtensionAnimationController();
			controller.submit({ duration: 100 });
			controller.submit({ duration: 200 });
			controller.submit({ duration: 300 });
			controller.clear();
			expect(controller.getAll()).toHaveLength(0);
		});
	});
});
