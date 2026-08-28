import { describe, expect, it, vi } from 'vitest';
import { createCheck } from '../../../../src/extensions/first-party/check/factory.js';
import { EXTENSION_ID } from '../../../../src/extensions/first-party/check/types.js';
import type { ExtensionRuntimeSurface } from '../../../../src/extensions/types/surface/main.js';
import {
	builtInExtensionFactoryMap,
	DefaultBuiltinChessboardExtensions
} from '../../../../src/extensions/types/wrapper.js';
import { createMockExtensionCreateInstanceOptions } from '../../../test-utils/extensions/factory.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

function createMockRuntimeSurface() {
	const markDirty = vi.fn();
	const requestRender = vi.fn(() => true);
	const surface: ExtensionRuntimeSurface = {
		commands: { requestRender } as never,
		animation: {} as never,
		events: { subscribeEvent: vi.fn(), unsubscribeEvent: vi.fn() },
		transientVisuals: { subscribe: vi.fn(), unsubscribe: vi.fn() },
		invalidation: {
			get dirtyLayers() {
				return 0;
			},
			markDirty,
			clearDirty: vi.fn(),
			clear: vi.fn()
		}
	};
	return { surface, markDirty, requestRender };
}

function createSlotRoots() {
	return {
		defs: document.createElementNS(SVG_NS, 'defs'),
		underPieces: document.createElementNS(SVG_NS, 'g')
	};
}

function createGeometry() {
	return {
		sceneSize: { width: 400, height: 400 },
		boardRect: { x: 0, y: 0, width: 400, height: 400 },
		squareSize: 50,
		orientation: 0,
		getSquareRect: (sq: number) => ({
			x: (sq % 8) * 50,
			y: Math.floor(sq / 8) * 50,
			width: 50,
			height: 50
		})
	};
}

function createMockMutation(hasCauses: string[] = []) {
	return {
		hasMutation(match?: { causes?: Iterable<string> }) {
			if (!match || !match.causes) return hasCauses.length > 0;
			for (const cause of match.causes) {
				if (hasCauses.includes(cause)) return true;
			}
			return false;
		},
		getPayloads: vi.fn(() => undefined),
		getAll: vi.fn(() => new Map())
	};
}

function createRenderableUpdateContext(causes: string[]) {
	const markDirty = vi.fn();
	return {
		context: {
			previousFrame: null,
			mutation: createMockMutation(causes),
			currentFrame: {
				isMounted: true,
				state: {},
				layout: {
					sceneSize: { width: 400, height: 400 },
					orientation: 0,
					geometry: createGeometry(),
					layoutEpoch: 1
				}
			},
			invalidation: { dirtyLayers: 0, markDirty, clearDirty: vi.fn(), clear: vi.fn() }
		} as never,
		markDirty
	};
}

function createRenderContext(dirtyLayers = 1) {
	return {
		currentFrame: { layout: { geometry: createGeometry() } },
		invalidation: { dirtyLayers }
	} as never;
}

function setupInstance(config?: Parameters<typeof createCheck>[0]) {
	const def = createCheck(config);
	const { surface, markDirty, requestRender } = createMockRuntimeSurface();
	const instance = def.createInstance(
		createMockExtensionCreateInstanceOptions({ runtimeSurface: surface })
	);
	const api = instance.getPublic();
	const roots = createSlotRoots();
	instance.mount!({ slotRoots: roots } as never);
	return { instance, api, roots, markDirty, requestRender };
}

describe('createCheck', () => {
	it('creates a definition with the expected extension id', () => {
		const def = createCheck();
		expect(def.id).toBe(EXTENSION_ID);
		expect(def.id).toBe('check');
	});

	it('createInstance returns an instance with expected hooks', () => {
		const def = createCheck();
		const { surface } = createMockRuntimeSurface();
		const instance = def.createInstance(
			createMockExtensionCreateInstanceOptions({ runtimeSurface: surface })
		);
		expect(instance.id).toBe(EXTENSION_ID);
		expect(instance.mount).toBeDefined();
		expect(instance.unmount).toBeDefined();
		expect(instance.destroy).toBeDefined();
		expect(instance.onUpdate).toBeDefined();
		expect(instance.render).toBeDefined();
		expect(instance.getPublic).toBeDefined();
	});
});

