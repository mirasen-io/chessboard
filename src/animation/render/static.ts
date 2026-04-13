import { getPieceUrl } from '../../extensions/main-renderer/helpers';
import type { PieceUrls } from '../../extensions/main-renderer/types/config';
import type { RenderGeometry } from '../../layout/geometry/types';
import { createSvgElement } from '../../render/svg/helpers';
import type { AnimationTrackStatic } from '../types';
import type { PreparedStaticNode } from './types';

export function prepareStaticTrack(
	track: AnimationTrackStatic,
	geometry: RenderGeometry,
	pieceUrls: PieceUrls,
	layer: SVGElement
): PreparedStaticNode {
	const r = geometry.squareRect(track.sq);
	const url = getPieceUrl(pieceUrls, track.piece);
	const root = createSvgElement(layer, 'image', {
		'data-chessboard-id': `animation-static-${track.id}`,
		'data-animation-effect': 'static',
		href: url,
		x: r.x.toString(),
		y: r.y.toString(),
		width: r.size.toString(),
		height: r.size.toString()
	});
	return { track, root };
}

// No per-frame update needed — static pieces stay in place until the animation layer is cleaned.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function renderStaticTrack(_node: PreparedStaticNode): void {}

export function cleanStaticTrack(node: PreparedStaticNode): void {
	node.root.remove();
}
