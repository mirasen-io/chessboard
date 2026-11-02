import { describe, expect, it } from 'vitest';
import type { ScenePointerEvent } from '../../../../src/extensions/types/basic/events.js';
import { determineActionPointerMove } from '../../../../src/runtime/input/controller/pointer.js';
import { PieceCode, type Square } from '../../../../src/state/board/types/internal.js';
import { createEventContext, createMockSurface } from '../../../test-utils/runtime/controller.js';

function makeContext(
	targetSquare: number | null,
	point: { x: number; y: number } = { x: 100, y: 100 }
) {
	return createEventContext({
		rawEvent: new PointerEvent('pointermove'),
		sceneEvent: {
			type: 'pointermove',
			point,
			clampedPoint: point,
			boardClampedPoint: point,
			targetSquare
		} as ScenePointerEvent
	});
}

describe('determineActionPointerMove', () => {
	it('returns null when no active drag session', () => {
		const surface = createMockSurface();
		const context = makeContext(28);

		const result = determineActionPointerMove({ surface }, context);

		expect(result).toBeNull();
	});

	it('returns updateDragSessionCurrentTarget when drag session is active and target is a square', () => {
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
			}
		});
		const context = makeContext(28);

		const result = determineActionPointerMove({ surface }, context);

		expect(result).toEqual({ type: 'updateDragSessionCurrentTarget', targetSquare: 28 });
	});

	it('returns updateDragSessionCurrentTarget with null target when drag session is active and target is null', () => {
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
			}
		});
		const context = createEventContext({
			rawEvent: new PointerEvent('pointermove'),
			sceneEvent: {
				type: 'pointermove',
				point: { x: -10, y: -10 },
				clampedPoint: { x: 0, y: 0 },
				boardClampedPoint: null,
				targetSquare: null
			} as ScenePointerEvent
		});

		const result = determineActionPointerMove({ surface }, context);

		expect(result).toEqual({ type: 'updateDragSessionCurrentTarget', targetSquare: null });
	});

	it('returns updateDragSessionCurrentTarget for pending lifted-piece below threshold', () => {
		const surface = createMockSurface({
			snapshot: {
				dragSession: {
					owner: 'core',
					type: 'lifted-piece-drag',
					phase: 'pending',
					sourceSquare: 12 as Square,
					sourcePieceCode: PieceCode.WhitePawn,
					targetSquare: 12 as Square,
					startButton: 0,
					startPoint: { x: 0, y: 0 },
					thresholdPx: 4
				}
			}
		});
		// distance from (0,0) to (1,1) is sqrt(2) ~ 1.41, below 4
		const context = makeContext(12, { x: 1, y: 1 });

		const result = determineActionPointerMove({ surface }, context);

		expect(result).toEqual({ type: 'updateDragSessionCurrentTarget', targetSquare: 12 });
	});

	it('returns activatePendingLiftedDragSession for pending lifted-piece at/above threshold', () => {
		const surface = createMockSurface({
			snapshot: {
				dragSession: {
					owner: 'core',
					type: 'lifted-piece-drag',
					phase: 'pending',
					sourceSquare: 12 as Square,
					sourcePieceCode: PieceCode.WhitePawn,
					targetSquare: 12 as Square,
					startButton: 0,
					startPoint: { x: 0, y: 0 },
					thresholdPx: 4
				}
			}
		});
		// distance from (0,0) to (4,0) is exactly 4, inclusive boundary
		const context = makeContext(28, { x: 4, y: 0 });

		const result = determineActionPointerMove({ surface }, context);

		expect(result).toEqual({ type: 'activatePendingLiftedDragSession', targetSquare: 28 });
	});

	it('activates an extension-owned pending lifted-piece session when threshold crossed', () => {
		const surface = createMockSurface({
			snapshot: {
				dragSession: {
					owner: 'my-ext',
					type: 'lifted-piece-drag',
					phase: 'pending',
					sourceSquare: 12 as Square,
					sourcePieceCode: PieceCode.WhitePawn,
					targetSquare: 12 as Square,
					startButton: 0,
					startPoint: { x: 0, y: 0 },
					thresholdPx: 4
				}
			}
		});
		const context = makeContext(28, { x: 5, y: 0 });

		const result = determineActionPointerMove({ surface }, context);

		expect(result).toEqual({ type: 'activatePendingLiftedDragSession', targetSquare: 28 });
	});

	it('asserts when sceneEvent is missing on pending session', () => {
		const surface = createMockSurface({
			snapshot: {
				dragSession: {
					owner: 'core',
					type: 'lifted-piece-drag',
					phase: 'pending',
					sourceSquare: 12 as Square,
					sourcePieceCode: PieceCode.WhitePawn,
					targetSquare: 12 as Square,
					startButton: 0,
					startPoint: { x: 0, y: 0 },
					thresholdPx: 4
				}
			}
		});
		const context = createEventContext({
			rawEvent: new PointerEvent('pointermove'),
			sceneEvent: null
		});

		expect(() => determineActionPointerMove({ surface }, context)).toThrow(
			/pointermove requires a scene event/
		);
	});
});
