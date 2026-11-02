import { describe, expect, it } from 'vitest';
import { createMainRenderer } from '../../../../../src/extensions/first-party/main-renderer/factory.js';
import { DirtyLayer } from '../../../../../src/extensions/first-party/main-renderer/types/extension.js';
import type {
	MainRendererInitOptions,
	MainRendererSetConfigOptions
} from '../../../../../src/extensions/first-party/main-renderer/types/public.js';
import {
	createDragTransientVisualsContext,
	createDragUpdateContext,
	createLiftedPieceDragSession
} from '../../../../test-utils/extensions/first-party/main-renderer/drag.js';
import {
	createMainRendererRuntimeSurface,
	mountMainRenderer
} from '../../../../test-utils/extensions/first-party/main-renderer/factory.js';
import { createPiecesRenderContext } from '../../../../test-utils/extensions/first-party/main-renderer/pieces.js';
import { createMockExtensionCreateInstanceOptions } from '../../../../test-utils/extensions/factory.js';

function createInstance(initOptions?: MainRendererInitOptions) {
	const mocks = createMainRendererRuntimeSurface();
	const def = createMainRenderer(initOptions);
	const instance = def.createInstance(
		createMockExtensionCreateInstanceOptions({ runtimeSurface: mocks.surface })
	);
	const api = instance.getPublic();
	return { instance, api, ...mocks };
}

function createMountedInstance(initOptions?: MainRendererInitOptions) {
	const ctx = createInstance(initOptions);
	const slotRoots = mountMainRenderer(ctx.instance);
	return { ...ctx, slotRoots };
}

describe('main-renderer public API – getConfig', () => {
	it('returns a snapshot containing colors, drag, and pieceUrls', () => {
		const { api } = createInstance();
		const cfg = api.getConfig();
		expect(cfg.colors.board).toMatchObject({ light: expect.any(String), dark: expect.any(String) });
		expect(cfg.colors.coordinates).toMatchObject({
			light: expect.any(String),
			dark: expect.any(String)
		});
		expect(cfg.drag).toMatchObject({
			pieceScale: expect.any(Number),
			pieceAnchor: expect.any(String)
		});
		expect(Object.keys(cfg.pieceUrls).sort()).toEqual(
			['bB', 'bK', 'bN', 'bP', 'bQ', 'bR', 'wB', 'wK', 'wN', 'wP', 'wQ', 'wR'].sort()
		);
	});

	it('default-constructed renderer exposes animation.durationMs === 180', () => {
		const { api } = createInstance();
		expect(api.getConfig().animation.durationMs).toBe(180);
	});

	it('mutating the returned snapshot does not affect internal state', () => {
		const { api } = createInstance();
		const snapshot = api.getConfig() as unknown as { colors: { board: { light: string } } };
		snapshot.colors.board.light = 'mutated-by-caller';
		const next = api.getConfig();
		expect(next.colors.board.light).not.toBe('mutated-by-caller');
	});

	it('mutating the returned animation snapshot does not affect a subsequent getConfig()', () => {
		const { api } = createInstance();
		const snapshot = api.getConfig() as unknown as { animation: { durationMs: number } };
		snapshot.animation.durationMs = 9999;
		expect(api.getConfig().animation.durationMs).toBe(180);
	});
});

