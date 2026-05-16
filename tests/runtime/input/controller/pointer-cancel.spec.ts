import { describe, expect, it } from 'vitest';
import type { ScenePointerEvent } from '../../../../src/extensions/types/basic/events.js';
import { determineActionPointerCancel } from '../../../../src/runtime/input/controller/pointer.js';
import { PieceCode, type Square } from '../../../../src/state/board/types/internal.js';
import { createEventContext, createMockSurface } from '../../../test-utils/runtime/controller.js';

function makeContext() {
	return createEventContext({
		rawEvent: new PointerEvent('pointercancel'),
		sceneEvent: {
			type: 'pointercancel',
			point: { x: 100, y: 100 },
			clampedPoint: { x: 100, y: 100 },
			boardClampedPoint: { x: 100, y: 100 },
			targetSquare: null
		} as ScenePointerEvent
	});
}

describe('determineActionPointerCancel', () => {
	it('returns null when no active drag session', () => {
		const surface = createMockSurface();
		const context = makeContext();

		const result = determineActionPointerCancel({ surface }, context);

		expect(result).toBeNull();
	});

	it('returns cancelActiveInteraction when drag session is active', () => {
		const surface = createMockSurface({
			snapshot: {
				dragSession: {
					owner: 'core',
					type: 'lifted-piece-drag',
					sourceSquare: 12 as Square,
					sourcePieceCode: PieceCode.WhitePawn,
					targetSquare: 28 as Square,
					startButton: 0
				}
			}
		});
		const context = makeContext();

		const result = determineActionPointerCancel({ surface }, context);

		expect(result).toEqual({ type: 'cancelActiveInteraction' });
	});
});
