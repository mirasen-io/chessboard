import { vi } from 'vitest';
import type { ExtensionRuntimeSurface } from '../../../../../src/extensions/types/surface/main.js';
import { createSvgElement } from '../../../dom/svg.js';

/**
 * Creates a mock ExtensionRuntimeSurface suitable for top-level main-renderer factory tests.
 * Includes transientVisuals (for drag), animation.submit/getAll (for animation),
 * commands.requestRender, and invalidation.markDirty (for setConfig).
 */
export function createMainRendererRuntimeSurface() {
	const subscribe = vi.fn();
	const unsubscribe = vi.fn();
	let nextSessionId = 1;
	const submit = vi.fn((opts: { duration: number }) => ({
		id: nextSessionId++,
		startTime: 0,
		duration: opts.duration,
		status: 'submitted' as const
	}));
	const getAll = vi.fn(
		() => [] as Array<{ id: number; startTime: number; duration: number; status: string }>
	);
	const requestRender = vi.fn(() => true);
	const markDirty = vi.fn();
	const clearDirty = vi.fn();
	const clear = vi.fn();

	const surface = {
		transientVisuals: { subscribe, unsubscribe },
		animation: { submit, getAll },
		commands: { requestRender },
		invalidation: { dirtyLayers: 0, markDirty, clearDirty, clear }
	} as unknown as ExtensionRuntimeSurface;

	return { surface, subscribe, unsubscribe, submit, getAll, requestRender, markDirty };
}

/**
 * Creates slot roots matching the main-renderer EXTENSION_SLOTS:
 * ['defs', 'board', 'coordinates', 'pieces', 'animation', 'drag']
 */
export function createMainRendererSlotRoots() {
	return {
		defs: createSvgElement('defs'),
		board: createSvgElement('g'),
		coordinates: createSvgElement('g'),
		pieces: createSvgElement('g'),
		animation: createSvgElement('g'),
		drag: createSvgElement('g')
	};
}

/**
 * Convenience: mounts a main-renderer instance with the provided or default slot roots.
 */
export function mountMainRenderer(
	instance: { mount?(env: { slotRoots: ReturnType<typeof createMainRendererSlotRoots> }): void },
	slotRoots?: ReturnType<typeof createMainRendererSlotRoots>
) {
	const roots = slotRoots ?? createMainRendererSlotRoots();
	instance.mount!({ slotRoots: roots });
	return roots;
}

/**
 * Creates a minimal context suitable for calling instance.onAnimationFinished.
 * The context shape matches ExtensionAnimationFinishedContext (same as ExtensionCleanAnimationContext).
 */
export function createOnAnimationFinishedContext() {
	return {
		finishedSessions: [],
		currentFrame: {
			state: {
				interaction: { dragSession: null },
				change: { deferredUIMoveRequest: null }
			},
			layout: { geometry: {} }
		},
		invalidation: { dirtyLayers: 0, markDirty: vi.fn(), clearDirty: vi.fn(), clear: vi.fn() }
	} as never;
}