describe('main-renderer public API – setConfig', () => {
	it('updates drag config and getConfig().drag reflects it', () => {
		const { api } = createInstance();
		const before = api.getConfig().drag;
		api.setConfig({ drag: { pieceScale: 1.2 } });
		const after = api.getConfig().drag;
		expect(after.pieceScale).toBe(1.2);
		expect(after.pieceAnchor).toBe(before.pieceAnchor);
	});

	it('updates colors.board.light and leaves other color fields unchanged', () => {
		const { api } = createInstance();
		const before = api.getConfig().colors;
		api.setConfig({ colors: { board: { light: '#ffffff' } } });
		const after = api.getConfig().colors;
		expect(after.board.light).toBe('#ffffff');
		expect(after.board.dark).toBe(before.board.dark);
		expect(after.coordinates).toEqual(before.coordinates);
	});

	it('setConfig({ colors }) marks Board dirty layer and requests a render', () => {
		const { api, markDirty, requestRender } = createInstance();
		markDirty.mockClear();
		requestRender.mockClear();
		api.setConfig({ colors: { board: { light: '#aabbcc' } } });
		expect(markDirty).toHaveBeenCalledWith(DirtyLayer.Board);
		expect(requestRender).toHaveBeenCalledWith({ state: true });
	});

	it('setConfig({ colors: { coordinates } }) marks Coordinates dirty layer and requests a render', () => {
		const { api, markDirty, requestRender } = createInstance();
		markDirty.mockClear();
		requestRender.mockClear();
		api.setConfig({ colors: { coordinates: { light: '#112233' } } });
		expect(markDirty).toHaveBeenCalledWith(DirtyLayer.Coordinates);
		expect(requestRender).toHaveBeenCalledWith({ state: true });
	});

	it('setConfig({ drag }) does not request a render or mark dirty', () => {
		const { api, markDirty, requestRender } = createInstance();
		markDirty.mockClear();
		requestRender.mockClear();
		api.setConfig({ drag: { pieceScale: 1.7 } });
		expect(markDirty).not.toHaveBeenCalled();
		expect(requestRender).not.toHaveBeenCalled();
	});

	it('setConfig({}) is a no-op: snapshot unchanged, no render requested', () => {
		const { api, markDirty, requestRender } = createInstance();
		const before = api.getConfig();
		markDirty.mockClear();
		requestRender.mockClear();
		api.setConfig({});
		const after = api.getConfig();
		expect(after).toEqual(before);
		expect(markDirty).not.toHaveBeenCalled();
		expect(requestRender).not.toHaveBeenCalled();
	});

	it('setConfig with invalid drag value is rejected and previous config is retained', () => {
		const { api } = createInstance();
		const before = api.getConfig();
		expect(() => api.setConfig({ drag: { pieceScale: 0 } })).toThrow();
		const after = api.getConfig();
		expect(after).toEqual(before);
	});

	it('runtime input containing pieceUrls does not change pieceUrls', () => {
		const { api } = createInstance();
		const before = api.getConfig().pieceUrls;
		api.setConfig({
			pieceUrls: { wK: 'rogue-url' }
		} as unknown as MainRendererSetConfigOptions);
		const after = api.getConfig().pieceUrls;
		expect(after).toEqual(before);
	});

	it('setConfig({ colors }) on a mounted renderer causes the next render to use the new color', () => {
		const { instance, api, slotRoots } = createMountedInstance();
		api.setConfig({ colors: { board: { light: '#aabbcc' } } });
		instance.render!(createPiecesRenderContext({ dirtyLayers: DirtyLayer.Board }));
		const lightFills = Array.from(slotRoots.board.children).map((el) =>
			(el as SVGElement).getAttribute('fill')
		);
		expect(lightFills).toContain('#aabbcc');
	});

	it('setConfig({ animation }) updates animation config without marking dirty or requesting render', () => {
		const { api, markDirty, requestRender } = createInstance();
		markDirty.mockClear();
		requestRender.mockClear();
		api.setConfig({ animation: { durationMs: 75 } });
		expect(api.getConfig().animation.durationMs).toBe(75);
		expect(markDirty).not.toHaveBeenCalled();
		expect(requestRender).not.toHaveBeenCalled();
	});

	it('setConfig({ animation, colors }) updates animation and preserves colors invalidation', () => {
		const { api, markDirty, requestRender } = createInstance();
		markDirty.mockClear();
		requestRender.mockClear();
		api.setConfig({
			animation: { durationMs: 75 },
			colors: { board: { light: '#ffffff' } }
		});
		expect(api.getConfig().animation.durationMs).toBe(75);
		expect(api.getConfig().colors.board.light).toBe('#ffffff');
		expect(markDirty).toHaveBeenCalledWith(DirtyLayer.Board);
		expect(requestRender).toHaveBeenCalledWith({ state: true });
	});

	it('setConfig with invalid animation.durationMs is rejected and previous config is retained', () => {
		const { api } = createInstance();
		const before = api.getConfig().animation.durationMs;
		expect(() => api.setConfig({ animation: { durationMs: -5 } })).toThrow();
		expect(api.getConfig().animation.durationMs).toBe(before);
	});

	// Type-error fixture: pieceUrls is rejected at the type level by MainRendererSetConfigOptions.
	// Wrapped in a function never invoked at runtime; validates compile-time behavior only.
	function _typeErrorFixture(api: ReturnType<typeof createInstance>['api']) {
		// @ts-expect-error pieceUrls is excluded from MainRendererSetConfigOptions
		api.setConfig({ pieceUrls: { wK: 'x' } });
	}
	void _typeErrorFixture;
});

