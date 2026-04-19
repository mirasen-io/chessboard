import type { PieceUrls } from '../../extensions/first-party/main-renderer/types/internal.js';
import type { SceneRenderGeometry } from '../../layout/geometry/types.js';
import { createSvgElement } from '../../render/svg/helpers.js';
import type { AnimationTrackStatic } from '../types.js';
import type { PreparedStaticNode } from './types.js';

export function prepareStaticTrack(
	track: AnimationTrackStatic,
	geometry: SceneRenderGeometry,
	pieceUrls: PieceUrls,
	layer: SVGElement
): PreparedStaticNode {
	const r = geometry.getSquareRect(track.sq);
	const url = pieceUrls[track.pieceCode];
	const root = createSvgElement(layer, 'image', {
		'data-chessboard-id': `animation-static-${track.id}`,
		'data-animation-effect': 'static',
		href: url,
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
