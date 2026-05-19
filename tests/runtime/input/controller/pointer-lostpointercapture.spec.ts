import { describe, expect, it } from 'vitest';
import type { ScenePointerEvent } from '../../../../src/extensions/types/basic/events.js';
import {
	determineActionLostPointerCapture,
	determineActionPointerUp
} from '../../../../src/runtime/input/controller/pointer.js';
import { PieceCode, type Square } from '../../../../src/state/board/types/internal.js';
import { MovabilityModeCode } from '../../../../src/state/interaction/types/internal.js';
import { createEventContext, createMockSurface } from '../../../test-utils/runtime/controller.js';

function makeContext(options: { buttons: number; targetSquare: number | null }) {
	return createEventContext({
		rawEvent: new PointerEvent('lostpointercapture', { buttons: options.buttons }),
		sceneEvent: {
			type: 'lostpointercapture',
			point: { x: 100, y: 100 },
			clampedPoint: { x: 100, y: 100 },
			boardClampedPoint: { x: 100, y: 100 },
			targetSquare: options.targetSquare
		} as ScenePointerEvent
	});
}

describe('determineActionLostPointerCapture', () => {
	it('returns null when no active drag session', () => {
		const surface = createMockSurface();
		const context = makeContext({ buttons: 0, targetSquare: null });

		const result = determineActionLostPointerCapture({ surface }, context);

		expect(result).toBeNull();
	});

	describe('terminal release inside board (button released, valid target)', () => {
		it('commits move via completeCoreDragSessionTo in free mode', () => {
			const surface = createMockSurface({
				snapshot: {
					selected: { square: 12 as Square, pieceCode: PieceCode.WhitePawn },
					movability: { mode: MovabilityModeCode.Free },
					dragSession: {
						owner: 'core',
						type: 'lifted-piece-drag',
						phase: 'active',
						sourceSquare: 12 as Square,
						sourcePieceCode: PieceCode.WhitePawn,
						targetSquare: 28 as Square,
						startButton: 0
					}
				}
			});
			// buttons=0 means primary button (0) is no longer pressed
			const context = makeContext({ buttons: 0, targetSquare: 28 });

			const result = determineActionLostPointerCapture({ surface }, context);

			expect(result).toEqual({ type: 'completeCoreDragSessionTo', targetSquare: 28 });
		});

		it('subsequent pointerup is no-op when drag session already cleared', () => {
			const surface = createMockSurface({
				snapshot: { dragSession: null }
			});
			const context = createEventContext({
				rawEvent: new PointerEvent('pointerup'),
				sceneEvent: {
					type: 'pointerup',
					point: { x: 100, y: 100 },
					clampedPoint: { x: 100, y: 100 },
					boardClampedPoint: { x: 100, y: 100 },
					targetSquare: 28
				} as ScenePointerEvent
			});

			const result = determineActionPointerUp({ surface }, context);

			expect(result).toBeNull();
		});

		it('returns cancelActiveInteraction when target equals source square', () => {
			const surface = createMockSurface({
				snapshot: {
					selected: { square: 12 as Square, pieceCode: PieceCode.WhitePawn },
					movability: { mode: MovabilityModeCode.Free },
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
			const context = makeContext({ buttons: 0, targetSquare: 12 });

			const result = determineActionLostPointerCapture({ surface }, context);

			expect(result).toEqual({ type: 'cancelActiveInteraction' });
		});
	});

	describe('terminal release outside board (button released, null target)', () => {
		it('returns cancelActiveInteraction for lifted-piece-drag when targetSquare is null', () => {
			const surface = createMockSurface({
				snapshot: {
					selected: { square: 12 as Square, pieceCode: PieceCode.WhitePawn },
					movability: { mode: MovabilityModeCode.Free },
					dragSession: {
						owner: 'core',
						type: 'lifted-piece-drag',
						phase: 'active',
						sourceSquare: 12 as Square,
						sourcePieceCode: PieceCode.WhitePawn,
						targetSquare: null,
						startButton: 0
					}
				}
			});
			const context = makeContext({ buttons: 0, targetSquare: null });

			const result = determineActionLostPointerCapture({ surface }, context);

			expect(result).toEqual({ type: 'cancelActiveInteraction' });
		});

		it('returns cancelInteraction for release-targeting when targetSquare is null', () => {
			const surface = createMockSurface({
				snapshot: {
					selected: { square: 12 as Square, pieceCode: PieceCode.WhitePawn },
					movability: { mode: MovabilityModeCode.Free },
					dragSession: {
						owner: 'core',
						type: 'release-targeting',
						sourceSquare: 12 as Square,
						sourcePieceCode: PieceCode.WhitePawn,
						targetSquare: null,
						startButton: 0
					}
				}
			});
			const context = makeContext({ buttons: 0, targetSquare: null });

			const result = determineActionLostPointerCapture({ surface }, context);

			expect(result).toEqual({ type: 'cancelInteraction' });
		});

		it('returns cancelActiveInteraction for pending lifted-piece even when target is a legal destination', () => {
			const surface = createMockSurface({
				snapshot: {
					selected: { square: 12 as Square, pieceCode: PieceCode.WhitePawn },
					movability: { mode: MovabilityModeCode.Free },
					dragSession: {
						owner: 'core',
						type: 'lifted-piece-drag',
						phase: 'pending',
						sourceSquare: 12 as Square,
						sourcePieceCode: PieceCode.WhitePawn,
						targetSquare: 28 as Square,
						startButton: 0,
						startPoint: { x: 0, y: 0 },
						thresholdPx: 4
					}
				}
			});
			const context = makeContext({ buttons: 0, targetSquare: 28 });

			const result = determineActionLostPointerCapture({ surface }, context);

			expect(result).toEqual({ type: 'cancelActiveInteraction' });
		});
	});

	describe('initiating button still pressed (defensive cancellation)', () => {
		it('returns cancelActiveInteraction when primary button is still pressed', () => {
			const surface = createMockSurface({
				snapshot: {
					selected: { square: 12 as Square, pieceCode: PieceCode.WhitePawn },
					movability: { mode: MovabilityModeCode.Free },
					dragSession: {
						owner: 'core',
						type: 'lifted-piece-drag',
						phase: 'active',
						sourceSquare: 12 as Square,
						sourcePieceCode: PieceCode.WhitePawn,
						targetSquare: 28 as Square,
						startButton: 0
					}
				}
			});
			// buttons=1 means primary button (0) is still held
			const context = makeContext({ buttons: 1, targetSquare: 28 });

			const result = determineActionLostPointerCapture({ surface }, context);

			expect(result).toEqual({ type: 'cancelActiveInteraction' });
		});

		it('returns cancelActiveInteraction when secondary button is still pressed', () => {
			const surface = createMockSurface({
				snapshot: {
					dragSession: {
						owner: 'core',
						type: 'lifted-piece-drag',
						phase: 'active',
						sourceSquare: 12 as Square,
						sourcePieceCode: PieceCode.WhitePawn,
						targetSquare: 28 as Square,
						startButton: 2
					}
				}
			});
			// buttons=2 means secondary button (2) is still held
			const context = makeContext({ buttons: 2, targetSquare: 28 });

			const result = determineActionLostPointerCapture({ surface }, context);

			expect(result).toEqual({ type: 'cancelActiveInteraction' });
		});
	});

	describe('extension-owned drag lostpointercapture', () => {
		it('returns completeExtensionDragSession when initiating button released', () => {
			const surface = createMockSurface({
				snapshot: {
					dragSession: {
						owner: 'annotations',
						type: 'ext:draw' as `ext:${string}`,
						sourceSquare: 12 as Square,
						sourcePieceCode: null,
						targetSquare: 28 as Square,
						startButton: 2
					}
				}
			});
			// buttons=0 means secondary button (2) is no longer pressed
			const context = makeContext({ buttons: 0, targetSquare: 28 });

			const result = determineActionLostPointerCapture({ surface }, context);

			expect(result).toEqual({ type: 'completeExtensionDragSession', targetSquare: 28 });
		});

		it('returns completeExtensionDragSession for extension-owned pending lifted-piece on lostpointercapture', () => {
			const surface = createMockSurface({
				snapshot: {
					dragSession: {
						owner: 'my-ext',
						type: 'lifted-piece-drag',
						phase: 'pending',
						sourceSquare: 12 as Square,
						sourcePieceCode: PieceCode.WhitePawn,
						targetSquare: 28 as Square,
						startButton: 0,
						startPoint: { x: 0, y: 0 },
						thresholdPx: 4
					}
				}
			});
			const context = makeContext({ buttons: 0, targetSquare: 28 });

			const result = determineActionLostPointerCapture({ surface }, context);

			expect(result).toEqual({ type: 'completeExtensionDragSession', targetSquare: 28 });
		});

		it('returns cancelActiveInteraction when initiating button still pressed', () => {
			const surface = createMockSurface({
				snapshot: {
					dragSession: {
						owner: 'annotations',
						type: 'ext:draw' as `ext:${string}`,
						sourceSquare: 12 as Square,
						sourcePieceCode: null,
						targetSquare: 28 as Square,
						startButton: 2
					}
				}
			});
			// buttons=2 means secondary button still held
			const context = makeContext({ buttons: 2, targetSquare: 28 });

			const result = determineActionLostPointerCapture({ surface }, context);

			expect(result).toEqual({ type: 'cancelActiveInteraction' });
		});
	});
});
