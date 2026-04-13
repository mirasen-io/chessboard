import { getPieceUrl } from '../../extensions/main-renderer/helpers';
import type { PieceUrls } from '../../extensions/main-renderer/types/config';
import type { RenderGeometry } from '../../layout/geometry/types';
import { createSvgElement, updateElementAttributes } from '../../render/svg/helpers';
import type { AnimationTrackFade } from '../types';
import type { PreparedFadeNode } from './types';

export function prepareFadeTrack(
	track: AnimationTrackFade,
	geometry: RenderGeometry,
	pieceUrls: PieceUrls,
	layer: SVGElement
): PreparedFadeNode {
	const r = geometry.squareRect(track.sq);
	const url = getPieceUrl(pieceUrls, track.piece);
	const initialOpacity = track.effect === 'fade-in' ? '0' : '1';
	const root = createSvgElement(layer, 'image', {
		'data-chessboard-id': `animation-fade-${track.id}`,
		'data-animation-effect': track.effect,
		href: url,
		x: r.x.toString(),
		y: r.y.toString(),
		width: r.size.toString(),
		height: r.size.toString(),
		opacity: initialOpacity
	});
	return { track, root };
}

export function renderFadeTrack(node: PreparedFadeNode, progress: number): void {
	const opacity = node.track.effect === 'fade-in' ? progress : 1 - progress;
	updateElementAttributes(node.root, { opacity: opacity.toString() });
}

export function cleanFadeTrack(node: PreparedFadeNode): void {
	node.root.remove();
}
