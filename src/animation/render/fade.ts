import type { SceneRenderGeometry } from '../../layout/geometry/types.js';
import { createSvgElement, updateSvgElementAttributes } from '../../render/svg/helpers.js';
import type { AnimationTrackFade } from '../types.js';
import type { PieceHrefResolver, PreparedFadeNode } from './types.js';

export function prepareFadeTrack(
	track: AnimationTrackFade,
	geometry: SceneRenderGeometry,
	resolveHref: PieceHrefResolver,
	slot: SVGGElement
): PreparedFadeNode {
	const r = geometry.getSquareRect(track.sq);
	const href = resolveHref(track.pieceCode);
	const initialOpacity = track.effect === 'fade-in' ? '0' : '1';
	const root = createSvgElement(slot, 'use', {
		'data-chessboard-id': `animation-fade-${track.id}`,
		'data-animation-effect': track.effect,
		href,
		x: r.x.toString(),
		y: r.y.toString(),
		width: r.width.toString(),
		height: r.height.toString(),
		opacity: initialOpacity
	});
	return { ...track, root };
}

export function renderFadeTrack(node: PreparedFadeNode, progress: number): void {
	const opacity = node.effect === 'fade-in' ? progress : 1 - progress;
	updateSvgElementAttributes(node.root, { opacity: opacity.toString() });
}

export function cleanFadeTrack(node: PreparedFadeNode): void {
	node.root.remove();
}
