import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_CONFIG } from '../../../../src/extensions/first-party/annotations/constants.js';
import { createAnnotations } from '../../../../src/extensions/first-party/annotations/factory.js';
import type { AnnotationsPublicAPI } from '../../../../src/extensions/first-party/annotations/types/public.js';
import type { AnyExtensionInstance } from '../../../../src/extensions/types/extension.js';
import { createMockExtensionCreateInstanceOptions } from '../../../test-utils/extensions/factory.js';
import { createSlotRoots } from '../../../test-utils/extensions/first-party/annotations/helpers.js';

function createMountedAnnotations(initConfig?: Parameters<typeof createAnnotations>[0]) {
	const startDrag = vi.fn(() => true);
	const surface = {
		commands: { startDrag, requestRender: vi.fn(() => true) },
		animation: { submit: vi.fn(), cancel: vi.fn(), getAll: vi.fn(() => []) },
		transientVisuals: { subscribe: vi.fn(), unsubscribe: vi.fn() },
		events: { subscribeEvent: vi.fn(), unsubscribeEvent: vi.fn() },
		invalidation: { dirtyLayers: 0, markDirty: vi.fn(), clearDirty: vi.fn(), clear: vi.fn() }
	} as never;

	const def = createAnnotations(initConfig);
	const instance = def.createInstance(
		createMockExtensionCreateInstanceOptions({ runtimeSurface: surface })
	);
	instance.mount!({ slotRoots: createSlotRoots() } as never);
	const api = instance.getPublic!() as AnnotationsPublicAPI;
	return { instance: instance as AnyExtensionInstance, api, startDrag };
}

function pointerDown(
	button: number,
	modifiers?: { ctrlKey?: boolean; shiftKey?: boolean; altKey?: boolean; metaKey?: boolean }
): PointerEvent {
	const event = new PointerEvent('pointerdown', {
		button,
		ctrlKey: modifiers?.ctrlKey ?? false,
		shiftKey: modifiers?.shiftKey ?? false,
		altKey: modifiers?.altKey ?? false,
		metaKey: modifiers?.metaKey ?? false
	});
	return event;
}

function drawGestureCircle(
	instance: AnyExtensionInstance,
	square: number,
	button: number,
	modifiers?: { ctrlKey?: boolean; shiftKey?: boolean; altKey?: boolean; metaKey?: boolean }
): void {
	instance.onEvent!({
		rawEvent: pointerDown(button, modifiers),
		sceneEvent: { targetSquare: square },
		runtimeInteractionActionPreview: null
	} as never);
	instance.completeDrag!({
		type: 'ext:draw',
		sourceSquare: square,
		sourcePieceCode: null,
		targetSquare: square,
		owner: 'annotations'
	} as never);
}

function drawGestureArrow(
	instance: AnyExtensionInstance,
	from: number,
	to: number,
	button: number,
	modifiers?: { ctrlKey?: boolean; shiftKey?: boolean; altKey?: boolean; metaKey?: boolean }
): void {
	instance.onEvent!({
		rawEvent: pointerDown(button, modifiers),
		sceneEvent: { targetSquare: from },
		runtimeInteractionActionPreview: null
	} as never);
	instance.completeDrag!({
		type: 'ext:draw',
		sourceSquare: from,
		sourcePieceCode: null,
		targetSquare: to,
		owner: 'annotations'
	} as never);
}

