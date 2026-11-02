import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { RenderFrameSnapshot } from '../../../src/extensions/types/basic/render.js';
import type { TransientInput } from '../../../src/extensions/types/basic/transient-visuals.js';
import { createRenderSystem } from '../../../src/render/factory.js';
import type { RenderSystem } from '../../../src/render/types.js';
import {
	createFakeRenderFrame,
	createMinimalRenderSystemOptions
} from '../../test-utils/render/factory.js';
import { createRafStub, type RafStub } from '../../test-utils/render/scheduler.js';

describe('createRenderSystem orchestration', () => {
	let rafStub: RafStub;
	let sys: RenderSystem;
	let frame: RenderFrameSnapshot;

	beforeEach(() => {
		rafStub = createRafStub();
		rafStub.install();
		vi.spyOn(performance, 'now').mockReturnValue(1000);

		sys = createRenderSystem(
			createMinimalRenderSystemOptions({
				extensions: [{ id: 'ext-a' }],
				transientVisualsSubscribers: ['ext-a']
			})
		);
		const el = document.createElement('div');
		sys.mount(el);
		frame = createFakeRenderFrame();
	});

	afterEach(() => {
		vi.restoreAllMocks();
		rafStub.restore();
	});

	function getExt() {
		return sys.extensions.get('ext-a')!;
	}

	function markExtDirty() {
		const ext = getExt();
		(ext.extension.invalidation as { dirtyLayers: number }).dirtyLayers = 1;
	}

	function createTransientInput(): TransientInput {
		return {
			target: null,
			point: { x: 50, y: 60 },
			clampedPoint: { x: 50, y: 60 },
			boardClampedPoint: { x: 50, y: 60 }
		};
	}

	describe('request queuing and scheduling', () => {
		it('requestRender schedules exactly one RAF', () => {
			sys.requestRender(frame);
			expect(rafStub.raf).toHaveBeenCalledOnce();
		});

		it('requestRender called twice before flush coalesces into one RAF but uses the latest frame', () => {
			const frame1 = createFakeRenderFrame({ sceneWidth: 300, sceneHeight: 300 });
			const frame2 = createFakeRenderFrame({ sceneWidth: 500, sceneHeight: 500 });
			markExtDirty();

			sys.requestRender(frame1);
			sys.requestRender(frame2);

			expect(rafStub.raf).toHaveBeenCalledOnce();

			rafStub.flush();

			// The SVG root should reflect the second (latest) frame's size
			const svg = sys.container!.querySelector('svg')!;
			expect(svg.getAttribute('width')).toBe('500');
		});

		it('requestRenderAnimation schedules one RAF', () => {
			sys.requestRenderAnimation();
			expect(rafStub.raf).toHaveBeenCalledOnce();
		});

		it('requestRenderVisuals schedules one RAF', () => {
			sys.requestRenderVisuals(createTransientInput());
			expect(rafStub.raf).toHaveBeenCalledOnce();
		});
	});

	describe('phase dispatch', () => {
		it('state request: extension render() is called on RAF flush', () => {
			markExtDirty();
			sys.requestRender(frame);
			rafStub.flush();

			const ext = getExt();
			expect(ext.extension.instance.render).toHaveBeenCalledOnce();
		});

		it('animation request: extension prepareAnimation/renderAnimation is called on RAF flush', () => {
			// First do a state render to establish currentFrame
			markExtDirty();
			sys.requestRender(frame);
			rafStub.flush();

			// Submit an animation session
			const ext = getExt();
			ext.extension.animation.submit({ duration: 5000 });

			// Request animation pass
			sys.requestRenderAnimation();
			rafStub.flush();

			expect(ext.extension.instance.prepareAnimation).toHaveBeenCalled();
			expect(ext.extension.instance.renderAnimation).toHaveBeenCalled();
		});

		it('visuals request: extension renderTransientVisuals() is called on RAF flush', () => {
			// First do a state render to establish currentFrame
			markExtDirty();
			sys.requestRender(frame);
			rafStub.flush();

			const input = createTransientInput();
			sys.requestRenderVisuals(input);
			rafStub.flush();

			const ext = getExt();
			expect(ext.extension.instance.renderTransientVisuals).toHaveBeenCalledOnce();
		});

		it('state and visuals requests in the same frame: both phases execute', () => {
			markExtDirty();
			sys.requestRender(frame);
			sys.requestRenderVisuals(createTransientInput());
			rafStub.flush();

			const ext = getExt();
			expect(ext.extension.instance.render).toHaveBeenCalledOnce();
			expect(ext.extension.instance.renderTransientVisuals).toHaveBeenCalledOnce();
		});
	});

	describe('animation-driven rescheduling', () => {
		it('active sessions remaining after animation pass schedule a new RAF', () => {
			// Establish currentFrame
			markExtDirty();
			sys.requestRender(frame);
			rafStub.flush();

			// Submit a long animation
			const ext = getExt();
			ext.extension.animation.submit({ duration: 5000 });

			// Request animation pass
			sys.requestRenderAnimation();
			rafStub.flush(); // prepares submitted → active, then detects active remains

			// A new RAF should have been scheduled for the next animation tick
			expect(rafStub.raf).toHaveBeenCalledTimes(3); // initial state + animation + re-schedule
		});

		it('animation pass returning requestRender schedules another RAF for state render', () => {
			// Establish currentFrame
			markExtDirty();
			sys.requestRender(frame);
			rafStub.flush();

			// Submit a short animation that will end immediately
			const ext = getExt();
			ext.extension.animation.submit({ duration: 0 });

			// Advance time so it's already elapsed
			vi.spyOn(performance, 'now').mockReturnValue(2000);

			sys.requestRenderAnimation();
			rafStub.flush(); // prepares + detects ended → requestRender=true

			// Should have re-scheduled for state render
			expect(rafStub.callbacks.size).toBeGreaterThan(0);
		});

		it('animation pass with no remaining active and no terminal does not schedule new RAF', () => {
			// Establish currentFrame
			markExtDirty();
			sys.requestRender(frame);
			rafStub.flush();

			// Ensure no dirty layers remain (clear is a spy, so reset manually)
			const ext = getExt();
			(ext.extension.invalidation as { dirtyLayers: number }).dirtyLayers = 0;

			// Request animation pass with no sessions at all
			sys.requestRenderAnimation();
			const rafCountBefore = rafStub.raf.mock.calls.length;
			rafStub.flush();

			// No new RAF should be scheduled
			expect(rafStub.raf.mock.calls.length).toBe(rafCountBefore);
		});
	});

	describe('unmount clears pending requests', () => {
		it('after requestRender + unmount, no extension hooks fire on stale RAF', () => {
			markExtDirty();
			sys.requestRender(frame);

			// Capture the RAF callback before unmount cancels it
			const cb = [...rafStub.callbacks.values()][0];
			sys.unmount();

			// Simulate stale callback firing
			if (cb) cb(16);

			const ext = getExt();
			expect(ext.extension.instance.render).not.toHaveBeenCalled();
		});
	});
});
