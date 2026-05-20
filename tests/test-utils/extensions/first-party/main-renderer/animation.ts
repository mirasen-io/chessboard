import { vi } from 'vitest';
import type { AnimationPlan, AnimationTrackMove } from '../../../../../src/animation/types.js';
import type { MainRendererAnimationInternal } from '../../../../../src/extensions/first-party/main-renderer/animation/types.js';
import type { PieceSymbolResolver } from '../../../../../src/extensions/first-party/main-renderer/piece-symbols.js';
import type { PieceUrls } from '../../../../../src/extensions/first-party/main-renderer/types/internal.js';
import type { ExtensionRuntimeSurface } from '../../../../../src/extensions/types/surface/main.js';
import { createRenderGeometry } from '../../../../../src/layout/geometry/factory.js';
import {
	ColorCode,
	type NonEmptyPieceCode,
	PieceCode,
	type Square,
	SQUARE_COUNT
} from '../../../../../src/state/board/types/internal.js';
import type { RuntimeStateSnapshot } from '../../../../../src/state/types.js';

// ─── Piece URLs (animation-local) ────────────────────────────────────────────

/**
 * Creates a test PieceUrls record for animation lifecycle tests.
 * Each piece code maps to `anim-url://{pieceCode}`.
 */
export function createAnimationTestPieceUrls(): PieceUrls {
	const codes: NonEmptyPieceCode[] = [
		PieceCode.WhitePawn,
		PieceCode.WhiteKnight,
		PieceCode.WhiteBishop,
		PieceCode.WhiteRook,
		PieceCode.WhiteQueen,
		PieceCode.WhiteKing,
		PieceCode.BlackPawn,
		PieceCode.BlackKnight,
		PieceCode.BlackBishop,
		PieceCode.BlackRook,
		PieceCode.BlackQueen,
		PieceCode.BlackKing
	];
	const urls = {} as Record<NonEmptyPieceCode, string>;
	for (const code of codes) {
		urls[code] = `anim-url://${code}`;
	}
	return urls as PieceUrls;
}

// ─── Mock runtime surface ─────────────────────────────────────────────────────

/**
 * Creates a minimal mock ExtensionRuntimeSurface for animation tests.
 * Includes animation.submit and animation.getAll.
 */
export function createMockAnimationRuntimeSurface() {
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

	const surface = {
		animation: { submit, getAll }
	} as unknown as ExtensionRuntimeSurface;

	return { surface, submit, getAll };
}

// ─── Internal state ───────────────────────────────────────────────────────────

/**
 * Creates a minimal MainRendererAnimationInternal for direct lifecycle tests.
 */
function createDefaultResolver(): PieceSymbolResolver {
	const getId = (pieceCode: NonEmptyPieceCode): string => `anim-test-renderer-p${pieceCode}`;
	const getHref = (pieceCode: NonEmptyPieceCode): string => `#anim-test-renderer-p${pieceCode}`;
	return { getId, getHref };
}

export function createAnimationInternalState(
	surface?: ExtensionRuntimeSurface,
	getAnimationConfig?: () => { durationMs: number }
): MainRendererAnimationInternal {
	const { surface: defaultSurface } = createMockAnimationRuntimeSurface();
	return {
		runtimeSurface: surface ?? defaultSurface,
		resolver: createDefaultResolver(),
		entries: new Map(),
		getAnimationConfig: getAnimationConfig ?? (() => ({ durationMs: 180 }))
	};
}

// ─── Simple plan helper ───────────────────────────────────────────────────────

/**
 * Creates a minimal AnimationPlan with one move track.
 */
export function createSimpleMovePlan(
	from: Square = 12 as Square,
	to: Square = 28 as Square,
	pieceCode: NonEmptyPieceCode = PieceCode.WhitePawn
): AnimationPlan {
	const track: AnimationTrackMove = {
		id: 0,
		pieceCode,
		fromSq: from,
		toSq: to,
		effect: 'move'
	};
	return {
		tracks: [track],
		suppressedSquares: new Set([from, to])
	};
}

// ─── Lifecycle contexts ───────────────────────────────────────────────────────

export interface AnimationPrepareContextOptions {
	submittedSessions?: Array<{ id: number; startTime?: number; duration?: number }>;
	sceneSize?: number;
	orientation?: ColorCode;
}

/**
 * Builds a minimal ExtensionPrepareAnimationContext.
 */
export function createAnimationPrepareContext(opts: AnimationPrepareContextOptions = {}) {
	const size = opts.sceneSize ?? 400;
	const orientation = opts.orientation ?? ColorCode.White;
	const geometry = createRenderGeometry({ width: size, height: size }, orientation);

	const submittedSessions = (opts.submittedSessions ?? []).map((s) => ({
		id: s.id,
		startTime: s.startTime ?? 0,
		duration: s.duration ?? 180,
		status: 'submitted' as const
	}));

	return {
		currentFrame: {
			state: {} as RuntimeStateSnapshot,
			layout: {
				sceneSize: { width: size, height: size },
				orientation,
				geometry,
				layoutEpoch: 1
			}
		},
		submittedSessions
	} as never;
}

export interface AnimationRenderContextOptions {
	activeSessions?: Array<{
		id: number;
		progress: number;
		elapsedTime?: number;
		startTime?: number;
		duration?: number;
	}>;
	sceneSize?: number;
	orientation?: ColorCode;
}

