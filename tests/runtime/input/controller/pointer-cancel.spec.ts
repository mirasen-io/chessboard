import { describe, expect, it } from 'vitest';
import type { ScenePointerEvent } from '../../../../src/extensions/types/basic/events.js';
import { handlePointerCancel } from '../../../../src/runtime/input/controller/pointer.js';
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

describe('handlePointerCancel', () => {
	it('does nothing when no active drag session', () => {
		const surface = createMockSurface();
		const context = makeContext();

		handlePointerCancel({ surface }, context);

		expect(surface.cancelActiveInteraction).not.toHaveBeenCalled();
	});

	it('calls cancelActiveInteraction when drag session is active', () => {
		const surface = createMockSurface({
			snapshot: {
				dragSession: {
					owner: 'core',
					type: 'lifted-piece-drag',
					sourceSquare: 12 as Square,
					sourcePieceCode: PieceCode.WhitePawn,
					targetSquare: 28 as Square
				}
			}
		});
		const context = makeContext();

		handlePointerCancel({ surface }, context);

		expect(surface.cancelActiveInteraction).toHaveBeenCalledOnce();
	});
});
