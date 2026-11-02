import { describe, expect, it } from 'vitest';
import {
	PieceCode,
	RoleCode,
	type NonEmptyPieceCode,
	type RolePromotionCode,
	type Square
} from '../../../src/state/board/types/internal.js';
import {
	changeStatesEqual,
	moveDestinationsEqual,
	moveRequestBasesEqual,
	moveRequestsEqual,
	movesEqual,
	pendingUIMoveRequestsEqual
} from '../../../src/state/change/helpers.js';
import { makeMoveDestination, makeMoveSnapshot } from '../../test-utils/state/change/fixtures.js';

describe('movesEqual', () => {
	it('null vs null → true', () => {
		expect(movesEqual(null, null)).toBe(true);
	});

	it('null vs non-null → false', () => {
		expect(movesEqual(null, makeMoveSnapshot())).toBe(false);
		expect(movesEqual(makeMoveSnapshot(), null)).toBe(false);
	});

	it('identical moves → true', () => {
		expect(movesEqual(makeMoveSnapshot(), makeMoveSnapshot())).toBe(true);
	});

	it('different from → false', () => {
		expect(movesEqual(makeMoveSnapshot(), makeMoveSnapshot({ from: 0 as Square }))).toBe(false);
	});

	it('different piece → false', () => {
		expect(movesEqual(makeMoveSnapshot(), makeMoveSnapshot({ piece: PieceCode.BlackPawn }))).toBe(
			false
		);
	});

	it('different promotedTo → false', () => {
		expect(
			movesEqual(
				makeMoveSnapshot({ promotedTo: RoleCode.Queen }),
				makeMoveSnapshot({ promotedTo: RoleCode.Knight })
			)
		).toBe(false);
	});

	it('different captured → false', () => {
		expect(
			movesEqual(
				makeMoveSnapshot({
					captured: {
						piece: PieceCode.BlackPawn as NonEmptyPieceCode,
						square: 28 as Square
					}
				}),
				makeMoveSnapshot()
			)
		).toBe(false);
	});

	it('one has secondary, other does not → false', () => {
		expect(
			movesEqual(
				makeMoveSnapshot({
					secondary: {
						from: 7 as Square,
						to: 5 as Square,
						piece: PieceCode.WhiteRook as NonEmptyPieceCode
					}
				}),
				makeMoveSnapshot()
			)
		).toBe(false);
	});

	it('same with secondary → true', () => {
		const sec = {
			from: 7 as Square,
			to: 5 as Square,
			piece: PieceCode.WhiteRook as NonEmptyPieceCode
		};
		expect(
			movesEqual(makeMoveSnapshot({ secondary: sec }), makeMoveSnapshot({ secondary: sec }))
		).toBe(true);
	});
});

describe('moveRequestBasesEqual', () => {
	it('null vs null → true', () => {
		expect(moveRequestBasesEqual(null, null)).toBe(true);
	});

	it('null vs non-null → false', () => {
		expect(moveRequestBasesEqual(null, { from: 0 as Square, to: 1 as Square })).toBe(false);
	});

	it('same from/to → true', () => {
		expect(
			moveRequestBasesEqual(
				{ from: 12 as Square, to: 28 as Square },
				{ from: 12 as Square, to: 28 as Square }
			)
		).toBe(true);
	});

	it('different from → false', () => {
		expect(
			moveRequestBasesEqual(
				{ from: 12 as Square, to: 28 as Square },
				{ from: 0 as Square, to: 28 as Square }
			)
		).toBe(false);
	});
});

