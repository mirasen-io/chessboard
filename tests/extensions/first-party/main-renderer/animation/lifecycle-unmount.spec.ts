import { describe, expect, it } from 'vitest';
import { createMainRendererAnimation } from '../../../../../src/extensions/first-party/main-renderer/animation/factory.js';
import {
	PieceCode,
	type Square,
	SQUARE_COUNT
} from '../../../../../src/state/board/types/internal.js';
import { createSvgElement } from '../../../../test-utils/dom/svg.js';
import {
	createAnimationPrepareContext,
	createAnimationUpdateContext,
	createMockAnimationRuntimeSurface
} from '../../../../test-utils/extensions/first-party/main-renderer/animation.js';
import { createTestPieceSymbolResolver } from '../../../../test-utils/extensions/first-party/main-renderer/pieces.js';

const resolver = createTestPieceSymbolResolver();

function createLayer(): SVGGElement {
	return createSvgElement('g');
}

function boardWithPiece(sq: Square, piece: PieceCode): object {
	const pieces = new Uint8Array(SQUARE_COUNT);
	pieces[sq] = piece;
	return { pieces, turn: 0, positionEpoch: 0 };
}

describe('animation unmount – cleanup', () => {
	it('removes prepared animation DOM nodes from the layer', () => {
		const { surface, submit } = createMockAnimationRuntimeSurface();
		const anim = createMainRendererAnimation(surface, resolver, () => ({ durationMs: 180 }));
		const layer = createLayer();

		// Trigger an animation via onUpdate
		const ctx = createAnimationUpdateContext({
			causes: ['state.board.move'],
			previousState: {
				board: boardWithPiece(12 as Square, PieceCode.WhitePawn),
				change: { lastMove: null, deferredUIMoveRequest: null }
			},
			currentState: {
				board: boardWithPiece(28 as Square, PieceCode.WhitePawn),
				change: {
					lastMove: { from: 12, to: 28, piece: PieceCode.WhitePawn },
					deferredUIMoveRequest: null
				}
			}
		});
		anim.onUpdate(ctx);

		// Prepare animation nodes
		const sessionId = submit.mock.results[0].value.id;
		const prepCtx = createAnimationPrepareContext({
			submittedSessions: [{ id: sessionId }]
		});
		anim.prepareAnimation(prepCtx, layer);
		expect(layer.children.length).toBeGreaterThan(0);

		// Unmount
		anim.unmount();

		expect(layer.children.length).toBe(0);
	});

	it('clears entries observably via getSuppressedSquares returning empty', () => {
		const { surface, submit, getAll } = createMockAnimationRuntimeSurface();
		const anim = createMainRendererAnimation(surface, resolver, () => ({ durationMs: 180 }));

		// Trigger animation
		const ctx = createAnimationUpdateContext({
			causes: ['state.board.move'],
			previousState: {
				board: boardWithPiece(4 as Square, PieceCode.WhiteKing),
				change: { lastMove: null, deferredUIMoveRequest: null }
			},
			currentState: {
				board: boardWithPiece(5 as Square, PieceCode.WhiteKing),
				change: {
					lastMove: { from: 4, to: 5, piece: PieceCode.WhiteKing },
					deferredUIMoveRequest: null
				}
			}
		});
		anim.onUpdate(ctx);

		const sessionId = submit.mock.results[0].value.id;

		// Before unmount: getSuppressedSquares returns non-empty
		getAll.mockReturnValue([{ id: sessionId, startTime: 0, duration: 180, status: 'submitted' }]);
		const beforeUnmount = anim.getSuppressedSquares();
		expect(beforeUnmount.size).toBeGreaterThan(0);

		// Unmount
		anim.unmount();

		// After unmount: getSuppressedSquares returns empty
		getAll.mockReturnValue([{ id: sessionId, startTime: 0, duration: 180, status: 'submitted' }]);
		const afterUnmount = anim.getSuppressedSquares();
		expect(afterUnmount.size).toBe(0);
	});

	it('does not throw when there are no entries', () => {
		const { surface } = createMockAnimationRuntimeSurface();
		const anim = createMainRendererAnimation(surface, resolver, () => ({ durationMs: 180 }));

		expect(() => anim.unmount()).not.toThrow();
	});

	it('does not throw when called multiple times', () => {
		const { surface, submit } = createMockAnimationRuntimeSurface();
		const anim = createMainRendererAnimation(surface, resolver, () => ({ durationMs: 180 }));
		const layer = createLayer();

		// Trigger and prepare
		const ctx = createAnimationUpdateContext({
			causes: ['state.board.move'],
			previousState: {
				board: boardWithPiece(0 as Square, PieceCode.WhiteRook),
				change: { lastMove: null, deferredUIMoveRequest: null }
			},
			currentState: {
				board: boardWithPiece(7 as Square, PieceCode.WhiteRook),
				change: {
					lastMove: { from: 0, to: 7, piece: PieceCode.WhiteRook },
					deferredUIMoveRequest: null
				}
			}
		});
		anim.onUpdate(ctx);
		const sessionId = submit.mock.results[0].value.id;
		anim.prepareAnimation(
			createAnimationPrepareContext({ submittedSessions: [{ id: sessionId }] }),
			layer
		);

		anim.unmount();
		expect(() => anim.unmount()).not.toThrow();
	});
});
