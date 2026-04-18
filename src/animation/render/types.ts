import type {
	AnimationTrack,
	AnimationTrackFade,
	AnimationTrackMove,
	AnimationTrackStatic
} from '../types';

/** Prepared node for a move track — holds the SVG image and its track. */
export interface PreparedMoveNode extends AnimationTrackMove {
	root: SVGImageElement;
}

/** Prepared node for a fade-in / fade-out track. */
export interface PreparedFadeNode extends AnimationTrackFade {
	root: SVGImageElement;
}

/** Prepared node for a static (captured piece) track. */
export interface PreparedStaticNode extends AnimationTrackStatic {
	root: SVGImageElement;
}

export type PreparedTrackNode = PreparedMoveNode | PreparedFadeNode | PreparedStaticNode;

/** Keyed map from track id → prepared node, for fast lookup during render/clean. */
export type PreparedNodeMap = Map<number, PreparedTrackNode>;

/** Input context shared by all prepare/render/clean helpers. */
export interface AnimationRenderInput {
	tracks: readonly AnimationTrack[];
	layer: SVGElement;
}
