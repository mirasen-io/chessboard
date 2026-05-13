import { vi } from 'vitest';
import { createAnnotations } from '../../../../../src/extensions/first-party/annotations/factory.js';
import { DirtyLayer } from '../../../../../src/extensions/first-party/annotations/types/internal.js';
import type { ExtensionRenderContext } from '../../../../../src/extensions/types/context/render.js';
import type { ExtensionRuntimeSurface } from '../../../../../src/extensions/types/surface/main.js';
import type { RuntimeReadonlyMutationSession } from '../../../../../src/runtime/mutation/types.js';
import { createMockExtensionCreateInstanceOptions } from '../../factory.js';

export const SQUARE_SIZE = 50;

export function createMockRuntimeSurface(): ExtensionRuntimeSurface {
	return {
		commands: { requestRender: vi.fn(() => true), startDrag: vi.fn(() => true) },
		animation: {} as never,
		events: { subscribeEvent: vi.fn(), unsubscribeEvent: vi.fn() },
		transientVisuals: { subscribe: vi.fn(), unsubscribe: vi.fn() },
		invalidation: {
			get dirtyLayers() {
				return 0;
			},
			markDirty: vi.fn(),
			clearDirty: vi.fn(),
			clear: vi.fn()
		}
	} as never;
}

export function createSlotRoots() {
	return {
		defs: document.createElementNS('http://www.w3.org/2000/svg', 'defs'),
		overPieces: document.createElementNS('http://www.w3.org/2000/svg', 'g'),
		drag: document.createElementNS('http://www.w3.org/2000/svg', 'g')
	};
}

export function createGeometry(squareSize = SQUARE_SIZE) {
	return {
		sceneSize: { width: squareSize * 8, height: squareSize * 8 },
		boardRect: { x: 0, y: 0, width: squareSize * 8, height: squareSize * 8 },
		squareSize,
		orientation: 0,
		getSquareRect: (sq: number) => ({
			x: (sq % 8) * squareSize,
			y: Math.floor(sq / 8) * squareSize,
			width: squareSize,
			height: squareSize
		})
	};
}

export function createRenderContext(opts: { dirtyLayers?: number } = {}): ExtensionRenderContext {
	return {
		currentFrame: {
			state: {} as never,
			layout: { geometry: createGeometry() }
		},
		invalidation: { dirtyLayers: opts.dirtyLayers ?? DirtyLayer.COMMITTED }
	} as never;
}

export function createMockMutation(hasCauses: string[] = []): RuntimeReadonlyMutationSession {
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
	} as unknown as RuntimeReadonlyMutationSession;
}

export function createRenderableUpdateContext(opts: { causes?: string[] }) {
	const markDirty = vi.fn();
	return {
		context: {
			previousFrame: null,
			mutation: createMockMutation(opts.causes ?? []),
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

export function setupMountedInstance(opts?: { surface?: ExtensionRuntimeSurface }) {
	const def = createAnnotations();
	const surface = opts?.surface ?? createMockRuntimeSurface();
	const instance = def.createInstance(
		createMockExtensionCreateInstanceOptions({ runtimeSurface: surface })
	);
	const api = instance.getPublic();
	const roots = createSlotRoots();
	instance.mount!({ slotRoots: roots } as never);
	return { instance, api, roots, surface };
}
