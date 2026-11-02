import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRuntime } from '../../../src/runtime/factory/main.js';
import type { Runtime } from '../../../src/runtime/types/main.js';
import { createSpyExtensionDefinition } from '../../test-utils/runtime/lifecycle.js';

// Minimal ResizeObserver stub for jsdom
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

function createTestRuntime(
	extensions?: Parameters<typeof createRuntime>[0]['extensions']
): Runtime {
	return createRuntime({ element: document.createElement('div'), extensions });
}

describe('createRuntime', () => {
	describe('creation', () => {
		it('returns runtime with status unmounted when no extensions', () => {
			const runtime = createTestRuntime();
			expect(runtime.status).toBe('unmounted');
		});

		it('returns runtime with status unmounted with empty extensions array', () => {
			const runtime = createTestRuntime([]);
			expect(runtime.status).toBe('unmounted');
		});

		it('calls createInstance on extension during creation', () => {
			const ext = createSpyExtensionDefinition('test-ext');
			createTestRuntime([ext.definition]);
			expect(ext.spies.createInstance).toHaveBeenCalledOnce();
		});

		it('throws when extension uses reserved id "core"', () => {
			const ext = createSpyExtensionDefinition('core');
			expect(() => createTestRuntime([ext.definition])).toThrow(/core/);
		});

		it('throws when duplicate extension ids are provided', () => {
			const ext1 = createSpyExtensionDefinition('dup');
			const ext2 = createSpyExtensionDefinition('dup');
			expect(() => createTestRuntime([ext1.definition, ext2.definition])).toThrow(/dup/);
		});

		it('runs initial mutation pipeline: extension onUpdate called during creation', () => {
			const ext = createSpyExtensionDefinition('test-ext');
			createTestRuntime([ext.definition]);
			expect(ext.spies.onUpdate).toHaveBeenCalledOnce();
		});

		it('multiple extensions: onUpdate called in array order during creation', () => {
			const order: string[] = [];
			const ext1 = createSpyExtensionDefinition('ext-a');
			ext1.spies.onUpdate.mockImplementation(() => order.push('a'));
			const ext2 = createSpyExtensionDefinition('ext-b');
			ext2.spies.onUpdate.mockImplementation(() => order.push('b'));

			createTestRuntime([ext1.definition, ext2.definition]);

			expect(order).toEqual(['a', 'b']);
		});
	});

	describe('mount', () => {
		it('changes status to mounted', () => {
			const runtime = createTestRuntime();
			const container = document.createElement('div');
			runtime.mount(container);
			expect(runtime.status).toBe('mounted');
		});

		it('throws when already mounted', () => {
			const runtime = createTestRuntime();
			const container = document.createElement('div');
			runtime.mount(container);
			expect(() => runtime.mount(container)).toThrow(/already mounted/);
		});

		it('appends SVG element to container', () => {
			const runtime = createTestRuntime();
			const container = document.createElement('div');
			runtime.mount(container);
			const svg = container.querySelector('svg');
			expect(svg).not.toBeNull();
		});

		it('calls extension mount() hook during mount', () => {
			const ext = createSpyExtensionDefinition('test-ext', { slots: ['board'] });
			const runtime = createTestRuntime([ext.definition]);
			const container = document.createElement('div');

			runtime.mount(container);

			expect(ext.spies.mount).toHaveBeenCalledOnce();
		});

		it('multiple extensions: mount() called in array order', () => {
			const order: string[] = [];
			const ext1 = createSpyExtensionDefinition('ext-a', { slots: ['board'] });
			ext1.spies.mount.mockImplementation(() => order.push('a'));
			const ext2 = createSpyExtensionDefinition('ext-b', { slots: ['board'] });
			ext2.spies.mount.mockImplementation(() => order.push('b'));

			const runtime = createTestRuntime([ext1.definition, ext2.definition]);
			const container = document.createElement('div');
			runtime.mount(container);

			expect(order).toEqual(['a', 'b']);
		});
	});

	describe('unmount', () => {
		it('changes status to unmounted', () => {
			const runtime = createTestRuntime();
			const container = document.createElement('div');
			runtime.mount(container);
			runtime.unmount();
			expect(runtime.status).toBe('unmounted');
		});

		it('throws when not mounted', () => {
			const runtime = createTestRuntime();
			expect(() => runtime.unmount()).toThrow(/not mounted/);
		});

		it('removes SVG element from container', () => {
			const runtime = createTestRuntime();
			const container = document.createElement('div');
			runtime.mount(container);
			expect(container.querySelector('svg')).not.toBeNull();

			runtime.unmount();
			expect(container.querySelector('svg')).toBeNull();
		});

		it('calls extension unmount() hook during unmount', () => {
			const ext = createSpyExtensionDefinition('test-ext', { slots: ['board'] });
			const runtime = createTestRuntime([ext.definition]);
			const container = document.createElement('div');
			runtime.mount(container);

			runtime.unmount();

			expect(ext.spies.unmount).toHaveBeenCalledOnce();
		});
	});

	describe('destroy', () => {
		it('from mounted state: status becomes destroyed', () => {
			const ext = createSpyExtensionDefinition('test-ext');
			const runtime = createTestRuntime([ext.definition]);
			const container = document.createElement('div');
			runtime.mount(container);

			runtime.destroy();

			expect(runtime.status).toBe('destroyed');
		});

		it('from mounted state: calls unmount then destroy on extension', () => {
			const order: string[] = [];
			const ext = createSpyExtensionDefinition('test-ext', { slots: ['board'] });
			ext.spies.unmount.mockImplementation(() => order.push('unmount'));
			ext.spies.destroy.mockImplementation(() => order.push('destroy'));

			const runtime = createTestRuntime([ext.definition]);
			const container = document.createElement('div');
			runtime.mount(container);
			runtime.destroy();

			expect(order).toEqual(['unmount', 'destroy']);
		});

		it('from unmounted state: status becomes destroyed', () => {
			const runtime = createTestRuntime();
			runtime.destroy();
			expect(runtime.status).toBe('destroyed');
		});

		it('from unmounted state: calls destroy but not unmount on extension', () => {
			const ext = createSpyExtensionDefinition('test-ext');
			const runtime = createTestRuntime([ext.definition]);

			runtime.destroy();

			expect(ext.spies.unmount).not.toHaveBeenCalled();
			expect(ext.spies.destroy).toHaveBeenCalledOnce();
		});

		it('after destroy: mount throws', () => {
			const runtime = createTestRuntime();
			runtime.destroy();
			const container = document.createElement('div');
			expect(() => runtime.mount(container)).toThrow();
		});

		it('after destroy: getSnapshot throws', () => {
			const runtime = createTestRuntime();
			runtime.destroy();
			expect(() => runtime.getSnapshot()).toThrow();
		});
	});

	describe('mount/unmount cycles', () => {
		it('can mount, unmount, then mount again', () => {
			const runtime = createTestRuntime();
			const container = document.createElement('div');

			runtime.mount(container);
			expect(runtime.status).toBe('mounted');

			runtime.unmount();
			expect(runtime.status).toBe('unmounted');

			runtime.mount(container);
			expect(runtime.status).toBe('mounted');
		});

		it('extension mount/unmount hooks called on each cycle', () => {
			const ext = createSpyExtensionDefinition('test-ext', { slots: ['board'] });
			const runtime = createTestRuntime([ext.definition]);
			const container = document.createElement('div');

			runtime.mount(container);
			runtime.unmount();
			runtime.mount(container);

			expect(ext.spies.mount).toHaveBeenCalledTimes(2);
			expect(ext.spies.unmount).toHaveBeenCalledTimes(1);
		});
	});

	describe('getExtensionsPublicRecord', () => {
		it('returns public API from extension with getPublic', () => {
			const publicApi = { hello: 'world' };
			const ext = createSpyExtensionDefinition('test-ext', {
				getPublic: () => publicApi
			});
			const runtime = createTestRuntime([ext.definition]);

			const record = runtime.getExtensionsPublicRecord();

			expect(record['test-ext']).toBe(publicApi);
		});

		it('returns empty record when no extensions have getPublic', () => {
			const ext = createSpyExtensionDefinition('test-ext');
			const runtime = createTestRuntime([ext.definition]);

			const record = runtime.getExtensionsPublicRecord();

			expect(record).toEqual({});
		});
	});
});
