import type { NonEmptyPieceCode } from '../../state/board/types/internal.js';
import type {
	AnimationTrack,
	AnimationTrackFade,
	AnimationTrackMove,
	AnimationTrackStatic
} from '../types.js';

/**
 * A function that resolves a piece code to a href string for <use> elements.
 * Decoupled from main-renderer internals — any conforming callback works.
 */
export type PieceHrefResolver = (pieceCode: NonEmptyPieceCode) => string;

/** Prepared node for a move track — holds the SVG use element and its track. */
export interface PreparedMoveNode extends AnimationTrackMove {
	root: SVGUseElement;
}

/** Prepared node for a fade-in / fade-out track. */
export interface PreparedFadeNode extends AnimationTrackFade {
	root: SVGUseElement;
}

/** Prepared node for a static (captured piece) track. */
export interface PreparedStaticNode extends AnimationTrackStatic {
	root: SVGUseElement;
}

export type PreparedTrackNode = PreparedMoveNode | PreparedFadeNode | PreparedStaticNode;

/** Keyed map from track id → prepared node, for fast lookup during render/clean. */
export type PreparedNodeMap = Map<number, PreparedTrackNode>;

/** Input context shared by all prepare/render/clean helpers. */
export interface AnimationRenderInput {
	tracks: readonly AnimationTrack[];
	layer: SVGElement;
}
