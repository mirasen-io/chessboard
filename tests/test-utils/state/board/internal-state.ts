import {
	ColorCode,
	type PieceCode,
	type Square,
	SQUARE_COUNT
} from '../../../../src/state/board/types/internal.js';
import type { BoardStateInternal } from '../../../../src/state/board/types/main.js';

export interface InternalStateOverrides {
	turn?: ColorCode;
	positionEpoch?: number;
	pieces?: Array<[Square, PieceCode]>;
}

/**
 * Creates a BoardStateInternal with sensible defaults:
 * - empty board (all zeros)
 * - turn = White
 * - positionEpoch = 0
 *
 * Accepts optional overrides for turn, epoch, and sparse piece placement.
 */
export function createTestBoardInternalState(
	overrides?: InternalStateOverrides
): BoardStateInternal {
	const pieces = new Uint8Array(SQUARE_COUNT);

	if (overrides?.pieces) {
		for (const [sq, code] of overrides.pieces) {
			pieces[sq] = code;
		}
	}

	return {
		pieces,
		turn: overrides?.turn ?? ColorCode.White,
		positionEpoch: overrides?.positionEpoch ?? 0
	};
}