/**
 * Builds a minimal ExtensionRenderAnimationContext.
 */
export function createAnimationRenderContext(opts: AnimationRenderContextOptions = {}) {
	const size = opts.sceneSize ?? 400;
	const orientation = opts.orientation ?? ColorCode.White;
	const geometry = createRenderGeometry({ width: size, height: size }, orientation);

	const activeSessions = (opts.activeSessions ?? []).map((s) => ({
		id: s.id,
		startTime: s.startTime ?? 0,
		duration: s.duration ?? 180,
		status: 'active' as const,
		elapsedTime: s.elapsedTime ?? 0,
		progress: s.progress
	}));

	return {
		currentFrame: {
			state: {} as RuntimeStateSnapshot,
			layout: {
				sceneSize: { width: size, height: size },
				orientation,
				geometry,
				layoutEpoch: 1
			}
		},
		activeSessions
	} as never;
}

export interface AnimationCleanContextOptions {
	finishedSessions?: Array<{
		id: number;
		status?: 'ended' | 'cancelled';
		startTime?: number;
		duration?: number;
	}>;
	sceneSize?: number;
	orientation?: ColorCode;
}

/**
 * Builds a minimal ExtensionCleanAnimationContext.
 */
export function createAnimationCleanContext(opts: AnimationCleanContextOptions = {}) {
	const markDirty = vi.fn();
	const size = opts.sceneSize ?? 400;
	const orientation = opts.orientation ?? ColorCode.White;
	const geometry = createRenderGeometry({ width: size, height: size }, orientation);

	const finishedSessions = (opts.finishedSessions ?? []).map((s) => ({
		id: s.id,
		startTime: s.startTime ?? 0,
		duration: s.duration ?? 180,
		status: s.status ?? ('ended' as const)
	}));

	const context = {
		currentFrame: {
			state: {} as RuntimeStateSnapshot,
			layout: {
				sceneSize: { width: size, height: size },
				orientation,
				geometry,
				layoutEpoch: 1
			}
		},
		invalidation: {
			dirtyLayers: 0,
			markDirty,
			clearDirty: vi.fn(),
			clear: vi.fn()
		},
		finishedSessions
	} as never;

	return { context, markDirty };
}

// ─── Update context (existing) ────────────────────────────────────────────────

export interface AnimationUpdateContextOptions {
	causes?: string[];
	isMounted?: boolean;
	hasGeometry?: boolean;
	currentState?: Partial<{
		board: object;
		change: object;
		interaction: object;
		view: object;
	}>;
	previousState?: Partial<{
		board: object;
		change: object;
		interaction: object;
		view: object;
	}> | null;
	sceneSize?: number;
	orientation?: ColorCode;
}

function buildStateSnapshot(
	partial?: Partial<{ board: object; change: object; interaction: object; view: object }>
): RuntimeStateSnapshot {
	const defaults = {
		board: { pieces: new Uint8Array(SQUARE_COUNT), turn: ColorCode.White, positionEpoch: 0 },
		view: {},
		interaction: {
			selected: null,
			movability: { mode: 0 },
			activeDestinations: new Map(),
			dragSession: null
		},
		change: { lastMove: null, deferredUIMoveRequest: null }
	};
	return { ...defaults, ...(partial ?? {}) } as unknown as RuntimeStateSnapshot;
}

/**
 * Builds a minimal ExtensionUpdateContext for animation update tests.
 */
export function createAnimationUpdateContext(opts: AnimationUpdateContextOptions = {}) {
	const size = opts.sceneSize ?? 400;
	const orientation = opts.orientation ?? ColorCode.White;
	const isMounted = opts.isMounted ?? true;
	const hasGeometry = opts.hasGeometry ?? true;
	const causes = opts.causes ?? [];

	const geometry = hasGeometry
		? createRenderGeometry({ width: size, height: size }, orientation)
		: null;

	const currentState = buildStateSnapshot(opts.currentState);

	const currentFrame = isMounted
		? {
				isMounted: true as const,
				state: currentState,
				layout: {
					sceneSize: { width: size, height: size },
					orientation,
					geometry,
					layoutEpoch: 1
				}
			}
		: { isMounted: false as const, state: currentState };

	let previousFrame: object | null = null;
	if (opts.previousState !== null && opts.previousState !== undefined) {
		const prevState = buildStateSnapshot(opts.previousState);
		previousFrame = {
			isMounted: true,
			state: prevState,
			layout: {
				sceneSize: { width: size, height: size },
				orientation,
				geometry,
				layoutEpoch: 1
			}
		};
	}

	const hasMutation = (match?: { causes?: Iterable<string>; prefixes?: Iterable<string> }) => {
		if (!match) return causes.length > 0;
		if (match.causes) {
			for (const c of match.causes) {
				if (causes.includes(c)) return true;
			}
		}
		if (match.prefixes) {
			for (const p of match.prefixes) {
				for (const c of causes) {
					if (c.startsWith(p)) return true;
				}
			}
		}
		return false;
	};

	const context = {
		previousFrame,
		mutation: {
			hasMutation,
			getPayloads: vi.fn(() => undefined),
			getAll: vi.fn(() => new Map())
		},
		currentFrame,
		invalidation: { dirtyLayers: 0, markDirty: vi.fn(), clearDirty: vi.fn(), clear: vi.fn() }
	} as never;

	return context;
}