describe('check public square property', () => {
	it('defaults to null', () => {
		const { api } = setupInstance();
		expect(api.square).toBe(null);
	});

	it('set -> get round-trips as a SquareString', () => {
		const { api } = setupInstance();
		api.square = 'e1';
		expect(api.square).toBe('e1');
	});

	it('setting a square marks dirty and requests render', () => {
		const { api, markDirty, requestRender } = setupInstance();
		api.square = 'e1';
		expect(markDirty).toHaveBeenCalledTimes(1);
		expect(markDirty).toHaveBeenCalledWith(1); // DirtyLayer.Highlight
		expect(requestRender).toHaveBeenCalledTimes(1);
		expect(requestRender).toHaveBeenCalledWith({ state: true });
	});

	it('setting the same square again is a no-op', () => {
		const { api, markDirty, requestRender } = setupInstance();
		api.square = 'e1';
		markDirty.mockClear();
		requestRender.mockClear();
		api.square = 'e1';
		expect(markDirty).not.toHaveBeenCalled();
		expect(requestRender).not.toHaveBeenCalled();
	});

	it('setting null clears the square and requests render', () => {
		const { api, markDirty, requestRender } = setupInstance();
		api.square = 'e1';
		markDirty.mockClear();
		requestRender.mockClear();
		api.square = null;
		expect(api.square).toBe(null);
		expect(markDirty).toHaveBeenCalledTimes(1);
		expect(requestRender).toHaveBeenCalledTimes(1);
	});

	it('setting null while already null is a no-op', () => {
		const { api, markDirty, requestRender } = setupInstance();
		api.square = null;
		expect(markDirty).not.toHaveBeenCalled();
		expect(requestRender).not.toHaveBeenCalled();
	});

	it('rejects an invalid square value', () => {
		const { api, markDirty, requestRender } = setupInstance();
		expect(() => {
			(api as { square: unknown }).square = 'z9';
		}).toThrow();
		expect(markDirty).not.toHaveBeenCalled();
		expect(requestRender).not.toHaveBeenCalled();
	});
});

