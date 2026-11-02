import { vi } from 'vitest';
import type { ExtensionRuntimeSurface } from '../../../../../src/extensions/types/surface/main.js';
import { createRenderGeometry } from '../../../../../src/layout/geometry/factory.js';
import {
	ColorCode,
	PieceCode,
	type Square
} from '../../../../../src/state/board/types/internal.js';
import type { MainRendererConfigDrag } from '../../../../../src/extensions/first-party/main-renderer/types/template.js';
import type { RuntimeStateSnapshot } from '../../../../../src/state/types.js';
import { createSvgElement } from '../../../dom/svg.js';

// ─── Default drag config for tests ────────────────────────────────────────────

export const DEFAULT_TEST_DRAG_CONFIG: MainRendererConfigDrag = {
	pieceScale: 1,
	pieceAnchor: 'center',
	pieceAnchorOffsetY: 0
};

/**
 * Creates a getter returning the desktop-default drag config (or an override).
 */
export function createTestDragConfigGetter(
	override?: Partial<MainRendererConfigDrag>
): () => MainRendererConfigDrag {
	const config: MainRendererConfigDrag = { ...DEFAULT_TEST_DRAG_CONFIG, ...override };
	return () => config;
}

// ─── Mock runtime surface ─────────────────────────────────────────────────────

/**
 * Creates a minimal mock ExtensionRuntimeSurface for drag tests.
 * Only transientVisuals.subscribe/unsubscribe are provided.
 */
export function createMockRuntimeSurface() {
	const subscribe = vi.fn();
	const unsubscribe = vi.fn();

	const surface = {
		transientVisuals: { subscribe, unsubscribe }
	} as unknown as ExtensionRuntimeSurface;

	return { surface, subscribe, unsubscribe };
}

// ─── Update context ───────────────────────────────────────────────────────────

export interface DragUpdateContextOptions {
	dragSession?: object | null;
}

/**
 * Builds a minimal ExtensionUpdateContext for drag update tests.
 * The drag update only reads currentFrame.state.interaction.dragSession.
 */
export function createDragUpdateContext(opts: DragUpdateContextOptions = {}) {
	const context = {
		currentFrame: {
			isMounted: true,
			state: {
				board: { pieces: new Uint8Array(64), turn: ColorCode.White, positionEpoch: 0 },
				view: {},
				interaction: {
					selected: null,
					movability: { mode: 0 },
					activeDestinations: new Map(),
					dragSession: opts.dragSession ?? null
				},
				change: { lastMove: null, deferredUIMoveRequest: null }
			} as unknown as RuntimeStateSnapshot,
			layout: {
				sceneSize: { width: 400, height: 400 },
				orientation: ColorCode.White,
				geometry: createRenderGeometry({ width: 400, height: 400 }, ColorCode.White),
				layoutEpoch: 1
			}
		},
		previousFrame: null,
		mutation: {
			hasMutation: vi.fn(() => false),
			getPayloads: vi.fn(() => undefined),
			getAll: vi.fn(() => new Map())
		},
		invalidation: { dirtyLayers: 0, markDirty: vi.fn(), clearDirty: vi.fn(), clear: vi.fn() }
	} as never;

	return context;
}

// ─── Transient visuals context ────────────────────────────────────────────────

export interface DragTransientVisualsContextOptions {
	sceneSize?: number;
	orientation?: ColorCode;
	boardClampedPoint?: { x: number; y: number };
}

/**
 * Builds a minimal ExtensionRenderTransientVisualsContext for drag transient render tests.
 */
export function createDragTransientVisualsContext(opts: DragTransientVisualsContextOptions = {}) {
	const size = opts.sceneSize ?? 400;
	const orientation = opts.orientation ?? ColorCode.White;
	const geometry = createRenderGeometry({ width: size, height: size }, orientation);
	const boardClampedPoint = opts.boardClampedPoint ?? { x: 200, y: 200 };

	return {
		currentFrame: {
			state: {
				board: { pieces: new Uint8Array(64), turn: ColorCode.White, positionEpoch: 0 },
				view: {},
				interaction: {
					selected: null,
					movability: { mode: 0 },
					activeDestinations: new Map(),
					dragSession: null
				},
				change: { lastMove: null, deferredUIMoveRequest: null }
			} as unknown as RuntimeStateSnapshot,
			layout: {
				sceneSize: { width: size, height: size },
				orientation,
				geometry,
				layoutEpoch: 1
			}
		},
		transientInput: {
			target: null,
			point: boardClampedPoint,
			clampedPoint: boardClampedPoint,
			boardClampedPoint
		}
	} as never;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Creates a lifted-piece drag session object for testing.
 */
export function createLiftedPieceDragSession(
	sourceSquare: Square = 4 as Square,
	sourcePieceCode = PieceCode.WhiteKing
) {
	return {
		owner: 'core' as const,
		type: 'lifted-piece-drag' as const,
		phase: 'active' as const,
		sourceSquare,
		sourcePieceCode,
		targetSquare: null,
		pointerPosition: { x: 100, y: 100 }
	};
}

/**
 * Creates an SVG <g> element to serve as the drag layer.
 */
export function createDragLayer(): SVGGElement {
	return createSvgElement('g');
}
