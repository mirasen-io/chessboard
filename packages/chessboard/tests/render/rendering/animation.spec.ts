import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	performAnimationCleanup,
	performAnimationPass
} from '../../../src/render/rendering/animation.js';
import type { RenderSystemInternal } from '../../../src/render/types.js';
import {
	createFakeRenderFrame,
	createFakeRenderInternal
} from '../../test-utils/render/factory.js';

describe('performAnimationPass', () => {
	let state: RenderSystemInternal;
	let perfNowSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		state = createFakeRenderInternal({ extensions: [{ id: 'ext-a' }] });
		state.currentFrame = createFakeRenderFrame();
		// Default: time is 1000ms
		perfNowSpy = vi.spyOn(performance, 'now').mockReturnValue(1000);
	});

	afterEach(() => {
		perfNowSpy.mockRestore();
	});

	function getExt() {
		return state.extensions.get('ext-a')!;
	}

	describe('guards', () => {
		it('throws when state is not mounted', () => {
			state.container = null;
			expect(() => performAnimationPass(state)).toThrow();
		});

		it('throws when currentFrame is null', () => {
			state.currentFrame = null;
			expect(() => performAnimationPass(state)).toThrow();
		});
	});

	describe('submitted session preparation', () => {
		it('calls prepareAnimation on extension with submitted sessions', () => {
			const ext = getExt();
			ext.extension.animation.submit({ duration: 300 });

			performAnimationPass(state);

			expect(ext.extension.instance.prepareAnimation).toHaveBeenCalledOnce();
		});

		it('passes context with submittedSessions containing the submitted session', () => {
			const ext = getExt();
			const session = ext.extension.animation.submit({ duration: 300 });

			performAnimationPass(state);

			const mock = ext.extension.instance.prepareAnimation as ReturnType<typeof vi.fn>;
			const ctx = mock.mock.calls[0][0];
			expect(ctx.submittedSessions).toHaveLength(1);
			expect(ctx.submittedSessions[0].id).toBe(session.id);
		});

		it('passes context with currentFrame and invalidation', () => {
			const ext = getExt();
			ext.extension.animation.submit({ duration: 300 });

			performAnimationPass(state);

			const mock = ext.extension.instance.prepareAnimation as ReturnType<typeof vi.fn>;
			const ctx = mock.mock.calls[0][0];
			expect(ctx.currentFrame).toBe(state.currentFrame);
			expect(ctx.invalidation).toBe(ext.extension.invalidation);
		});

		it('transitions submitted sessions to active after preparation', () => {
			const ext = getExt();
			const session = ext.extension.animation.submit({ duration: 300 });

			performAnimationPass(state);

			expect(session.status).toBe('active');
		});
	});

	describe('active session rendering', () => {
		it('calls renderAnimation on extension with active sessions', () => {
			const ext = getExt();
			ext.extension.animation.submit({ duration: 5000 });
			// First pass: submit → active
			performAnimationPass(state);
			(ext.extension.instance.renderAnimation as ReturnType<typeof vi.fn>).mockClear();

			// Second pass: now active, should render
			performAnimationPass(state);

			expect(ext.extension.instance.renderAnimation).toHaveBeenCalledOnce();
		});

		it('passes context with activeSessions', () => {
			const ext = getExt();
			const session = ext.extension.animation.submit({ duration: 5000 });
			performAnimationPass(state); // submit → active
			(ext.extension.instance.renderAnimation as ReturnType<typeof vi.fn>).mockClear();

			performAnimationPass(state);

			const mock = ext.extension.instance.renderAnimation as ReturnType<typeof vi.fn>;
			const ctx = mock.mock.calls[0][0];
			expect(ctx.activeSessions).toHaveLength(1);
			expect(ctx.activeSessions[0].id).toBe(session.id);
		});

		it('does not call renderAnimation when no active sessions exist', () => {
			const ext = getExt();
			// No sessions submitted
			performAnimationPass(state);

			expect(ext.extension.instance.renderAnimation).not.toHaveBeenCalled();
		});
	});

	describe('session termination', () => {
		it('marks elapsed sessions as ended', () => {
			const ext = getExt();
			// Submit with duration 200, startTime will be ~1000 (mocked)
			const session = ext.extension.animation.submit({ duration: 200 });
			performAnimationPass(state); // submit → active

			// Advance time so session is elapsed
			perfNowSpy.mockReturnValue(1300);
			performAnimationPass(state);

			expect(session.status).toBe('ended');
		});

		it('marks pending cleanup on terminal sessions', () => {
			const ext = getExt();
			ext.extension.animation.submit({ duration: 200 });
			performAnimationPass(state); // submit → active

			perfNowSpy.mockReturnValue(1300);
			performAnimationPass(state);

			// Access pendingCleanup via the internal surface
			const sessions = ext.extension.animation.getAll(['ended', 'cancelled']);
			expect(sessions).toHaveLength(1);
			expect(sessions[0].pendingCleanup).toBe(true);
		});

		it('calls onAnimationFinished with terminal sessions', () => {
			const ext = getExt();
			const session = ext.extension.animation.submit({ duration: 200 });
			performAnimationPass(state); // submit → active

			perfNowSpy.mockReturnValue(1300);
			performAnimationPass(state);

			const mock = ext.extension.instance.onAnimationFinished as ReturnType<typeof vi.fn>;
			expect(mock).toHaveBeenCalledOnce();
			const ctx = mock.mock.calls[0][0];
			expect(ctx.finishedSessions).toHaveLength(1);
			expect(ctx.finishedSessions[0].id).toBe(session.id);
		});

		it('does not call onAnimationFinished when no sessions are terminal', () => {
			const ext = getExt();
			ext.extension.animation.submit({ duration: 5000 });
			performAnimationPass(state); // submit → active

			// Time hasn't elapsed
			performAnimationPass(state);

			expect(ext.extension.instance.onAnimationFinished).not.toHaveBeenCalled();
		});

		it('handles cancelled sessions: marks pendingCleanup, calls onAnimationFinished, returns requestRender true', () => {
			const ext = getExt();
			const session = ext.extension.animation.submit({ duration: 5000 });
			performAnimationPass(state); // submit → active

			// Cancel the session
			ext.extension.animation.cancel(session.id);

			const result = performAnimationPass(state);

			// Verify pendingCleanup via getAll
			const cancelledSessions = ext.extension.animation.getAll('cancelled');
			expect(cancelledSessions).toHaveLength(1);
			expect(cancelledSessions[0].pendingCleanup).toBe(true);

			// Verify onAnimationFinished was called with the cancelled session
			const mock = ext.extension.instance.onAnimationFinished as ReturnType<typeof vi.fn>;
			expect(mock).toHaveBeenCalledOnce();
			const ctx = mock.mock.calls[0][0];
			expect(ctx.finishedSessions).toHaveLength(1);
			expect(ctx.finishedSessions[0].id).toBe(session.id);
			expect(ctx.finishedSessions[0].status).toBe('cancelled');

			// Verify requestRender is true
			expect(result.requestRender).toBe(true);
		});
	});

	describe('return value', () => {
		it('returns requestRenderAnimation: true when active sessions remain', () => {
			const ext = getExt();
			ext.extension.animation.submit({ duration: 5000 });
			performAnimationPass(state); // submit → active

			const result = performAnimationPass(state);

			expect(result.requestRenderAnimation).toBe(true);
		});

		it('returns requestRenderAnimation: false when no active sessions remain', () => {
			const ext = getExt();
			ext.extension.animation.submit({ duration: 200 });
			performAnimationPass(state); // submit → active

			perfNowSpy.mockReturnValue(1300);
			const result = performAnimationPass(state);

			expect(result.requestRenderAnimation).toBe(false);
		});

		it('returns requestRender: true when terminal sessions exist', () => {
			const ext = getExt();
			ext.extension.animation.submit({ duration: 200 });
			performAnimationPass(state); // submit → active

			perfNowSpy.mockReturnValue(1300);
			const result = performAnimationPass(state);

			expect(result.requestRender).toBe(true);
		});

		it('returns requestRender: true when extension has dirty invalidation layers', () => {
			const ext = getExt();
			ext.extension.animation.submit({ duration: 5000 });
			performAnimationPass(state); // submit → active

			(ext.extension.invalidation as { dirtyLayers: number }).dirtyLayers = 1;
			const result = performAnimationPass(state);

			expect(result.requestRender).toBe(true);
		});

		it('returns requestRender: false when no terminal sessions and no dirty layers', () => {
			const ext = getExt();
			ext.extension.animation.submit({ duration: 5000 });
			performAnimationPass(state); // submit → active

			const result = performAnimationPass(state);

			expect(result.requestRender).toBe(false);
		});
	});

	describe('optional hooks', () => {
		it('does not throw when extension has no prepareAnimation hook', () => {
			const ext = getExt();
			(ext.extension.instance as unknown as Record<string, unknown>).prepareAnimation = undefined;
			ext.extension.animation.submit({ duration: 300 });

			expect(() => performAnimationPass(state)).not.toThrow();
		});

		it('does not throw when extension has no renderAnimation hook', () => {
			const ext = getExt();
			ext.extension.animation.submit({ duration: 5000 });
			performAnimationPass(state); // submit → active
			(ext.extension.instance as unknown as Record<string, unknown>).renderAnimation = undefined;

			expect(() => performAnimationPass(state)).not.toThrow();
		});

		it('does not throw when extension has no onAnimationFinished hook', () => {
			const ext = getExt();
			ext.extension.animation.submit({ duration: 200 });
			performAnimationPass(state); // submit → active
			(ext.extension.instance as unknown as Record<string, unknown>).onAnimationFinished =
				undefined;

			perfNowSpy.mockReturnValue(1300);
			expect(() => performAnimationPass(state)).not.toThrow();
		});
	});
});

