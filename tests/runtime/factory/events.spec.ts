import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type {
	AnyExtensionDefinition,
	AnyExtensionInstance
} from '../../../src/extensions/types/extension.js';
import type { ExtensionRuntimeSurfaceEvents } from '../../../src/extensions/types/surface/events.js';
import { createRuntime } from '../../../src/runtime/factory/main.js';
import type { Runtime } from '../../../src/runtime/types/main.js';

// Minimal ResizeObserver stub for jsdom
class ResizeObserverStub {
	observe = vi.fn();
	unobserve = vi.fn();
	disconnect = vi.fn();
}

let capturedEvents: ExtensionRuntimeSurfaceEvents | null = null;

function createEventCapturingExtension(id: string): AnyExtensionDefinition {
	return {
		id,
		slots: [],
		createInstance(options) {
			capturedEvents = options.runtimeSurface.events;
			return { id, onEvent: vi.fn() } as unknown as AnyExtensionInstance;
		}
	};
}

describe('runtime factory events surface', () => {
	let runtime: Runtime;
	let container: HTMLElement;

	beforeEach(() => {
		vi.stubGlobal('ResizeObserver', ResizeObserverStub);
		capturedEvents = null;
		const ext = createEventCapturingExtension('evt-ext');
		runtime = createRuntime({ doc: document, extensions: [ext] });
		container = document.createElement('div');
	});

	afterEach(() => {
		if (runtime.status === 'mounted') {
			runtime.unmount();
		}
		vi.unstubAllGlobals();
	});

	describe('subscribeEvent', () => {
		it('delegates to input adapter addEventListener when mounted', () => {
			runtime.mount(container);
			const addSpy = vi.spyOn(container, 'addEventListener');
			capturedEvents!.subscribeEvent('click');
			expect(addSpy).toHaveBeenCalledWith('click', expect.any(Function));
			addSpy.mockRestore();
		});

		it('throws when not mounted (inputAdapter is null)', () => {
			expect(() => capturedEvents!.subscribeEvent('click')).toThrow();
		});
	});

	describe('unsubscribeEvent', () => {
		it('delegates to input adapter removeEventListener for non-required event types', () => {
			runtime.mount(container);
			capturedEvents!.subscribeEvent('click');
			const removeSpy = vi.spyOn(container, 'removeEventListener');
			capturedEvents!.unsubscribeEvent('click');
			expect(removeSpy).toHaveBeenCalledWith('click', expect.any(Function));
			removeSpy.mockRestore();
		});

		it('does NOT call removeEventListener for required pointer event type (pointerdown)', () => {
			runtime.mount(container);
			const removeSpy = vi.spyOn(container, 'removeEventListener');
			capturedEvents!.unsubscribeEvent('pointerdown');
			expect(removeSpy).not.toHaveBeenCalled();
			removeSpy.mockRestore();
		});
	});
});
