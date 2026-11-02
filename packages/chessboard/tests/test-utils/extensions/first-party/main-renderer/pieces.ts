import { vi } from 'vitest';
import {
	createPieceSymbolResolver,
	type PieceSymbolResolver
} from '../../../../../src/extensions/first-party/main-renderer/piece-symbols.js';
import { DirtyLayer } from '../../../../../src/extensions/first-party/main-renderer/types/extension.js';
import type { PieceUrls } from '../../../../../src/extensions/first-party/main-renderer/types/internal.js';
import type { ExtensionRenderContext } from '../../../../../src/extensions/types/context/render.js';
import { createRenderGeometry } from '../../../../../src/layout/geometry/factory.js';
import { createSvgIdResolver } from '../../../../../src/render/svg/ids.js';
import {
	ColorCode,
	type NonEmptyPieceCode,
	PieceCode,
	SQUARE_COUNT
} from '../../../../../src/state/board/types/internal.js';
import type { RuntimeStateSnapshot } from '../../../../../src/state/types.js';
import { createSvgElement } from '../../../dom/svg.js';

// ─── Piece URLs ───────────────────────────────────────────────────────────────

/**
 * Creates a test PieceUrls record where each piece code maps to `url://{pieceCode}`.
 */
export function createTestPieceUrls(): PieceUrls {
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
		urls[code] = `url://${code}`;
	}
	return urls as PieceUrls;
}

// ─── Piece Symbol Resolver ────────────────────────────────────────────────────

/**
 * Creates a test PieceSymbolResolver backed by a real SvgIdResolver.
 */
export function createTestPieceSymbolResolver(): PieceSymbolResolver {
	return createPieceSymbolResolver(createSvgIdResolver());
}

// ─── Render context ───────────────────────────────────────────────────────────

export interface PiecesRenderContextOptions {
	dirtyLayers?: number;
	orientation?: ColorCode;
	sceneSize?: number;
	pieces?: Uint8Array;
}

/**
 * Builds a minimal ExtensionRenderContext suitable for pieces renderer tests.
 */
export function createPiecesRenderContext(
	opts: PiecesRenderContextOptions = {}
): ExtensionRenderContext {
	const size = opts.sceneSize ?? 400;
	const orientation = opts.orientation ?? ColorCode.White;
	const geometry = createRenderGeometry({ width: size, height: size }, orientation);
	const pieces = opts.pieces ?? new Uint8Array(SQUARE_COUNT);

	return {
		currentFrame: {
			state: {
				board: { pieces, turn: ColorCode.White, positionEpoch: 0 },
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
		invalidation: {
			dirtyLayers: opts.dirtyLayers ?? DirtyLayer.Pieces
		}
	} as ExtensionRenderContext;
}

// ─── Update context ───────────────────────────────────────────────────────────

export interface PiecesUpdateContextOptions {
	causes?: string[];
	prefixes?: string[];
	isMounted?: boolean;
	hasGeometry?: boolean;
	pieces?: Uint8Array;
	previousPieces?: Uint8Array | null;
	previousFrame?: boolean;
	sceneSize?: number;
	orientation?: ColorCode;
	dragSession?: object | null;
	deferredUIMoveRequest?: object | null;
}

/**
 * Builds a minimal ExtensionUpdateContext for pieces update tests.
 * Returns { context, markDirty }.
 */
export function createPiecesUpdateContext(opts: PiecesUpdateContextOptions = {}) {
	const markDirty = vi.fn();
	const size = opts.sceneSize ?? 400;
	const orientation = opts.orientation ?? ColorCode.White;
	const isMounted = opts.isMounted ?? true;
	const hasGeometry = opts.hasGeometry ?? true;
	const pieces = opts.pieces ?? new Uint8Array(SQUARE_COUNT);
	const causes = opts.causes ?? [];
	const prefixes = opts.prefixes ?? [];

	const geometry = hasGeometry
		? createRenderGeometry({ width: size, height: size }, orientation)
		: null;

	const boardSnapshot = { pieces, turn: ColorCode.White, positionEpoch: 0 };
	const stateSnapshot = {
		board: boardSnapshot,
		view: {},
		interaction: {
			selected: null,
			movability: { mode: 0 },
			activeDestinations: new Map(),
			dragSession: opts.dragSession ?? null
		},
		change: { lastMove: null, deferredUIMoveRequest: opts.deferredUIMoveRequest ?? null }
	} as unknown as RuntimeStateSnapshot;

	const currentFrame = isMounted
		? {
				isMounted: true as const,
				state: stateSnapshot,
				layout: {
					sceneSize: { width: size, height: size },
					orientation,
					geometry,
					layoutEpoch: 1
				}
			}
		: { isMounted: false as const, state: stateSnapshot };

	let previousFrame: object | null = null;
	if (opts.previousFrame !== false && opts.previousPieces !== null) {
		const prevPieces = opts.previousPieces ?? pieces;
		const prevState = {
			board: { pieces: prevPieces, turn: ColorCode.White, positionEpoch: 0 },
			view: {},
			interaction: {
				selected: null,
				movability: { mode: 0 },
				activeDestinations: new Map(),
				dragSession: null
			},
			change: { lastMove: null, deferredUIMoveRequest: null }
		} as unknown as RuntimeStateSnapshot;
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
		if (!match) return causes.length > 0 || prefixes.length > 0;
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
		invalidation: { dirtyLayers: 0, markDirty, clearDirty: vi.fn(), clear: vi.fn() }
	} as never;

	return { context, markDirty };
}

// ─── Clean animation context (for suppression refresh) ────────────────────────

export interface PiecesCleanAnimationContextOptions {
	dirtyLayers?: number;
	orientation?: ColorCode;
	sceneSize?: number;
	pieces?: Uint8Array;
	dragSession?: object | null;
	deferredUIMoveRequest?: object | null;
}

/**
 * Builds a minimal ExtensionCleanAnimationContext for pieces suppression refresh tests.
 * Returns { context, markDirty }.
 */
export function createPiecesCleanAnimationContext(opts: PiecesCleanAnimationContextOptions = {}) {
	const markDirty = vi.fn();
	const size = opts.sceneSize ?? 400;
	const orientation = opts.orientation ?? ColorCode.White;
	const geometry = createRenderGeometry({ width: size, height: size }, orientation);
	const pieces = opts.pieces ?? new Uint8Array(SQUARE_COUNT);

	const context = {
		currentFrame: {
			state: {
				board: { pieces, turn: ColorCode.White, positionEpoch: 0 },
				view: {},
				interaction: {
					selected: null,
					movability: { mode: 0 },
					activeDestinations: new Map(),
					dragSession: opts.dragSession ?? null
				},
				change: {
					lastMove: null,
					deferredUIMoveRequest: opts.deferredUIMoveRequest ?? null
				}
			} as unknown as RuntimeStateSnapshot,
			layout: {
				sceneSize: { width: size, height: size },
				orientation,
				geometry,
				layoutEpoch: 1
			}
		},
		invalidation: {
			dirtyLayers: opts.dirtyLayers ?? DirtyLayer.Pieces,
			markDirty,
			clearDirty: vi.fn(),
			clear: vi.fn()
		},
		finishedSessions: []
	} as never;

	return { context, markDirty };
}

// ─── Layer ────────────────────────────────────────────────────────────────────

/**
 * Creates an SVG <g> element to serve as the pieces layer.
 */
export function createPiecesLayer(): SVGGElement {
	return createSvgElement('g');
}
