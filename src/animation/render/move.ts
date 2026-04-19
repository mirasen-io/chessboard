import type { PieceUrls } from '../../extensions/first-party/main-renderer/types/internal.js';
import type { RenderGeometry } from '../../layout/geometry/types.js';
import { createSvgElement, updateElementAttributes } from '../../render/svg/helpers.js';
import type { AnimationTrackMove } from '../types.js';
import type { PreparedMoveNode } from './types.js';

export function prepareMoveTrack(
	track: AnimationTrackMove,
	geometry: RenderGeometry,
	pieceUrls: PieceUrls,
	layer: SVGElement
): PreparedMoveNode {
	const r = geometry.squareRect(track.fromSq);
	const url = pieceUrls[track.pieceCode];
	const root = createSvgElement(layer, 'image', {
		'data-chessboard-id': `animation-move-${track.id}`,
		'data-animation-effect': 'move',
		href: url,
		x: r.x.toString(),
		y: r.y.toString(),
		width: r.size.toString(),
		height: r.size.toString()
	});
	return { ...track, root };
}

export function renderMoveTrack(
	node: PreparedMoveNode,
	geometry: RenderGeometry,
	progress: number
): void {
	const from = geometry.squareRect(node.fromSq);
	const to = geometry.squareRect(node.toSq);
	const x = from.x + (to.x - from.x) * progress;
	const y = from.y + (to.y - from.y) * progress;
	updateElementAttributes(node.root, {
		x: x.toString(),
		y: y.toString()
	});
}

export function cleanMoveTrack(node: PreparedMoveNode): void {
	node.root.remove();
}
