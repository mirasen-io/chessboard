import { describe, expect, it, type Mock } from 'vitest';
import type { ScenePointerEvent } from '../../../../src/extensions/types/basic/events.js';
import { createInteractionController } from '../../../../src/runtime/input/controller/factory.js';
import { PieceCode } from '../../../../src/state/board/types/internal.js';
import { MovabilityModeCode } from '../../../../src/state/interaction/types/internal.js';
import { createEventContext, createMockSurface } from '../../../test-utils/runtime/controller.js';

function makeScenePointerEvent(
	type: ScenePointerEvent['type'],
	targetSquare: number | null = null
): ScenePointerEvent {
	return {
		type,
		point: { x: 100, y: 100 },
		clampedPoint: { x: 100, y: 100 },
		boardClampedPoint: { x: 100, y: 100 },
		targetSquare
	} as ScenePointerEvent;
}

describe('createInteractionController', () => {
	describe('onEvent routing', () => {
		it('calls surface.onEvent with enriched context including runtimeInteractionActionPreview', () => {
			const surface = createMockSurface();
			const controller = createInteractionController({ surface });
			const context = createEventContext({
				rawEvent: new PointerEvent('pointermove'),
				sceneEvent: makeScenePointerEvent('pointermove')
			});

			controller.onEvent(context);

			expect(surface.onEvent).toHaveBeenCalledOnce();
			expect(surface.onEvent).toHaveBeenCalledWith({
				...context,
				runtimeInteractionActionPreview: null
			});
		});

		it('passes non-null runtimeInteractionActionPreview to surface.onEvent when action is determined', () => {
			const surface = createMockSurface({
				getPieceCodeAt: () => PieceCode.WhitePawn
			});
			const controller = createInteractionController({ surface });
			const context = createEventContext({
				rawEvent: new PointerEvent('pointerdown', { button: 0 }),
				sceneEvent: makeScenePointerEvent('pointerdown', 12)
			});

			controller.onEvent(context);

			expect(surface.onEvent).toHaveBeenCalledWith({
				...context,
				runtimeInteractionActionPreview: { type: 'startLiftedDrag', source: 12, target: 12 }
			});
		});

		it('calls surface.onEvent before executing the action', () => {
			const surface = createMockSurface({
				getPieceCodeAt: () => PieceCode.WhitePawn
			});
			const controller = createInteractionController({ surface });
			const context = createEventContext({
				rawEvent: new PointerEvent('pointerdown', { button: 0 }),
				sceneEvent: makeScenePointerEvent('pointerdown', 12)
			});

			controller.onEvent(context);

			const onEventOrder = (surface.onEvent as Mock).mock.invocationCallOrder[0];
			const startLiftedDragOrder = (surface.startLiftedDrag as Mock).mock.invocationCallOrder[0];
			expect(onEventOrder).toBeLessThan(startLiftedDragOrder);
		});

		it('skips action execution when rawEvent.defaultPrevented', () => {
			const surface = createMockSurface({
				snapshot: {
					dragSession: {
						owner: 'core',
						type: 'lifted-piece-drag',
						sourceSquare: 12,
						sourcePieceCode: PieceCode.WhitePawn,
						targetSquare: 28
					}
				}
			});
			const controller = createInteractionController({ surface });
			const rawEvent = new PointerEvent('pointermove', { cancelable: true });
			rawEvent.preventDefault();
			const context = createEventContext({
				rawEvent,
				sceneEvent: makeScenePointerEvent('pointermove', 20)
			});

			controller.onEvent(context);

			// Action execution (updateDragSessionCurrentTarget) should NOT be called
			expect(surface.updateDragSessionCurrentTarget).not.toHaveBeenCalled();
		});

		it('still transmits transient input when defaultPrevented with valid boardClampedPoint', () => {
			const surface = createMockSurface();
			const controller = createInteractionController({ surface });
			const rawEvent = new PointerEvent('pointermove', { cancelable: true });
			rawEvent.preventDefault();
			const context = createEventContext({
				rawEvent,
				sceneEvent: makeScenePointerEvent('pointermove', 20)
			});

			controller.onEvent(context);

			expect(surface.transientInput).toHaveBeenCalledOnce();
		});

		it('does not call core pointer methods for non-pointer events', () => {
			const surface = createMockSurface();
			const controller = createInteractionController({ surface });
			const context = createEventContext({
				rawEvent: new Event('click'),
				sceneEvent: null
			});

			controller.onEvent(context);

			expect(surface.startLiftedDrag).not.toHaveBeenCalled();
			expect(surface.updateDragSessionCurrentTarget).not.toHaveBeenCalled();
			expect(surface.cancelActiveInteraction).not.toHaveBeenCalled();
		});
	});

	describe('pointerdown routing', () => {
		it('executes startLiftedDrag when target has a piece', () => {
			const surface = createMockSurface({
				getPieceCodeAt: () => PieceCode.WhitePawn
			});
			const controller = createInteractionController({ surface });
			const context = createEventContext({
				rawEvent: new PointerEvent('pointerdown', { button: 0 }),
				sceneEvent: makeScenePointerEvent('pointerdown', 12)
			});

			controller.onEvent(context);

			expect(surface.startLiftedDrag).toHaveBeenCalledWith(12, 12);
		});
	});

	describe('pointermove routing', () => {
		it('executes updateDragSessionCurrentTarget when drag is active', () => {
			const surface = createMockSurface({
				snapshot: {
					dragSession: {
						owner: 'core',
						type: 'lifted-piece-drag',
						sourceSquare: 12,
						sourcePieceCode: PieceCode.WhitePawn,
						targetSquare: 12
					}
				}
			});
			const controller = createInteractionController({ surface });
			const context = createEventContext({
				rawEvent: new PointerEvent('pointermove'),
				sceneEvent: makeScenePointerEvent('pointermove', 28)
			});

			controller.onEvent(context);

			expect(surface.updateDragSessionCurrentTarget).toHaveBeenCalledWith(28);
		});
	});

	describe('pointerup routing', () => {
		it('executes completeExtensionDrag for extension-owned drag session', () => {
			const surface = createMockSurface({
				snapshot: {
					dragSession: {
						owner: 'my-ext',
						type: 'lifted-piece-drag',
						sourceSquare: 12,
						sourcePieceCode: PieceCode.WhitePawn,
						targetSquare: 28
					}
				}
			});
			const controller = createInteractionController({ surface });
			const context = createEventContext({
				rawEvent: new PointerEvent('pointerup'),
				sceneEvent: makeScenePointerEvent('pointerup', 28)
			});

			controller.onEvent(context);

			expect(surface.completeExtensionDrag).toHaveBeenCalledWith(28);
		});

		it('executes cancelActiveInteraction for core drag when target is source', () => {
			const surface = createMockSurface({
				snapshot: {
					dragSession: {
						owner: 'core',
						type: 'lifted-piece-drag',
						sourceSquare: 12,
						sourcePieceCode: PieceCode.WhitePawn,
						targetSquare: 12
					}
				}
			});
			const controller = createInteractionController({ surface });
			const context = createEventContext({
				rawEvent: new PointerEvent('pointerup'),
				sceneEvent: makeScenePointerEvent('pointerup', 12)
			});

			controller.onEvent(context);

			expect(surface.cancelActiveInteraction).toHaveBeenCalledOnce();
		});

		it('executes completeCoreDragTo for core drag with valid target in free mode', () => {
			const surface = createMockSurface({
				snapshot: {
					selected: { square: 12, pieceCode: PieceCode.WhitePawn },
					movability: { mode: MovabilityModeCode.Free },
					dragSession: {
						owner: 'core',
						type: 'lifted-piece-drag',
						sourceSquare: 12,
						sourcePieceCode: PieceCode.WhitePawn,
						targetSquare: 28
					}
				}
			});
			const controller = createInteractionController({ surface });
			const context = createEventContext({
				rawEvent: new PointerEvent('pointerup'),
				sceneEvent: makeScenePointerEvent('pointerup', 28)
			});

			controller.onEvent(context);

			expect(surface.completeCoreDragTo).toHaveBeenCalledWith(28);
		});
	});

	describe('pointercancel routing', () => {
		it('executes cancelActiveInteraction when drag is active', () => {
			const surface = createMockSurface({
				snapshot: {
					dragSession: {
						owner: 'core',
						type: 'lifted-piece-drag',
						sourceSquare: 12,
						sourcePieceCode: PieceCode.WhitePawn,
						targetSquare: 28
					}
				}
			});
			const controller = createInteractionController({ surface });
			const context = createEventContext({
				rawEvent: new PointerEvent('pointercancel'),
				sceneEvent: makeScenePointerEvent('pointercancel', 28)
			});

			controller.onEvent(context);

			expect(surface.cancelActiveInteraction).toHaveBeenCalledOnce();
		});
	});

	describe('lostpointercapture routing', () => {
		it('executes cancelActiveInteraction when drag is active', () => {
			const surface = createMockSurface({
				snapshot: {
					dragSession: {
						owner: 'core',
						type: 'lifted-piece-drag',
						sourceSquare: 12,
						sourcePieceCode: PieceCode.WhitePawn,
						targetSquare: 28
					}
				}
			});
			const controller = createInteractionController({ surface });
			const context = createEventContext({
				rawEvent: new PointerEvent('lostpointercapture'),
				sceneEvent: makeScenePointerEvent('lostpointercapture', 28)
			});

			controller.onEvent(context);

			expect(surface.cancelActiveInteraction).toHaveBeenCalledOnce();
		});

		it('does not call cancelActiveInteraction when no drag session', () => {
			const surface = createMockSurface();
			const controller = createInteractionController({ surface });
			const context = createEventContext({
				rawEvent: new PointerEvent('lostpointercapture'),
				sceneEvent: makeScenePointerEvent('lostpointercapture')
			});

			controller.onEvent(context);

			expect(surface.cancelActiveInteraction).not.toHaveBeenCalled();
		});
	});
});
