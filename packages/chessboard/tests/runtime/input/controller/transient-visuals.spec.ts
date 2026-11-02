import { describe, expect, it } from 'vitest';
import type { ScenePointerEvent } from '../../../../src/extensions/types/basic/events.js';
import { transmitTransientInput } from '../../../../src/runtime/input/controller/transient-visuals.js';
import { createEventContext, createMockSurface } from '../../../test-utils/runtime/controller.js';

function makeScenePointerEvent(overrides?: Partial<ScenePointerEvent>): ScenePointerEvent {
	return {
		type: 'pointermove',
		point: { x: 100, y: 100 },
		clampedPoint: { x: 100, y: 100 },
		boardClampedPoint: { x: 100, y: 100 },
		targetSquare: 28,
		...overrides
	} as ScenePointerEvent;
}

describe('transmitTransientInput', () => {
	it('calls surface.transientInput when scene event is pointer with boardClampedPoint', () => {
		const surface = createMockSurface();
		const sceneEvent = makeScenePointerEvent();
		const context = createEventContext({
			rawEvent: new PointerEvent('pointermove'),
			sceneEvent
		});

		transmitTransientInput({ surface }, context);

		expect(surface.transientInput).toHaveBeenCalledOnce();
		expect(surface.transientInput).toHaveBeenCalledWith({
			target: 28,
			point: { x: 100, y: 100 },
			clampedPoint: { x: 100, y: 100 },
			boardClampedPoint: { x: 100, y: 100 }
		});
	});

	it('does not call transientInput when sceneEvent is null', () => {
		const surface = createMockSurface();
		const context = createEventContext({
			rawEvent: new PointerEvent('pointermove'),
			sceneEvent: null
		});

		transmitTransientInput({ surface }, context);

		expect(surface.transientInput).not.toHaveBeenCalled();
	});

	it('does not call transientInput when boardClampedPoint is null', () => {
		const surface = createMockSurface();
		const sceneEvent = makeScenePointerEvent({ boardClampedPoint: null });
		const context = createEventContext({
			rawEvent: new PointerEvent('pointermove'),
			sceneEvent
		});

		transmitTransientInput({ surface }, context);

		expect(surface.transientInput).not.toHaveBeenCalled();
	});

	it('does not call transientInput when raw event is not a PointerEvent', () => {
		const surface = createMockSurface();
		const sceneEvent = makeScenePointerEvent();
		const context = createEventContext({
			rawEvent: new Event('pointermove'),
			sceneEvent
		});

		transmitTransientInput({ surface }, context);

		expect(surface.transientInput).not.toHaveBeenCalled();
	});
});
