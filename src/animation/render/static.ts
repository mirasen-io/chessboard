import type { SceneRenderGeometry } from '../../layout/geometry/types.js';
import { createSvgElement } from '../../render/svg/helpers.js';
import type { AnimationTrackStatic } from '../types.js';
import type { PieceHrefResolver, PreparedStaticNode } from './types.js';

export function prepareStaticTrack(
	track: AnimationTrackStatic,
	geometry: SceneRenderGeometry,
	resolveHref: PieceHrefResolver,
	slot: SVGGElement
): PreparedStaticNode {
	const r = geometry.getSquareRect(track.sq);
	const href = resolveHref(track.pieceCode);
	const root = createSvgElement(slot, 'use', {
		'data-chessboard-id': `animation-static-${track.id}`,
		'data-animation-effect': 'static',
		href,
		x: r.x.toString(),
		y: r.y.toString(),
		width: r.width.toString(),
		height: r.height.toString()
	});
	return { ...track, root };
}

// No per-frame update needed — static pieces stay in place until the animation layer is cleaned.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function renderStaticTrack(_node: PreparedStaticNode): void {}

export function cleanStaticTrack(node: PreparedStaticNode): void {
	node.root.remove();
}