describe('drawModifier — public API gesture tests', () => {
	it('default/null drawModifier with no event modifiers commits default color', () => {
		const { instance, api } = createMountedAnnotations();
		drawGestureCircle(instance, 10, 2);

		const circles = api.getCircles();
		expect(circles).toHaveLength(1);
		expect(circles[0].color).toBe(DEFAULT_CONFIG.colors.none);
	});

	it('default/null drawModifier with ctrlKey commits ctrl color', () => {
		const { instance, api } = createMountedAnnotations();
		drawGestureCircle(instance, 10, 2, { ctrlKey: true });

		const circles = api.getCircles();
		expect(circles).toHaveLength(1);
		expect(circles[0].color).toBe(DEFAULT_CONFIG.colors.ctrl);
	});

	it('default/null drawModifier with shiftKey commits shift color', () => {
		const { instance, api } = createMountedAnnotations();
		drawGestureCircle(instance, 10, 2, { shiftKey: true });

		const circles = api.getCircles();
		expect(circles).toHaveLength(1);
		expect(circles[0].color).toBe(DEFAULT_CONFIG.colors.shift);
	});

	it('forced drawModifier = "shift" commits shift color without physical key', () => {
		const { instance, api } = createMountedAnnotations({
			config: { drawModifier: 'shift' }
		});
		drawGestureCircle(instance, 10, 2);

		const circles = api.getCircles();
		expect(circles).toHaveLength(1);
		expect(circles[0].color).toBe(DEFAULT_CONFIG.colors.shift);
	});

	it('forced drawModifier = "ctrl" commits ctrl color without physical key', () => {
		const { instance, api } = createMountedAnnotations({
			config: { drawModifier: 'ctrl' }
		});
		drawGestureArrow(instance, 0, 9, 2);

		const arrows = api.getArrows();
		expect(arrows).toHaveLength(1);
		expect(arrows[0].color).toBe(DEFAULT_CONFIG.colors.ctrl);
	});

	it('forced drawModifier wins over actual event modifiers', () => {
		const { instance, api } = createMountedAnnotations({
			config: { drawModifier: 'shift' }
		});
		drawGestureCircle(instance, 10, 2, { ctrlKey: true });

		const circles = api.getCircles();
		expect(circles).toHaveLength(1);
		expect(circles[0].color).toBe(DEFAULT_CONFIG.colors.shift);
	});

	it('setting api.drawModifier affects the next gesture', () => {
		const { instance, api } = createMountedAnnotations();
		api.drawModifier = 'alt';
		drawGestureCircle(instance, 20, 2);

		const circles = api.getCircles();
		expect(circles).toHaveLength(1);
		expect(circles[0].color).toBe(DEFAULT_CONFIG.colors.alt);
	});

	it('setting api.drawModifier back to null restores event-modifier resolution', () => {
		const { instance, api } = createMountedAnnotations({
			config: { drawModifier: 'shift' }
		});
		api.drawModifier = null;
		drawGestureCircle(instance, 20, 2, { altKey: true });

		const circles = api.getCircles();
		expect(circles).toHaveLength(1);
		expect(circles[0].color).toBe(DEFAULT_CONFIG.colors.alt);
	});

	it('drawButton = 0 with drawModifier = null commits default color', () => {
		const { instance, api } = createMountedAnnotations({
			config: { drawButton: 0, drawModifier: null }
		});
		drawGestureCircle(instance, 5, 0);

		const circles = api.getCircles();
		expect(circles).toHaveLength(1);
		expect(circles[0].color).toBe(DEFAULT_CONFIG.colors.none);
	});

	it('drawButton = 0 with drawModifier = "shift" commits shift color', () => {
		const { instance, api } = createMountedAnnotations({
			config: { drawButton: 0, drawModifier: 'shift' }
		});
		drawGestureCircle(instance, 5, 0);

		const circles = api.getCircles();
		expect(circles).toHaveLength(1);
		expect(circles[0].color).toBe(DEFAULT_CONFIG.colors.shift);
	});

	it('changing drawModifier after pointerdown does not change the active gesture color', () => {
		const { instance, api } = createMountedAnnotations({
			config: { drawModifier: 'shift' }
		});

		// Start draw gesture
		instance.onEvent!({
			rawEvent: pointerDown(2),
			sceneEvent: { targetSquare: 10 },
			runtimeInteractionActionPreview: null
		} as never);

		// Mutate drawModifier mid-gesture
		api.drawModifier = 'ctrl';

		// Complete the gesture
		instance.completeDrag!({
			type: 'ext:draw',
			sourceSquare: 10,
			sourcePieceCode: null,
			targetSquare: 10,
			owner: 'annotations'
		} as never);

		const circles = api.getCircles();
		expect(circles).toHaveLength(1);
		expect(circles[0].color).toBe(DEFAULT_CONFIG.colors.shift);
	});
});

describe('drawModifier — init config', () => {
	it('drawModifier = "meta" provided through init config is applied', () => {
		const { instance, api } = createMountedAnnotations({
			config: { drawModifier: 'meta' }
		});
		drawGestureCircle(instance, 10, 2);

		const circles = api.getCircles();
		expect(circles).toHaveLength(1);
		expect(circles[0].color).toBe(DEFAULT_CONFIG.colors.meta);
	});

	it('explicit null drawModifier in init config preserves event-modifier behavior', () => {
		const { instance, api } = createMountedAnnotations({
			config: { drawModifier: null }
		});
		drawGestureCircle(instance, 10, 2, { metaKey: true });

		const circles = api.getCircles();
		expect(circles).toHaveLength(1);
		expect(circles[0].color).toBe(DEFAULT_CONFIG.colors.meta);
	});
});
