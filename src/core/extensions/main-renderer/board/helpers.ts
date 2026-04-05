import { Square, SQUARE_COUNT } from '../../../state/board/types';
import { RendererBoardFrameSnapshot } from './types';

export function collectChangedPieceSquares(
	previous: RendererBoardFrameSnapshot | null,
	current: RendererBoardFrameSnapshot
): Set<Square> {
	const changed = new Set<Square>();

	if (!previous) {
		for (let sq = 0 as Square; sq < SQUARE_COUNT; sq++) {
			if (current.board.pieces[sq] > 0 || current.suppressedSquares.has(sq)) {
				changed.add(sq);
			}
		}

		return changed;
	}

	for (let sq = 0 as Square; sq < SQUARE_COUNT; sq++) {
		const prevCode = previous.board.pieces[sq];
		const currCode = current.board.pieces[sq];

		if (prevCode !== currCode) {
			changed.add(sq);
			continue;
		}

		const prevSuppressed = previous.suppressedSquares.has(sq);
		const currSuppressed = current.suppressedSquares.has(sq);

		if (prevSuppressed !== currSuppressed) {
			changed.add(sq);
		}
	}

	return changed;
}