describe('performAnimationCleanup', () => {
	let state: RenderSystemInternal;
	let perfNowSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		state = createFakeRenderInternal({ extensions: [{ id: 'ext-a' }] });
		state.currentFrame = createFakeRenderFrame();
		perfNowSpy = vi.spyOn(performance, 'now').mockReturnValue(1000);
	});

	afterEach(() => {
		perfNowSpy.mockRestore();
	});

	function getExt() {
		return state.extensions.get('ext-a')!;
	}

	describe('guards', () => {
		it('throws when currentFrame is null', () => {
			state.currentFrame = null;
			expect(() => performAnimationCleanup(state)).toThrow();
		});
	});

	describe('cleanup dispatch', () => {
		it('calls cleanAnimation with sessions that have pendingCleanup', () => {
			const ext = getExt();
			ext.extension.animation.submit({ duration: 200 });
			performAnimationPass(state); // submit → active

			perfNowSpy.mockReturnValue(1300);
			performAnimationPass(state); // active → ended + pendingCleanup

			performAnimationCleanup(state);

			expect(ext.extension.instance.cleanAnimation).toHaveBeenCalledOnce();
		});

		it('passes context with currentFrame, invalidation, and finishedSessions', () => {
			const ext = getExt();
			const session = ext.extension.animation.submit({ duration: 200 });
			performAnimationPass(state);

			perfNowSpy.mockReturnValue(1300);
			performAnimationPass(state);

			performAnimationCleanup(state);

			const mock = ext.extension.instance.cleanAnimation as ReturnType<typeof vi.fn>;
			const ctx = mock.mock.calls[0][0];
			expect(ctx.currentFrame).toBe(state.currentFrame);
			expect(ctx.invalidation).toBe(ext.extension.invalidation);
			expect(ctx.finishedSessions).toHaveLength(1);
			expect(ctx.finishedSessions[0].id).toBe(session.id);
		});

		it('removes terminal pending-cleanup sessions from animation controller', () => {
			const ext = getExt();
			ext.extension.animation.submit({ duration: 200 });
			performAnimationPass(state);

			perfNowSpy.mockReturnValue(1300);
			performAnimationPass(state);

			performAnimationCleanup(state);

			// After cleanup, no sessions should remain
			const remaining = ext.extension.animation.getAll();
			expect(remaining).toHaveLength(0);
		});

		it('does not call cleanAnimation when no sessions are pending cleanup', () => {
			const ext = getExt();
			// No sessions at all
			performAnimationCleanup(state);

			expect(ext.extension.instance.cleanAnimation).not.toHaveBeenCalled();
		});

		it('does not throw when extension has no cleanAnimation hook', () => {
			const ext = getExt();
			ext.extension.animation.submit({ duration: 200 });
			performAnimationPass(state);

			perfNowSpy.mockReturnValue(1300);
			performAnimationPass(state);

			(ext.extension.instance as unknown as Record<string, unknown>).cleanAnimation = undefined;

			expect(() => performAnimationCleanup(state)).not.toThrow();
		});
	});
});
