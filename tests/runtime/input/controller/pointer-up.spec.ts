import { describe, expect, it } from 'vitest';
import type { ScenePointerEvent } from '../../../../src/extensions/types/basic/events.js';
import { determineActionPointerUp } from '../../../../src/runtime/input/controller/pointer.js';
import { PieceCode, type Square } from '../../../../src/state/board/types/internal.js';
import { MovabilityModeCode } from '../../../../src/state/interaction/types/internal.js';
import { createEventContext, createMockSurface } from '../../../test-utils/runtime/controller.js';

function makeContext(targetSquare: number | null) {
	return createEventContext({
		rawEvent: new PointerEvent('pointerup'),
		sceneEvent: {
			type: 'pointerup',
			point: { x: 100, y: 100 },
			clampedPoint: { x: 100, y: 100 },
			boardClampedPoint: { x: 100, y: 100 },
			targetSquare
		} as ScenePointerEvent
	});
}

describe('determineActionPointerUp', () => {
	it('returns null when no active drag session', () => {
		const surface = createMockSurface();
		const context = makeContext(28);

		const result = determineActionPointerUp({ surface }, context);

		expect(result).toBeNull();
	});

	it('returns completeExtensionDrag for extension-owned drag session', () => {
		const surface = createMockSurface({
			snapshot: {
				dragSession: {
					owner: 'my-ext',
					type: 'lifted-piece-drag',
					sourceSquare: 12 as Square,
					sourcePieceCode: PieceCode.WhitePawn,
					targetSquare: 28 as Square,
					startButton: 0
				}
			}
		});
		const context = makeContext(28);

		const result = determineActionPointerUp({ surface }, context);

		expect(result).toEqual({ type: 'completeExtensionDrag', target: 28 });
	});

	it('returns cancelActiveInteraction when core drag target equals source', () => {
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
			}
		});
		const context = makeContext(12);

		const result = determineActionPointerUp({ surface }, context);

		expect(result).toEqual({ type: 'cancelActiveInteraction' });
	});

	it('returns completeCoreDragTo when core drag has valid target (free mode)', () => {
		const surface = createMockSurface({
			snapshot: {
				selected: { square: 12 as Square, pieceCode: PieceCode.WhitePawn },
				movability: { mode: MovabilityModeCode.Free },
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
		const context = makeContext(28);

		const result = determineActionPointerUp({ surface }, context);

		expect(result).toEqual({ type: 'completeCoreDragTo', target: 28 });
	});

	it('returns cancelActiveInteraction for lifted-piece-drag with invalid target', () => {
		const surface = createMockSurface({
			snapshot: {
				selected: { square: 12 as Square, pieceCode: PieceCode.WhitePawn },
				movability: { mode: MovabilityModeCode.Disabled },
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
		const context = makeContext(28);

		const result = determineActionPointerUp({ surface }, context);

		expect(result).toEqual({ type: 'cancelActiveInteraction' });
	});

	it('returns cancelInteraction for release-targeting drag with invalid target', () => {
		const surface = createMockSurface({
			snapshot: {
				selected: { square: 12 as Square, pieceCode: PieceCode.WhitePawn },
				movability: { mode: MovabilityModeCode.Disabled },
				dragSession: {
					owner: 'core',
					type: 'release-targeting',
					sourceSquare: 12 as Square,
					sourcePieceCode: PieceCode.WhitePawn,
					targetSquare: 28 as Square,
					startButton: 0
				}
			}
		});
		const context = makeContext(28);

		const result = determineActionPointerUp({ surface }, context);

		expect(result).toEqual({ type: 'cancelInteraction' });
	});

	it('returns cancelActiveInteraction for lifted-piece-drag when targetSquare is null', () => {
		const surface = createMockSurface({
			snapshot: {
				selected: { square: 12 as Square, pieceCode: PieceCode.WhitePawn },
				movability: { mode: MovabilityModeCode.Free },
				dragSession: {
					owner: 'core',
					type: 'lifted-piece-drag',
					sourceSquare: 12 as Square,
					sourcePieceCode: PieceCode.WhitePawn,
					targetSquare: null,
					startButton: 0
				}
			}
		});
		const context = makeContext(null);

		const result = determineActionPointerUp({ surface }, context);

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
		const context = makeContext(null);

		const result = determineActionPointerUp({ surface }, context);

		expect(result).toEqual({ type: 'cancelInteraction' });
	});
});
