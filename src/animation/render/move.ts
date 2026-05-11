import type { SceneRenderGeometry } from '../../layout/geometry/types.js';
import { createSvgElement, updateSvgElementAttributes } from '../../render/svg/helpers.js';
import type { AnimationTrackMove } from '../types.js';
import type { PieceHrefResolver, PreparedMoveNode } from './types.js';

export function prepareMoveTrack(
	track: AnimationTrackMove,
	geometry: SceneRenderGeometry,
	resolveHref: PieceHrefResolver,
	slot: SVGGElement
): PreparedMoveNode {
	const r = geometry.getSquareRect(track.fromSq);
	const href = resolveHref(track.pieceCode);
	const root = createSvgElement(slot, 'use', {
		'data-chessboard-id': `animation-move-${track.id}`,
		'data-animation-effect': 'move',
		href,
		x: r.x.toString(),
		y: r.y.toString(),
		width: r.width.toString(),
		height: r.height.toString()
	});
	return { ...track, root };
}

export function renderMoveTrack(
	node: PreparedMoveNode,
	geometry: SceneRenderGeometry,
	progress: number
): void {
	const from = geometry.getSquareRect(node.fromSq);
	const to = geometry.getSquareRect(node.toSq);
	const x = from.x + (to.x - from.x) * progress;
	const y = from.y + (to.y - from.y) * progress;
	updateSvgElementAttributes(node.root, {
		x: x.toString(),
		y: y.toString()
	});
}

export function cleanMoveTrack(node: PreparedMoveNode): void {
	node.root.remove();
}
