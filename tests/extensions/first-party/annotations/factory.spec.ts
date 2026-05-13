import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_CONFIG } from '../../../../src/extensions/first-party/annotations/constants.js';
import { createAnnotations } from '../../../../src/extensions/first-party/annotations/factory.js';
import { normalizeAnnotationsConfig } from '../../../../src/extensions/first-party/annotations/normalize.js';
import { EXTENSION_ID } from '../../../../src/extensions/first-party/annotations/types/main.js';
import { createMockExtensionCreateInstanceOptions } from '../../../test-utils/extensions/factory.js';

function createMinimalMockSurface() {
	return {
		commands: { requestRender: vi.fn(() => true) },
		events: { subscribeEvent: vi.fn(), unsubscribeEvent: vi.fn() },
		invalidation: { dirtyLayers: 0, markDirty: vi.fn(), clearDirty: vi.fn(), clear: vi.fn() }
	} as never;
}

function createSlotRoots() {
	return {
		defs: document.createElementNS('http://www.w3.org/2000/svg', 'defs'),
		overPieces: document.createElementNS('http://www.w3.org/2000/svg', 'g'),
		drag: document.createElementNS('http://www.w3.org/2000/svg', 'g')
	};
}

describe('createAnnotations', () => {
	describe('factory shape', () => {
		it('returns definition with the expected extension id', () => {
			const def = createAnnotations();
			expect(def.id).toBe(EXTENSION_ID);
			expect(def.id).toBe('annotations');
		});

		it('returns definition with expected slots', () => {
			const def = createAnnotations();
			expect(def.slots).toEqual(['defs', 'overPieces', 'drag']);
		});

		it('createInstance returns an instance with expected hooks', () => {
			const def = createAnnotations();
			const instance = def.createInstance(
				createMockExtensionCreateInstanceOptions({ runtimeSurface: {} as never })
			);
			expect(instance.id).toBe(EXTENSION_ID);
			expect(instance.mount).toBeDefined();
			expect(instance.unmount).toBeDefined();
			expect(instance.destroy).toBeDefined();
			expect(instance.getPublic).toBeDefined();
		});
	});

	describe('normalizeAnnotationsConfig', () => {
		it('returns default config when no input provided', () => {
			const config = normalizeAnnotationsConfig();
			expect(config.clearOnCoreInteraction).toBe(true);
			expect(config.colors).toEqual(DEFAULT_CONFIG.colors);
		});

		it('merges clearOnCoreInteraction override', () => {
			const config = normalizeAnnotationsConfig({ clearOnCoreInteraction: false });
			expect(config.clearOnCoreInteraction).toBe(false);
			expect(config.colors).toEqual(DEFAULT_CONFIG.colors);
		});

		it('merges partial color override without affecting other colors', () => {
			const config = normalizeAnnotationsConfig({ colors: { ctrl: '#000000' } });
			expect(config.colors.ctrl).toBe('#000000');
			expect(config.colors.none).toBe(DEFAULT_CONFIG.colors.none);
			expect(config.colors.shift).toBe(DEFAULT_CONFIG.colors.shift);
			expect(config.colors.alt).toBe(DEFAULT_CONFIG.colors.alt);
			expect(config.colors.meta).toBe(DEFAULT_CONFIG.colors.meta);
		});

		it('does not mutate DEFAULT_CONFIG', () => {
			const originalNone = DEFAULT_CONFIG.colors.none;
			normalizeAnnotationsConfig({ colors: { none: '#ffffff' } });
			expect(DEFAULT_CONFIG.colors.none).toBe(originalNone);
		});
	});

	describe('default normalized config via public API', () => {
		it('getClearOnCoreInteraction returns true by default', () => {
			const def = createAnnotations();
			const instance = def.createInstance(
				createMockExtensionCreateInstanceOptions({ runtimeSurface: {} as never })
			);
			const api = instance.getPublic();
			expect(api.clearOnCoreInteraction).toBe(true);
		});
	});

	describe('config override merge', () => {
		it('clearOnCoreInteraction override is reflected in public API', () => {
			const def = createAnnotations({ config: { clearOnCoreInteraction: false } });
			const instance = def.createInstance(
				createMockExtensionCreateInstanceOptions({ runtimeSurface: {} as never })
			);
			const api = instance.getPublic();
			expect(api.clearOnCoreInteraction).toBe(false);
		});
	});

	describe('initial annotations normalization', () => {
		it('initializes circles from init options', () => {
			const def = createAnnotations({
				annotations: { circles: [{ square: 'e4', color: '#ff0000' }] }
			});
			const instance = def.createInstance(
				createMockExtensionCreateInstanceOptions({ runtimeSurface: {} as never })
			);
			const api = instance.getPublic();
			expect(api.getCircles()).toEqual([{ square: 'e4', color: '#ff0000' }]);
		});

		it('initializes arrows from init options', () => {
			const def = createAnnotations({
				annotations: { arrows: [{ from: 'e2', to: 'e4', color: '#00ff00' }] }
			});
			const instance = def.createInstance(
				createMockExtensionCreateInstanceOptions({ runtimeSurface: {} as never })
			);
			const api = instance.getPublic();
			expect(api.getArrows()).toEqual([{ from: 'e2', to: 'e4', color: '#00ff00' }]);
		});

		it('initializes both circles and arrows', () => {
			const def = createAnnotations({
				annotations: {
					circles: [{ square: 'a1', color: '#f00' }],
					arrows: [{ from: 'a1', to: 'h8', color: '#0f0' }]
				}
			});
			const instance = def.createInstance(
				createMockExtensionCreateInstanceOptions({ runtimeSurface: {} as never })
			);
			const api = instance.getPublic();
			expect(api.getCircles()).toHaveLength(1);
			expect(api.getArrows()).toHaveLength(1);
		});

		it('returns empty arrays when no annotations provided', () => {
			const def = createAnnotations();
			const instance = def.createInstance(
				createMockExtensionCreateInstanceOptions({ runtimeSurface: {} as never })
			);
			const api = instance.getPublic();
			expect(api.getCircles()).toEqual([]);
			expect(api.getArrows()).toEqual([]);
		});
	});

	describe('public API — circles', () => {
		it('circle() adds a circle annotation', () => {
			const def = createAnnotations();
			const instance = def.createInstance(
				createMockExtensionCreateInstanceOptions({ runtimeSurface: createMinimalMockSurface() })
			);
			const api = instance.getPublic();

			api.circle('a1', { color: '#ff0000' });

			expect(api.getCircles()).toEqual([{ square: 'a1', color: '#ff0000' }]);
		});

		it('circle() replaces an existing circle on the same square', () => {
			const def = createAnnotations();
			const instance = def.createInstance(
				createMockExtensionCreateInstanceOptions({ runtimeSurface: createMinimalMockSurface() })
			);
			const api = instance.getPublic();

			api.circle('a1', { color: '#ff0000' });
			api.circle('a1', { color: '#0000ff' });

			const circles = api.getCircles();
			expect(circles).toHaveLength(1);
			expect(circles[0].color).toBe('#0000ff');
		});

		it('circle() with null removes the circle', () => {
			const def = createAnnotations();
			const instance = def.createInstance(
				createMockExtensionCreateInstanceOptions({ runtimeSurface: createMinimalMockSurface() })
			);
			const api = instance.getPublic();

			api.circle('a1', { color: '#ff0000' });
			api.circle('a1', null);

			expect(api.getCircles()).toEqual([]);
		});

		it('setCircles() replaces all circles', () => {
			const def = createAnnotations();
			const instance = def.createInstance(
				createMockExtensionCreateInstanceOptions({ runtimeSurface: createMinimalMockSurface() })
			);
			const api = instance.getPublic();

			api.circle('a1', { color: '#ff0000' });
			api.circle('b2', { color: '#00ff00' });

			api.setCircles([{ square: 'h8', color: '#0000ff' }]);

			const circles = api.getCircles();
			expect(circles).toHaveLength(1);
			expect(circles[0]).toEqual({ square: 'h8', color: '#0000ff' });
		});
	});

	describe('public API — arrows', () => {
		it('arrow() adds an arrow annotation', () => {
			const def = createAnnotations();
			const instance = def.createInstance(
				createMockExtensionCreateInstanceOptions({ runtimeSurface: createMinimalMockSurface() })
			);
			const api = instance.getPublic();

			api.arrow('e2', 'e4', { color: '#ff0000' });

			expect(api.getArrows()).toEqual([{ from: 'e2', to: 'e4', color: '#ff0000' }]);
		});

		it('arrow() replaces an existing arrow with same from/to', () => {
			const def = createAnnotations();
			const instance = def.createInstance(
				createMockExtensionCreateInstanceOptions({ runtimeSurface: createMinimalMockSurface() })
			);
			const api = instance.getPublic();

			api.arrow('e2', 'e4', { color: '#ff0000' });
			api.arrow('e2', 'e4', { color: '#0000ff' });

			const arrows = api.getArrows();
			expect(arrows).toHaveLength(1);
			expect(arrows[0].color).toBe('#0000ff');
		});

		it('arrow() with null removes the arrow', () => {
			const def = createAnnotations();
			const instance = def.createInstance(
				createMockExtensionCreateInstanceOptions({ runtimeSurface: createMinimalMockSurface() })
			);
			const api = instance.getPublic();

			api.arrow('e2', 'e4', { color: '#ff0000' });
			api.arrow('e2', 'e4', null);

			expect(api.getArrows()).toEqual([]);
		});

		it('setArrows() replaces all arrows', () => {
			const def = createAnnotations();
			const instance = def.createInstance(
				createMockExtensionCreateInstanceOptions({ runtimeSurface: createMinimalMockSurface() })
			);
			const api = instance.getPublic();

			api.arrow('e2', 'e4', { color: '#ff0000' });
			api.arrow('d2', 'd4', { color: '#00ff00' });

			api.setArrows([{ from: 'a1', to: 'h8', color: '#0000ff' }]);

			const arrows = api.getArrows();
			expect(arrows).toHaveLength(1);
			expect(arrows[0]).toEqual({ from: 'a1', to: 'h8', color: '#0000ff' });
		});
	});

	describe('public API — same-square arrow validation', () => {
		it('arrow(from, from, annotation) throws for same-square arrow', () => {
			const def = createAnnotations();
			const instance = def.createInstance(
				createMockExtensionCreateInstanceOptions({ runtimeSurface: createMinimalMockSurface() })
			);
			const api = instance.getPublic();

			expect(() => api.arrow('e4', 'e4', { color: '#ff0000' })).toThrow(/different squares/i);
		});

		it('arrow(from, from, null) throws for same-square arrow', () => {
			const def = createAnnotations();
			const instance = def.createInstance(
				createMockExtensionCreateInstanceOptions({ runtimeSurface: createMinimalMockSurface() })
			);
			const api = instance.getPublic();

			expect(() => api.arrow('a1', 'a1', null)).toThrow(/different squares/i);
		});

		it('setArrows with a same-square entry throws', () => {
			const def = createAnnotations();
			const instance = def.createInstance(
				createMockExtensionCreateInstanceOptions({ runtimeSurface: createMinimalMockSurface() })
			);
			const api = instance.getPublic();

			expect(() => api.setArrows([{ from: 'd4', to: 'd4', color: '#ff0000' }])).toThrow(
				/different squares/i
			);
		});

		it('setArrows does not mutate state when validation fails', () => {
			const def = createAnnotations();
			const instance = def.createInstance(
				createMockExtensionCreateInstanceOptions({ runtimeSurface: createMinimalMockSurface() })
			);
			const api = instance.getPublic();

			// Set up valid arrows first
			api.arrow('e2', 'e4', { color: '#00ff00' });

			// Attempt to set arrows with an invalid entry — should throw
			expect(() =>
				api.setArrows([
					{ from: 'a1', to: 'h8', color: '#0000ff' },
					{ from: 'c3', to: 'c3', color: '#ff0000' }
				])
			).toThrow(/different squares/i);

			// Original arrows should remain unchanged (atomic behavior)
			expect(api.getArrows()).toEqual([{ from: 'e2', to: 'e4', color: '#00ff00' }]);
		});

		it('initial annotations with same-square arrow throws', () => {
			expect(() =>
				createAnnotations({
					annotations: { arrows: [{ from: 'b2', to: 'b2', color: '#ff0000' }] }
				})
			).toThrow(/different squares/i);
		});
	});

	describe('public API — clear', () => {
		it('clear() removes all circles and arrows', () => {
			const def = createAnnotations();
			const instance = def.createInstance(
				createMockExtensionCreateInstanceOptions({ runtimeSurface: createMinimalMockSurface() })
			);
			const api = instance.getPublic();

			api.circle('a1', { color: '#f00' });
			api.circle('b2', { color: '#0f0' });
			api.arrow('e2', 'e4', { color: '#00f' });

			api.clear();

			expect(api.getCircles()).toEqual([]);
			expect(api.getArrows()).toEqual([]);
		});
	});

	describe('public API — clearOnCoreInteraction config', () => {
		it('setter clearOnCoreInteraction changes the value', () => {
			const def = createAnnotations();
			const instance = def.createInstance(
				createMockExtensionCreateInstanceOptions({ runtimeSurface: {} as never })
			);
			const api = instance.getPublic();

			expect(api.clearOnCoreInteraction).toBe(true);
			api.clearOnCoreInteraction = false;
			expect(api.clearOnCoreInteraction).toBe(false);
			api.clearOnCoreInteraction = true;
			expect(api.clearOnCoreInteraction).toBe(true);
		});
	});

	describe('lifecycle', () => {
		it('mount succeeds', () => {
			const def = createAnnotations();
			const instance = def.createInstance(
				createMockExtensionCreateInstanceOptions({ runtimeSurface: createMinimalMockSurface() })
			);
			expect(() => instance.mount!({ slotRoots: createSlotRoots() } as never)).not.toThrow();
		});

		it('unmount clears slot root children', () => {
			const def = createAnnotations();
			const instance = def.createInstance(
				createMockExtensionCreateInstanceOptions({ runtimeSurface: createMinimalMockSurface() })
			);
			const roots = createSlotRoots();
			// Add a child to simulate rendered content
			roots.overPieces.appendChild(
				document.createElementNS('http://www.w3.org/2000/svg', 'circle')
			);
			instance.mount!({ slotRoots: roots } as never);

			instance.unmount!();

			expect(roots.overPieces.children.length).toBe(0);
			expect(roots.drag.children.length).toBe(0);
		});

		it('unmount preserves annotation state', () => {
			const def = createAnnotations();
			const instance = def.createInstance(
				createMockExtensionCreateInstanceOptions({ runtimeSurface: createMinimalMockSurface() })
			);
			const api = instance.getPublic();

			api.circle('e4', { color: '#ff0000' });
			api.arrow('a1', 'h8', { color: '#00ff00' });

			instance.mount!({ slotRoots: createSlotRoots() } as never);
			instance.unmount!();

			expect(api.getCircles()).toEqual([{ square: 'e4', color: '#ff0000' }]);
			expect(api.getArrows()).toEqual([{ from: 'a1', to: 'h8', color: '#00ff00' }]);
		});

		it('unmount preserves config', () => {
			const def = createAnnotations();
			const instance = def.createInstance(
				createMockExtensionCreateInstanceOptions({ runtimeSurface: createMinimalMockSurface() })
			);
			const api = instance.getPublic();

			api.clearOnCoreInteraction = true;

			instance.mount!({ slotRoots: createSlotRoots() } as never);
			instance.unmount!();

			expect(api.clearOnCoreInteraction).toBe(true);
		});

		it('re-mount after unmount succeeds', () => {
			const def = createAnnotations();
			const instance = def.createInstance(
				createMockExtensionCreateInstanceOptions({ runtimeSurface: createMinimalMockSurface() })
			);

			instance.mount!({ slotRoots: createSlotRoots() } as never);
			instance.unmount!();
			expect(() => instance.mount!({ slotRoots: createSlotRoots() } as never)).not.toThrow();
		});

		it('destroy after mount clears slot root children', () => {
			const def = createAnnotations();
			const instance = def.createInstance(
				createMockExtensionCreateInstanceOptions({ runtimeSurface: createMinimalMockSurface() })
			);
			const roots = createSlotRoots();
			roots.overPieces.appendChild(
				document.createElementNS('http://www.w3.org/2000/svg', 'circle')
			);
			instance.mount!({ slotRoots: roots } as never);

			instance.destroy!();

			expect(roots.overPieces.children.length).toBe(0);
		});
	});

	describe('instance isolation', () => {
		it('multiple instances from same definition do not share mutable state', () => {
			const def = createAnnotations({
				annotations: { circles: [{ square: 'e4', color: '#ff0000' }] }
			});

			const instanceA = def.createInstance(
				createMockExtensionCreateInstanceOptions({ runtimeSurface: createMinimalMockSurface() })
			);
			const instanceB = def.createInstance(
				createMockExtensionCreateInstanceOptions({ runtimeSurface: createMinimalMockSurface() })
			);

			const apiA = instanceA.getPublic();
			const apiB = instanceB.getPublic();

			// Mutate instance A
			apiA.arrow('a1', 'h8', { color: '#00ff00' });
			apiA.circle('a1', { color: '#0000ff' });

			// Instance B should not be affected
			expect(apiB.getArrows()).toEqual([]);
			expect(apiB.getCircles()).toEqual([{ square: 'e4', color: '#ff0000' }]);
		});

		it('multiple instances do not share mutable config', () => {
			const def = createAnnotations();

			const instanceA = def.createInstance(
				createMockExtensionCreateInstanceOptions({ runtimeSurface: {} as never })
			);
			const instanceB = def.createInstance(
				createMockExtensionCreateInstanceOptions({ runtimeSurface: {} as never })
			);

			const apiA = instanceA.getPublic();
			const apiB = instanceB.getPublic();

			apiA.clearOnCoreInteraction = false;

			expect(apiB.clearOnCoreInteraction).toBe(true);
		});
	});
});
