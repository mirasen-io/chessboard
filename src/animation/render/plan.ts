import type { PieceUrls } from '../../extensions/first-party/main-renderer/types/internal.js';
import type { SceneRenderGeometry } from '../../layout/geometry/types.js';
import type { AnimationPlan } from '../types.js';
import { cleanFadeTrack, prepareFadeTrack, renderFadeTrack } from './fade.js';
import { cleanMoveTrack, prepareMoveTrack, renderMoveTrack } from './move.js';
import { cleanStaticTrack, prepareStaticTrack, renderStaticTrack } from './static.js';
import type { PreparedNodeMap, PreparedTrackNode } from './types.js';

/**
 * Prepare all tracks in the plan — creates SVG nodes in `layer` for each track.
 * Returns a map keyed by track id for use in render/clean passes.
 */
export function prepareAnimationPlan(
	plan: AnimationPlan,
	geometry: SceneRenderGeometry,
	pieceUrls: PieceUrls,
	layer: SVGElement
): PreparedNodeMap {
	const nodes: PreparedNodeMap = new Map();
	for (const track of plan.tracks) {
		let node: PreparedTrackNode;
		switch (track.effect) {
			case 'move':
				node = prepareMoveTrack(track, geometry, pieceUrls, layer);
				break;
			case 'fade-in':
			case 'fade-out':
				node = prepareFadeTrack(track, geometry, pieceUrls, layer);
				break;
			case 'static':
				node = prepareStaticTrack(track, geometry, pieceUrls, layer);
				break;
			default:
				throw new RangeError(`Unsupported track effect: ${track}`);
		}
		nodes.set(track.id, node);
	}
	return nodes;
}

export function renderAnimationPlan(
	nodes: PreparedNodeMap,
	geometry: SceneRenderGeometry,
	progress: number
): void {
	for (const node of nodes.values()) {
		switch (node.effect) {
			case 'move':
				renderMoveTrack(node, geometry, progress);
				break;
			case 'fade-in':
			case 'fade-out':
				renderFadeTrack(node, progress);
				break;
			case 'static':
				renderStaticTrack(node);
				break;
			default:
				throw new RangeError(`Unsupported track effect: ${node}`);
		}
	}
}

/**
 * Clean up all track nodes — removes SVG elements from the DOM.
 */
export function cleanAnimationPlan(nodes: PreparedNodeMap): void {
	for (const node of nodes.values()) {
		switch (node.effect) {
			case 'move':
				cleanMoveTrack(node);
				break;
			case 'fade-in':
			case 'fade-out':
				cleanFadeTrack(node);
				break;
			case 'static':
				cleanStaticTrack(node);
				break;
			default:
				throw new RangeError(`Unsupported track effect: ${node}`);
		}
	}
	nodes.clear();
}
