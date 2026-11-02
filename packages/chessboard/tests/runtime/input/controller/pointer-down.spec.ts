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
					phase: 'active',
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

	it('returns startLiftedDragSession (active) when no selection and target has a piece', () => {
		const surface = createMockSurface({
			getPieceCodeAt: () => PieceCode.WhitePawn
		});
		const context = makeContext(12);

		const result = determineActionPointerDown({ surface }, context);

		expect(result).toEqual({
			type: 'startLiftedDragSession',
			phase: 'active',
			sourceSquare: 12,
			targetSquare: 12,
			startButton: 0
		});
	});

	it('returns null when no selection and target is empty', () => {
		const surface = createMockSurface({
			getPieceCodeAt: () => PieceCode.Empty
		});
		const context = makeContext(28);

		const result = determineActionPointerDown({ surface }, context);

		expect(result).toBeNull();
	});

	it('returns startReleaseTargetingDragSession when selected and target is empty', () => {
		const surface = createMockSurface({
			snapshot: {
				selected: { square: 12 as Square, pieceCode: PieceCode.WhitePawn }
			},
			getPieceCodeAt: () => PieceCode.Empty
		});
		const context = makeContext(28);

		const result = determineActionPointerDown({ surface }, context);

		expect(result).toEqual({
			type: 'startReleaseTargetingDragSession',
			sourceSquare: 12,
			targetSquare: 28,
			startButton: 0
		});
	});

	it('returns startLiftedDragSession (active) when selected and target is same square (re-lift)', () => {
		const surface = createMockSurface({
			snapshot: {
				selected: { square: 12 as Square, pieceCode: PieceCode.WhitePawn }
			},
			getPieceCodeAt: () => PieceCode.WhitePawn
		});
		const context = makeContext(12);

		const result = determineActionPointerDown({ surface }, context);

		expect(result).toEqual({
			type: 'startLiftedDragSession',
			phase: 'active',
			sourceSquare: 12,
			targetSquare: 12,
			startButton: 0
		});
	});

	it('returns startLiftedDragSession (active) when selected and target has same-color piece', () => {
		const surface = createMockSurface({
			snapshot: {
				selected: { square: 12 as Square, pieceCode: PieceCode.WhitePawn }
			},
			getPieceCodeAt: () => PieceCode.WhiteKnight
		});
		const context = makeContext(6);

		const result = determineActionPointerDown({ surface }, context);

		expect(result).toEqual({
			type: 'startLiftedDragSession',
			phase: 'active',
			sourceSquare: 6,
			targetSquare: 6,
			startButton: 0
		});
	});

	it('returns startReleaseTargetingDragSession when selected and target has opposite-color piece that is a legal move target (free mode)', () => {
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
			type: 'startReleaseTargetingDragSession',
			sourceSquare: 12,
			targetSquare: 28,
			startButton: 0
		});
	});

	it('returns startReleaseTargetingDragSession when selected and target has opposite-color piece in strict mode with target in destinations', () => {
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
			type: 'startReleaseTargetingDragSession',
			sourceSquare: 12,
			targetSquare: 28,
			startButton: 0
		});
	});

	it('returns startLiftedDragSession (active) when selected and target has opposite-color piece but is NOT a legal target (disabled mode)', () => {
		const surface = createMockSurface({
			snapshot: {
				selected: { square: 12 as Square, pieceCode: PieceCode.WhitePawn },
				movability: { mode: MovabilityModeCode.Disabled }
			},
			getPieceCodeAt: () => PieceCode.BlackPawn
		});
		const context = makeContext(28);

		const result = determineActionPointerDown({ surface }, context);

		expect(result).toEqual({
			type: 'startLiftedDragSession',
			phase: 'active',
			sourceSquare: 28,
			targetSquare: 28,
			startButton: 0
		});
	});

	it('starts active lifted-piece drag when thresholdPx === 0', () => {
		const surface = createMockSurface({
			snapshot: {
				config: { drag: { liftedActivation: { thresholdPx: 0 } } }
			},
			getPieceCodeAt: () => PieceCode.WhitePawn
		});
		const context = makeContext(12);

		const result = determineActionPointerDown({ surface }, context);

		expect(result).toEqual({
			type: 'startLiftedDragSession',
			phase: 'active',
			sourceSquare: 12,
			targetSquare: 12,
			startButton: 0
		});
	});

	it('starts pending lifted-piece drag when thresholdPx > 0', () => {
		const surface = createMockSurface({
			snapshot: {
				config: { drag: { liftedActivation: { thresholdPx: 4 } } }
			},
			getPieceCodeAt: () => PieceCode.WhitePawn
		});
		const context = makeContext(12);

		const result = determineActionPointerDown({ surface }, context);

		expect(result).toEqual({
			type: 'startLiftedDragSession',
			phase: 'pending',
			sourceSquare: 12,
			targetSquare: 12,
			startButton: 0,
			startPoint: { x: 100, y: 100 },
			thresholdPx: 4
		});
	});
});
