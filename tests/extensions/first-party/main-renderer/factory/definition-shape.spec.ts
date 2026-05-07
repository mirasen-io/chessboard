import { describe, expect, it } from 'vitest';
import { createMainRenderer } from '../../../../../src/extensions/first-party/main-renderer/factory.js';
import { createMainRendererRuntimeSurface } from '../../../../test-utils/extensions/first-party/main-renderer/factory.js';
import { createMockExtensionCreateInstanceOptions } from '../../../../test-utils/extensions/factory.js';

describe('main-renderer definition shape', () => {
	it('returns definition with id "renderer"', () => {
		const def = createMainRenderer();
		expect(def.id).toBe('renderer');
	});

	it('declares the expected slots', () => {
		const def = createMainRenderer();
		expect(def.slots).toEqual(['defs', 'board', 'coordinates', 'pieces', 'animation', 'drag']);
	});

	it('createInstance returns an object with expected lifecycle methods', () => {
		const { surface } = createMainRendererRuntimeSurface();
		const def = createMainRenderer();
		const instance = def.createInstance(
			createMockExtensionCreateInstanceOptions({ runtimeSurface: surface })
		);

		expect(instance.id).toBe('renderer');
		expect(typeof instance.mount).toBe('function');
		expect(typeof instance.onUpdate).toBe('function');
		expect(typeof instance.render).toBe('function');
		expect(typeof instance.renderTransientVisuals).toBe('function');
		expect(typeof instance.prepareAnimation).toBe('function');
		expect(typeof instance.renderAnimation).toBe('function');
		expect(typeof instance.onAnimationFinished).toBe('function');
		expect(typeof instance.cleanAnimation).toBe('function');
		expect(typeof instance.unmount).toBe('function');
		expect(typeof instance.destroy).toBe('function');
	});
});
