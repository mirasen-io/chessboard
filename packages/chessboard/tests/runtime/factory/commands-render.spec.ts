import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRuntime } from '../../../src/runtime/factory/main.js';

// Minimal ResizeObserver stub for jsdom that does NOT invoke the callback
class ResizeObserverStub {
	observe = vi.fn();
	unobserve = vi.fn();
	disconnect = vi.fn();
}

beforeEach(() => {
	vi.stubGlobal('ResizeObserver', ResizeObserverStub);
});

afterEach(() => {
	vi.unstubAllGlobals();
});

function createTestRuntime() {
	return createRuntime({ element: document.createElement('div') });
}

describe('runtime requestRender command', () => {
	describe('returns false and does not throw when the frame is not renderable', () => {
		it('returns false when requesting state render on unmounted runtime', () => {
			const runtime = createTestRuntime();
			const result = runtime.requestRender({ state: true });
			expect(result).toBe(false);
		});

		it('returns false when mounted but geometry is not yet initialized', () => {
			// After mount, geometry remains null until the first ResizeObserver callback.
			// In jsdom with a stub observer, no resize fires so geometry stays null.
			const runtime = createTestRuntime();
			const container = document.createElement('div');
			runtime.mount(container);

			const result = runtime.requestRender({ state: true });
			expect(result).toBe(false);

			runtime.unmount();
			runtime.destroy();
		});
	});

	describe('returns true when the frame is renderable', () => {
		it('returns true when mounted with valid geometry', () => {
			// Use a ResizeObserver stub that invokes the callback immediately on observe
			vi.stubGlobal(
				'ResizeObserver',
				class {
					private cb: () => void;
					constructor(cb: () => void) {
						this.cb = cb;
					}
					observe = vi.fn(() => this.cb());
					unobserve = vi.fn();
					disconnect = vi.fn();
				}
			);

			const runtime = createRuntime({ element: document.createElement('div') });
			const container = document.createElement('div');
			// Stub clientWidth/clientHeight so isSceneSizeValid returns true
			Object.defineProperty(container, 'clientWidth', { value: 400 });
			Object.defineProperty(container, 'clientHeight', { value: 400 });

			runtime.mount(container);

			const result = runtime.requestRender({ state: true });
			expect(result).toBe(true);

			runtime.unmount();
			runtime.destroy();
		});
	});

	describe('edge cases', () => {
		it('returns false when request has no state field', () => {
			const runtime = createTestRuntime();
			const result = runtime.requestRender({});
			expect(result).toBe(false);
		});

		it('returns false when request.state is false', () => {
			const runtime = createTestRuntime();
			const result = runtime.requestRender({ state: false });
			expect(result).toBe(false);
		});
	});
});