describe('main-renderer public API – removed legacy methods', () => {
	it('exposes only setConfig and getConfig (no legacy drag-only setter or getter)', () => {
		const { api } = createInstance();
		const keys = Object.keys(api as unknown as Record<string, unknown>).sort();
		expect(keys).toEqual(['getConfig', 'setConfig']);
		expect(typeof api.setConfig).toBe('function');
		expect(typeof api.getConfig).toBe('function');
	});
});

describe('main-renderer public API – setConfig({ drag }) propagates to next drag transient render', () => {
	it('updates dragged-piece SVG attributes on the next renderTransientVisuals after setConfig', () => {
		const { instance, api, slotRoots } = createMountedInstance();

		// Start a drag session
		instance.onUpdate!(createDragUpdateContext({ dragSession: createLiftedPieceDragSession() }));

		// First transient render with desktop default config (pieceScale=1, anchor=center)
		instance.renderTransientVisuals!(
			createDragTransientVisualsContext({
				sceneSize: 400,
				boardClampedPoint: { x: 200, y: 150 }
			})
		);
		const node = slotRoots.drag.children[0];
		expect(node.getAttribute('width')).toBe('50');
		expect(node.getAttribute('x')).toBe('175');
		expect(node.getAttribute('y')).toBe('125');

		// Update drag config at runtime — without remount, without recreating drag subsystem
		api.setConfig({ drag: { pieceScale: 1.4, pieceAnchor: 'bottom' } });

		// Next transient render reflects the new config on the SAME node (no recreation)
		instance.renderTransientVisuals!(
			createDragTransientVisualsContext({
				sceneSize: 400,
				boardClampedPoint: { x: 200, y: 150 }
			})
		);
		expect(slotRoots.drag.children.length).toBe(1);
		expect(slotRoots.drag.children[0]).toBe(node); // same DOM node — no recreation
		// renderedSize = 50 * 1.4 = 70
		expect(node.getAttribute('width')).toBe('70');
		expect(node.getAttribute('height')).toBe('70');
		expect(node.getAttribute('x')).toBe('165'); // 200 - 35
		// y = 150 - 70 = 80 (bottom-center anchor)
		expect(node.getAttribute('y')).toBe('80');
	});

	it('setConfig({ drag }) does not subscribe or unsubscribe transient visuals', () => {
		const { instance, api, subscribe, unsubscribe } = createMountedInstance();

		// Start drag — subscribe called once
		instance.onUpdate!(createDragUpdateContext({ dragSession: createLiftedPieceDragSession() }));
		const subscribeCallsBefore = subscribe.mock.calls.length;
		const unsubscribeCallsBefore = unsubscribe.mock.calls.length;

		api.setConfig({ drag: { pieceScale: 1.7, pieceAnchor: 'bottom' } });

		expect(subscribe.mock.calls.length).toBe(subscribeCallsBefore);
		expect(unsubscribe.mock.calls.length).toBe(unsubscribeCallsBefore);
	});

	it('setConfig({ drag: { pieceAnchorOffsetY } }) is observed on the next drag transient render', () => {
		const { instance, api, slotRoots } = createMountedInstance();

		// Start a drag session
		instance.onUpdate!(createDragUpdateContext({ dragSession: createLiftedPieceDragSession() }));

		// First render with the desktop default offset (0): center anchor, point (200,150)
		instance.renderTransientVisuals!(
			createDragTransientVisualsContext({
				sceneSize: 400,
				boardClampedPoint: { x: 200, y: 150 }
			})
		);
		const node = slotRoots.drag.children[0];
		expect(node.getAttribute('y')).toBe('125');

		// Update only the offset at runtime — no remount
		api.setConfig({ drag: { pieceAnchorOffsetY: 0.2 } });

		// Same DOM node, same anchor, but y shifted by squareSize * 0.2 = 10
		instance.renderTransientVisuals!(
			createDragTransientVisualsContext({
				sceneSize: 400,
				boardClampedPoint: { x: 200, y: 150 }
			})
		);
		expect(slotRoots.drag.children.length).toBe(1);
		expect(slotRoots.drag.children[0]).toBe(node);
		expect(node.getAttribute('y')).toBe('135'); // 125 + 10
	});
});
