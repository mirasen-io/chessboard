import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createRenderSystem } from '../../src/render/factory.js';
import type { RenderSystem } from '../../src/render/types.js';
import { createMinimalRenderSystemOptions } from '../test-utils/render/factory.js';
import { createRafStub, type RafStub } from '../test-utils/render/scheduler.js';

describe('RenderSystem lifecycle', () => {
	let rafStub: RafStub;

	beforeEach(() => {
		rafStub = createRafStub();
		rafStub.install();
	});

	afterEach(() => {
		rafStub.restore();
	});

	function createSystem(
		opts?: Parameters<typeof createMinimalRenderSystemOptions>[0]
	): RenderSystem {
		return createRenderSystem(createMinimalRenderSystemOptions(opts));
	}

	describe('initial state', () => {
		it('isMounted is false after creation', () => {
			const sys = createSystem();
			expect(sys.isMounted).toBe(false);
		});

		it('container is null after creation', () => {
			const sys = createSystem();
			expect(sys.container).toBeNull();
		});
	});

	describe('mount', () => {
		it('sets isMounted to true', () => {
			const sys = createSystem();
			const el = document.createElement('div');
			sys.mount(el);
			expect(sys.isMounted).toBe(true);
		});

		it('sets container to the provided element', () => {
			const sys = createSystem();
			const el = document.createElement('div');
			sys.mount(el);
			expect(sys.container).toBe(el);
		});

		it('appends svgRoot as child of the container', () => {
			const sys = createSystem();
			const el = document.createElement('div');
			sys.mount(el);
			const svg = el.querySelector('svg');
			expect(svg).not.toBeNull();
		});

		it('throws when already mounted', () => {
			const sys = createSystem();
			const el = document.createElement('div');
			sys.mount(el);
			expect(() => sys.mount(el)).toThrow(/already mounted/);
		});

		it('calls extension mount hook', () => {
			const sys = createSystem({ extensions: [{ id: 'ext-a', slots: ['board'] }] });
			const el = document.createElement('div');
			sys.mount(el);
			const extRecord = sys.extensions.get('ext-a');
			expect(extRecord!.extension.instance.mount).toHaveBeenCalledOnce();
		});

		it('passes allocated slot roots to extension mount hook', () => {
			const sys = createSystem({ extensions: [{ id: 'ext-b', slots: ['board'] }] });
			const el = document.createElement('div');
			sys.mount(el);
			const extRecord = sys.extensions.get('ext-b');
			const mountCall = (
				extRecord!.extension.instance.mount as unknown as { mock: { calls: unknown[][] } }
			).mock.calls[0][0] as { slotRoots: Record<string, Element> };
			expect(mountCall.slotRoots.board).toBeDefined();
			expect(mountCall.slotRoots.board.tagName.toLowerCase()).toBe('g');
			expect(mountCall.slotRoots.board.parentNode).not.toBeNull();
		});
	});

	describe('unmount', () => {
		it('sets isMounted to false', () => {
			const sys = createSystem();
			const el = document.createElement('div');
			sys.mount(el);
			sys.unmount();
			expect(sys.isMounted).toBe(false);
		});

		it('sets container to null', () => {
			const sys = createSystem();
			const el = document.createElement('div');
			sys.mount(el);
			sys.unmount();
			expect(sys.container).toBeNull();
		});

		it('removes svgRoot from container', () => {
			const sys = createSystem();
			const el = document.createElement('div');
			sys.mount(el);
			sys.unmount();
			expect(el.querySelector('svg')).toBeNull();
		});

		it('throws when not mounted', () => {
			const sys = createSystem();
			expect(() => sys.unmount()).toThrow(/not mounted/);
		});

		it('calls extension unmount hook', () => {
			const sys = createSystem({ extensions: [{ id: 'ext-a', slots: ['board'] }] });
			const el = document.createElement('div');
			sys.mount(el);
			sys.unmount();
			const extRecord = sys.extensions.get('ext-a');
			expect(extRecord!.extension.instance.unmount).toHaveBeenCalledOnce();
		});

		it('cancels any pending scheduler frame', () => {
			const sys = createSystem();
			const el = document.createElement('div');
			sys.mount(el);
			// Request a render to schedule a frame
			sys.requestRender({} as unknown as Parameters<typeof sys.requestRender>[0]);
			expect(rafStub.callbacks.size).toBe(1);
			sys.unmount();
			// After unmount the RAF should have been cancelled
			expect(rafStub.caf).toHaveBeenCalled();
		});
	});

	describe('mount/unmount cycles', () => {
		it('can mount, unmount, then mount again', () => {
			const sys = createSystem();
			const el = document.createElement('div');
			sys.mount(el);
			sys.unmount();
			sys.mount(el);
			expect(sys.isMounted).toBe(true);
			expect(el.querySelector('svg')).not.toBeNull();
		});
	});

	describe('request guards when unmounted', () => {
		it('requestRender throws when not mounted', () => {
			const sys = createSystem();
			expect(() =>
				sys.requestRender({} as unknown as Parameters<typeof sys.requestRender>[0])
			).toThrow(/not mounted/);
		});

		it('requestRenderAnimation throws when not mounted', () => {
			const sys = createSystem();
			expect(() => sys.requestRenderAnimation()).toThrow(/not mounted/);
		});

		it('requestRenderVisuals throws when not mounted', () => {
			const sys = createSystem();
			expect(() =>
				sys.requestRenderVisuals({} as unknown as Parameters<typeof sys.requestRenderVisuals>[0])
			).toThrow(/not mounted/);
		});
	});
});