describe('moveRequestsEqual', () => {
	it('same with all fields → true', () => {
		const req = {
			from: 12 as Square,
			to: 28 as Square,
			capturedSquare: 28 as Square,
			promotedTo: RoleCode.Queen as RolePromotionCode,
			secondary: { from: 7 as Square, to: 5 as Square }
		};
		expect(moveRequestsEqual(req, { ...req })).toBe(true);
	});

	it('null vs null → true', () => {
		expect(moveRequestsEqual(null, null)).toBe(true);
	});

	it('different capturedSquare → false', () => {
		const base = { from: 12 as Square, to: 28 as Square };
		expect(
			moveRequestsEqual(
				{ ...base, capturedSquare: 28 as Square },
				{ ...base, capturedSquare: 20 as Square }
			)
		).toBe(false);
	});

	it('different promotedTo → false', () => {
		const base = { from: 12 as Square, to: 28 as Square };
		expect(
			moveRequestsEqual(
				{ ...base, promotedTo: RoleCode.Queen as RolePromotionCode },
				{ ...base, promotedTo: RoleCode.Knight as RolePromotionCode }
			)
		).toBe(false);
	});

	it('different secondary → false', () => {
		const base = { from: 12 as Square, to: 28 as Square };
		expect(
			moveRequestsEqual(
				{ ...base, secondary: { from: 7 as Square, to: 5 as Square } },
				{ ...base, secondary: { from: 0 as Square, to: 2 as Square } }
			)
		).toBe(false);
	});
});

describe('moveDestinationsEqual', () => {
	it('null vs null → true', () => {
		expect(moveDestinationsEqual(null, null)).toBe(true);
	});

	it('null vs non-null → false', () => {
		expect(moveDestinationsEqual(null, makeMoveDestination())).toBe(false);
	});

	it('same → true', () => {
		expect(moveDestinationsEqual(makeMoveDestination(), makeMoveDestination())).toBe(true);
	});

	it('different to → false', () => {
		expect(
			moveDestinationsEqual(makeMoveDestination(), makeMoveDestination({ to: 0 as Square }))
		).toBe(false);
	});

	it('same promotedTo elements in different order → true', () => {
		expect(
			moveDestinationsEqual(
				makeMoveDestination({ promotedTo: [RoleCode.Queen, RoleCode.Knight] }),
				makeMoveDestination({ promotedTo: [RoleCode.Knight, RoleCode.Queen] })
			)
		).toBe(true);
	});

	it('different promotedTo elements → false', () => {
		expect(
			moveDestinationsEqual(
				makeMoveDestination({ promotedTo: [RoleCode.Queen] }),
				makeMoveDestination({ promotedTo: [RoleCode.Knight] })
			)
		).toBe(false);
	});
});

describe('pendingUIMoveRequestsEqual', () => {
	it('null vs null → true', () => {
		expect(pendingUIMoveRequestsEqual(null, null)).toBe(true);
	});

	it('null vs non-null → false', () => {
		const snap = {
			status: 'unresolved' as const,
			sourceSquare: 12 as Square,
			destination: makeMoveDestination(),
			canBeAutoResolved: true,
			resolvedMoveRequest: null
		};
		expect(pendingUIMoveRequestsEqual(null, snap)).toBe(false);
	});

	it('same snapshots → true', () => {
		const snap = {
			status: 'unresolved' as const,
			sourceSquare: 12 as Square,
			destination: makeMoveDestination(),
			canBeAutoResolved: true,
			resolvedMoveRequest: null
		};
		expect(pendingUIMoveRequestsEqual(snap, { ...snap })).toBe(true);
	});

	it('different status → false', () => {
		const base = {
			sourceSquare: 12 as Square,
			destination: makeMoveDestination(),
			canBeAutoResolved: true,
			resolvedMoveRequest: null
		};
		expect(
			pendingUIMoveRequestsEqual(
				{ ...base, status: 'unresolved' as const },
				{ ...base, status: 'deferred' as const }
			)
		).toBe(false);
	});
});

describe('changeStatesEqual', () => {
	it('null vs null → true', () => {
		expect(changeStatesEqual(null, null)).toBe(true);
	});

	it('same → true', () => {
		const state = { lastMove: null, deferredUIMoveRequest: null };
		expect(changeStatesEqual(state, { ...state })).toBe(true);
	});

	it('different lastMove → false', () => {
		expect(
			changeStatesEqual(
				{ lastMove: null, deferredUIMoveRequest: null },
				{ lastMove: makeMoveSnapshot(), deferredUIMoveRequest: null }
			)
		).toBe(false);
	});
});
