import { AnimationSessionSnapshot } from '../../../animation/types';
import { RenderGeometry } from '../../../layout/geometry/types';
import { decodePiece } from '../../../state/board/encode';
import { BoardStateSnapshot } from '../../../state/board/types';
import { cburnettPieceUrl } from '../assets';
import { clearElementChildren, createSvgGroup, createSvgImage } from '../helpers';
import { AnimationRenderContext, SvgRendererAnimationInternals } from './types';

export function renderAnimations(
	state: SvgRendererAnimationInternals,
	context: AnimationRenderContext
): void {
	const { session, board, geometry } = context;
	const layer = state.root;

	// If no session, clear animation root and return
	if (session === null) {
		clearElementChildren(layer);
		state.activeSessionGroup = null;
		return;
	}

	// Check if we need a new session group (new session or no existing group)
	const needsNewGroup =
		!state.activeSessionGroup ||
		state.activeSessionGroup.parentNode !== layer ||
		state.activeSessionGroup.getAttribute('data-chessboard-id') !==
			`animation-session-${session.id}`;

	if (needsNewGroup) {
		clearElementChildren(layer);
		state.activeSessionGroup = createSvgGroup(layer, {
			'data-chessboard-id': `animation-session-${session.id}`
		});
	}

	// Delegate frame rendering to helper (activeSessionGroup is guaranteed non-null here)
	renderAnimationFrame(state.activeSessionGroup!, session, board, geometry, performance.now());
}

export function renderAnimationFrame(
	sessionGroup: SVGGElement,
	session: AnimationSessionSnapshot,
	board: BoardStateSnapshot,
	geometry: RenderGeometry,
	now: number
): void {
	// Find or create reserved child group with stable marker
	let reservedGroup = sessionGroup.querySelector<SVGGElement>(
		'g[data-chessboard-id="animation-frame"]'
	);
	if (!reservedGroup) {
		reservedGroup = createSvgGroup(sessionGroup, {
			'data-chessboard-id': 'animation-frame'
		});
	} else {
		clearElementChildren(reservedGroup);
	}

	// Compute normalized progress
	const elapsed = now - session.startTime;
	const t = Math.min(1, Math.max(0, elapsed / session.duration));

	// Apply easing (same as Phase 3.9)
	const te = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

	// Render each track
	for (const track of session.tracks) {
		if (track.effect !== 'move') {
			throw new Error(`Unsupported animation effect: ${track.effect}`);
		}

		// Get source and destination rects
		const fromRect = geometry.squareRect(track.fromSq);
		const toRect = geometry.squareRect(track.toSq);

		// Interpolate position and size
		const x = fromRect.x + (toRect.x - fromRect.x) * te;
		const y = fromRect.y + (toRect.y - fromRect.y) * te;
		const size = fromRect.size + (toRect.size - fromRect.size) * te;

		// Look up piece material at destination square (handles promotions)
		const pieceCode = board.pieces[track.toSq];
		const piece = decodePiece(pieceCode);
		if (!piece) continue; // Defensive: should not happen

		const pieceUrl = cburnettPieceUrl(piece.color, piece.role);

		// Create transient image node
		createSvgImage(reservedGroup, {
			'data-chessboard-id': `animation-piece-${pieceCode}`,
			fromSq: track.fromSq.toString(),
			toSq: track.toSq.toString(),
			x: String(x),
			y: String(y),
			width: String(size),
			height: String(size),
			href: pieceUrl
		});
	}
}