describe('check render', () => {
	it('renders nothing when no square is set', () => {
		const { instance, roots } = setupInstance();
		instance.render!(createRenderContext());
		expect(roots.underPieces.children.length).toBe(0);
		expect(roots.defs.children.length).toBe(0);
	});

	it('renders a single rect below pieces plus a gradient in defs', () => {
		const { instance, api, roots } = setupInstance();
		api.square = 'e1'; // sq 4
		instance.render!(createRenderContext());

		expect(roots.underPieces.children.length).toBe(1);
		const rect = roots.underPieces.children[0];
		expect(rect.tagName).toBe('rect');
		expect(rect.getAttribute('data-chessboard-id')).toBe('check-square-highlight');
		expect(rect.getAttribute('x')).toBe('200'); // (4 % 8) * 50
		expect(rect.getAttribute('y')).toBe('0');

		expect(roots.defs.children.length).toBe(1);
		const gradient = roots.defs.children[0];
		expect(gradient.tagName).toBe('radialGradient');
		// rect references the gradient by id
		expect(rect.getAttribute('fill')).toBe(`url(#${gradient.getAttribute('id')})`);
	});

	it('highlights at most one square and moves it when changed', () => {
		const { instance, api, roots } = setupInstance();
		api.square = 'e1'; // sq 4 -> x 200 y 0
		instance.render!(createRenderContext());
		const rect = roots.underPieces.children[0];
		expect(rect.getAttribute('x')).toBe('200');
		expect(rect.getAttribute('y')).toBe('0');

		api.square = 'e8'; // sq 60 -> x 200 y 350
		instance.render!(createRenderContext());
		// still a single rect (same element updated)
		expect(roots.underPieces.children.length).toBe(1);
		expect(roots.underPieces.children[0]).toBe(rect);
		expect(rect.getAttribute('y')).toBe('350');
	});

	it('removes both the rect and the gradient when cleared', () => {
		const { instance, api, roots } = setupInstance();
		api.square = 'e1';
		instance.render!(createRenderContext());
		expect(roots.underPieces.children.length).toBe(1);
		expect(roots.defs.children.length).toBe(1);

		api.square = null;
		instance.render!(createRenderContext());
		expect(roots.underPieces.children.length).toBe(0);
		expect(roots.defs.children.length).toBe(0);
	});

	it('default visual is a red radial glow fading to transparent', () => {
		const { instance, api, roots } = setupInstance();
		api.square = 'e1';
		instance.render!(createRenderContext());
		const gradient = roots.defs.children[0];
		const stops = Array.from(gradient.children);
		expect(stops.length).toBe(4);
		expect(stops[0].getAttribute('stop-color')).toBe('rgb(255, 0, 0)');
		expect(stops[0].getAttribute('stop-opacity')).toBe('1');
		// last stop fades fully transparent
		expect(stops[stops.length - 1].getAttribute('stop-opacity')).toBe('0');
	});

	it('applies configured color and opacity to the gradient', () => {
		const { instance, api, roots } = setupInstance({ color: 'rgb(0, 0, 255)', opacity: 0.5 });
		api.square = 'e1';
		instance.render!(createRenderContext());
		const gradient = roots.defs.children[0];
		const stops = Array.from(gradient.children);
		expect(stops[0].getAttribute('stop-color')).toBe('rgb(0, 0, 255)');
		expect(stops[0].getAttribute('stop-opacity')).toBe('0.5');
	});
});

describe('check geometry realignment', () => {
	it('marks dirty on layout.refreshGeometry when renderable', () => {
		const { instance } = setupInstance();
		const { context, markDirty } = createRenderableUpdateContext(['layout.refreshGeometry']);
		instance.onUpdate!(context);
		expect(markDirty).toHaveBeenCalledWith(1);
	});

	it('does not mark dirty on unrelated mutations', () => {
		const { instance } = setupInstance();
		const { context, markDirty } = createRenderableUpdateContext(['state.board.setPosition']);
		instance.onUpdate!(context);
		expect(markDirty).not.toHaveBeenCalled();
	});

	it('re-renders the rect at the same square without recreating the gradient', () => {
		const { instance, api, roots } = setupInstance();
		api.square = 'e1';
		instance.render!(createRenderContext());
		const gradient = roots.defs.children[0];
		const rect = roots.underPieces.children[0];

		// A geometry refresh triggers another render for the same square.
		instance.render!(createRenderContext());
		expect(roots.defs.children.length).toBe(1);
		expect(roots.defs.children[0]).toBe(gradient); // gradient not recreated
		expect(roots.underPieces.children[0]).toBe(rect); // rect reused
	});
});

describe('check lifecycle', () => {
	it('unmount clears slot root children', () => {
		const { instance, api, roots } = setupInstance();
		api.square = 'e1';
		instance.render!(createRenderContext());
		instance.unmount!();
		expect(roots.underPieces.children.length).toBe(0);
		expect(roots.defs.children.length).toBe(0);
	});

	it('destroy clears slot root children', () => {
		const { instance, api, roots } = setupInstance();
		api.square = 'e1';
		instance.render!(createRenderContext());
		instance.destroy!();
		expect(roots.underPieces.children.length).toBe(0);
		expect(roots.defs.children.length).toBe(0);
	});
});

describe('check registration', () => {
	it('is present in the built-in extension factory map', () => {
		expect(builtInExtensionFactoryMap).toHaveProperty('check');
		expect(builtInExtensionFactoryMap.check).toBe(createCheck);
	});

	it('is included in the default built-in extension set', () => {
		expect(DefaultBuiltinChessboardExtensions).toContain('check');
	});
});
