import { describe, expect, it } from 'vitest';
import type { ScenePointerEvent } from '../../../../src/extensions/types/basic/events.js';
import { determineActionPointerDown } from '../../../../src/runtime/input/controller/pointer.js';
import { PieceCode, type Square } from '../../../../src/state/board/types/internal.js';
import { MovabilityModeCode } from '../../../../src/state/interaction/types/internal.js';
import { createEventContext, createMockSurface } from '../../../test-utils/runtime/controller.js';

function makeContext(targetSquare: number | null, button = 0) {
	return createEventContext({
		rawEvent: new PointerEvent('pointerdown', { button }),
		sceneEvent: {
			type: 'pointerdown',
			point: { x: 100, y: 100 },
			clampedPoint: { x: 100, y: 100 },
			boardClampedPoint: { x: 100, y: 100 },
			targetSquare
		} as ScenePointerEvent
	});
}

describe('determineActionPointerDown', () => {
	it('returns null for non-left button', () => {
		const surface = createMockSurface({
			getPieceCodeAt: () => PieceCode.WhitePawn
		});
		const context = makeContext(12, 2); // right-click

		const result = determineActionPointerDown({ surface }, context);

		expect(result).toBeNull();
	});

	it('returns null when drag session is already active', () => {
		const surface = createMockSurface({
			snapshot: {
				dragSession: {
					owner: 'core',
					type: 'lifted-piece-drag',
					sourceSquare: 12 as Square,
					sourcePieceCode: PieceCode.WhitePawn,
					targetSquare: 12 as Square,
					startButton: 0
				}
			},
			getPieceCodeAt: () => PieceCode.WhitePawn
		});
		const context = makeContext(20);

		const result = determineActionPointerDown({ surface }, context);

		expect(result).toBeNull();
	});

	it('returns null when targetSquare is null', () => {
		const surface = createMockSurface({
			getPieceCodeAt: () => PieceCode.WhitePawn
		});
		const context = makeContext(null);

		const result = determineActionPointerDown({ surface }, context);

		expect(result).toBeNull();
	});

	it('returns startLiftedDrag when no selection and target has a piece', () => {
		const surface = createMockSurface({
			getPieceCodeAt: () => PieceCode.WhitePawn
		});
		const context = makeContext(12);

		const result = determineActionPointerDown({ surface }, context);

		expect(result).toEqual({ type: 'startLiftedDrag', source: 12, target: 12, startButton: 0 });
	});

	it('returns null when no selection and target is empty', () => {
		const surface = createMockSurface({
			getPieceCodeAt: () => PieceCode.Empty
		});
		const context = makeContext(28);

		const result = determineActionPointerDown({ surface }, context);

		expect(result).toBeNull();
	});

	it('returns startReleaseTargetingDrag when selected and target is empty', () => {
		const surface = createMockSurface({
			snapshot: {
				selected: { square: 12 as Square, pieceCode: PieceCode.WhitePawn }
			},
			getPieceCodeAt: () => PieceCode.Empty
		});
		const context = makeContext(28);

		const result = determineActionPointerDown({ surface }, context);

		expect(result).toEqual({
			type: 'startReleaseTargetingDrag',
			source: 12,
			target: 28,
			startButton: 0
		});
	});

	it('returns startLiftedDrag when selected and target is same square (re-lift)', () => {
		const surface = createMockSurface({
			snapshot: {
				selected: { square: 12 as Square, pieceCode: PieceCode.WhitePawn }
			},
			getPieceCodeAt: () => PieceCode.WhitePawn
		});
		const context = makeContext(12);

		const result = determineActionPointerDown({ surface }, context);

		expect(result).toEqual({ type: 'startLiftedDrag', source: 12, target: 12, startButton: 0 });
	});

	it('returns startLiftedDrag when selected and target has same-color piece', () => {
		const surface = createMockSurface({
			snapshot: {
				selected: { square: 12 as Square, pieceCode: PieceCode.WhitePawn }
			},
			getPieceCodeAt: () => PieceCode.WhiteKnight
		});
		const context = makeContext(6);

		const result = determineActionPointerDown({ surface }, context);

		expect(result).toEqual({ type: 'startLiftedDrag', source: 6, target: 6, startButton: 0 });
	});

	it('returns startReleaseTargetingDrag when selected and target has opposite-color piece that is a legal move target (free mode)', () => {
		const surface = createMockSurface({
			snapshot: {
				selected: { square: 12 as Square, pieceCode: PieceCode.WhitePawn },
				movability: { mode: MovabilityModeCode.Free }
			},
			getPieceCodeAt: () => PieceCode.BlackPawn
		});
		const context = makeContext(28);

		const result = determineActionPointerDown({ surface }, context);

		expect(result).toEqual({
			type: 'startReleaseTargetingDrag',
			source: 12,
			target: 28,
			startButton: 0
		});
	});

	it('returns startReleaseTargetingDrag when selected and target has opposite-color piece in strict mode with target in destinations', () => {
		const destinations = new Map([[28 as Square, { to: 28 as Square }]] as const);
		const surface = createMockSurface({
			snapshot: {
				selected: { square: 12 as Square, pieceCode: PieceCode.WhitePawn },
				movability: { mode: MovabilityModeCode.Strict, destinations: {} },
				activeDestinations: destinations as unknown as Map<Square, { to: Square }>
			},
			getPieceCodeAt: () => PieceCode.BlackPawn
		});
		const context = makeContext(28);

		const result = determineActionPointerDown({ surface }, context);

		expect(result).toEqual({
			type: 'startReleaseTargetingDrag',
			source: 12,
			target: 28,
			startButton: 0
		});
	});

	it('returns startLiftedDrag when selected and target has opposite-color piece but is NOT a legal target (disabled mode)', () => {
		const surface = createMockSurface({
			snapshot: {
				selected: { square: 12 as Square, pieceCode: PieceCode.WhitePawn },
				movability: { mode: MovabilityModeCode.Disabled }
			},
			getPieceCodeAt: () => PieceCode.BlackPawn
		});
		const context = makeContext(28);

		const result = determineActionPointerDown({ surface }, context);

		expect(result).toEqual({ type: 'startLiftedDrag', source: 28, target: 28, startButton: 0 });
	});
});
