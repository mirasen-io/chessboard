/**
 * Phase 4.3a — InteractionController tests.
 *
 * Tests the controller public API against the accepted interaction baseline.
 * Uses a mock runtime surface — no real board state needed.
 *
 * Controller public API:
 *   onPointerDown(target, point)
 *   onPointerMove(target, point)
 *   onPointerUp(target)
 *   onPointerCancel()
 *
 * Two interaction modes:
 *   Lifted-piece mode (dragSession !== null)
 *   Release-targeting mode (releaseTargetingActive === true)
 */

import { describe, expect, it, vi } from 'vitest';
import {
	createInteractionController,
	type InteractionRuntimeSurface
} from '../../../src/core/input/interactionController';
import type { InteractionSnapshot } from '../../../src/core/runtime/boardRuntime';
import type { BoardStateSnapshot, Move, Piece, Square } from '../../../src/core/state/boardTypes';
import { encodePiece } from '../../../src/core/state/encode';

// ── Helpers ────────────────────────────────────────────────────────────────────

function sq(n: number): Square {
	return n as Square;
}

function makePiece(
	color: 'white' | 'black',
	role: 'pawn' | 'knight' | 'bishop' | 'rook' | 'queen' | 'king' = 'pawn'
): Piece {
	return { color, role };
}

function makeMove(from: number, to: number): Move {
	return { from: sq(from), to: sq(to), moved: makePiece('white') };
}

/**
 * Create a mock board snapshot with specified pieces.
 */
function makeBoardSnapshot(pieces: Partial<Record<Square, Piece>> = {}): BoardStateSnapshot {
	const encoded = new Uint8Array(64);
	const ids = new Int16Array(64);

	// Encode pieces into the snapshot using proper encoding
	for (const [sqStr, piece] of Object.entries(pieces)) {
		const sqNum = parseInt(sqStr) as Square;
		encoded[sqNum] = encodePiece(piece);
		ids[sqNum] = sqNum + 1; // Simple id assignment
	}

	return {
		pieces: encoded,
		ids,
		turn: 'white',
		positionEpoch: 0
	};
}

/**
 * Create a mock interaction snapshot.
 */
function makeInteractionSnapshot(
	opts: {
		selectedSquare?: Square | null;
		dragSession?: { fromSquare: Square } | null;
		releaseTargetingActive?: boolean;
	} = {}
): InteractionSnapshot {
	return {
		board: {},
		view: {},
		interaction: {
			selectedSquare: opts.selectedSquare ?? null,
			destinations: null,
			currentTarget: null,
			dragSession: opts.dragSession ?? null,
			releaseTargetingActive: opts.releaseTargetingActive ?? false
		}
	};
}

/**
 * Create a mock runtime surface with customizable behavior.
 */
function createMockRuntime(
	opts: {
		boardSnapshot?: BoardStateSnapshot;
		interactionSnapshot?: InteractionSnapshot;
		isMoveAttemptAllowed?: (from: Square, to: Square) => boolean;
	} = {}
): InteractionRuntimeSurface {
	const boardSnapshot = opts.boardSnapshot ?? makeBoardSnapshot();
	const interactionSnapshot = opts.interactionSnapshot ?? makeInteractionSnapshot();

	return {
		getBoardSnapshot: vi.fn(() => boardSnapshot),
		getInteractionSnapshot: vi.fn(() => interactionSnapshot),
		canStartMoveFrom: vi.fn(() => true),
		isMoveAttemptAllowed: vi.fn(opts.isMoveAttemptAllowed ?? (() => false)),
		notifyDragMove: vi.fn(),
		notifyReleaseTargetingMove: vi.fn(),
		select: vi.fn(() => true),
		beginSourceInteraction: vi.fn(() => true),
		startReleaseTargeting: vi.fn(() => true),
		commitTo: vi.fn(() => null),
		cancelInteraction: vi.fn(() => true)
	};
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('InteractionController', () => {
	// ── onPointerDown — Path A: no existing selection ──────────────────────────

	describe('onPointerDown() — Path A: no existing selection', () => {
		it('A1: empty square → no-op', () => {
			const runtime = createMockRuntime({
				boardSnapshot: makeBoardSnapshot(), // all empty
				interactionSnapshot: makeInteractionSnapshot()
			});
			const controller = createInteractionController(runtime);

			controller.onPointerDown(sq(12), { x: 450, y: 650 });

			expect(runtime.beginSourceInteraction).not.toHaveBeenCalled();
			expect(runtime.startReleaseTargeting).not.toHaveBeenCalled();
		});

		it('A2: occupied square → beginSourceInteraction', () => {
			const runtime = createMockRuntime({
				boardSnapshot: makeBoardSnapshot({ [sq(12)]: makePiece('white') }),
				interactionSnapshot: makeInteractionSnapshot()
			});
			const controller = createInteractionController(runtime);

			controller.onPointerDown(sq(12), { x: 450, y: 650 });

			expect(runtime.beginSourceInteraction).toHaveBeenCalledWith(sq(12), { x: 450, y: 650 });
			expect(runtime.beginSourceInteraction).toHaveBeenCalledTimes(1);
		});

		it('off-board (null target) → no-op', () => {
			const runtime = createMockRuntime();
			const controller = createInteractionController(runtime);

			controller.onPointerDown(null, { x: 450, y: 650 });

			expect(runtime.beginSourceInteraction).not.toHaveBeenCalled();
			expect(runtime.startReleaseTargeting).not.toHaveBeenCalled();
		});
	});

	// ── onPointerDown — Branch B: existing selection, no active mode ───────────

	describe('onPointerDown() — Branch B: existing selection, no active mode', () => {
		it('B1: pressed selected square → beginSourceInteraction (re-enter)', () => {
			const runtime = createMockRuntime({
				boardSnapshot: makeBoardSnapshot({ [sq(12)]: makePiece('white') }),
				interactionSnapshot: makeInteractionSnapshot({ selectedSquare: sq(12) })
			});
			const controller = createInteractionController(runtime);

			controller.onPointerDown(sq(12), { x: 450, y: 650 });

			expect(runtime.beginSourceInteraction).toHaveBeenCalledWith(sq(12), { x: 450, y: 650 });
			expect(runtime.beginSourceInteraction).toHaveBeenCalledTimes(1);
		});

		it('B2: pressed empty square → startReleaseTargeting', () => {
			const runtime = createMockRuntime({
				boardSnapshot: makeBoardSnapshot({ [sq(12)]: makePiece('white') }),
				interactionSnapshot: makeInteractionSnapshot({ selectedSquare: sq(12) })
			});
			const controller = createInteractionController(runtime);

			controller.onPointerDown(sq(28), { x: 450, y: 650 });

			expect(runtime.startReleaseTargeting).toHaveBeenCalledWith(sq(28), { x: 450, y: 650 });
			expect(runtime.startReleaseTargeting).toHaveBeenCalledTimes(1);
			expect(runtime.beginSourceInteraction).not.toHaveBeenCalled();
		});

		it('B3: pressed same-color occupied square → beginSourceInteraction (reselect)', () => {
			const runtime = createMockRuntime({
				boardSnapshot: makeBoardSnapshot({
					[sq(12)]: makePiece('white'),
					[sq(20)]: makePiece('white')
				}),
				interactionSnapshot: makeInteractionSnapshot({ selectedSquare: sq(12) })
			});
			const controller = createInteractionController(runtime);

			controller.onPointerDown(sq(20), { x: 450, y: 650 });

			expect(runtime.beginSourceInteraction).toHaveBeenCalledWith(sq(20), { x: 450, y: 650 });
			expect(runtime.beginSourceInteraction).toHaveBeenCalledTimes(1);
		});

		it('B4.1: pressed opposite-color legal target → startReleaseTargeting', () => {
			const runtime = createMockRuntime({
				boardSnapshot: makeBoardSnapshot({
					[sq(12)]: makePiece('white'),
					[sq(28)]: makePiece('black')
				}),
				interactionSnapshot: makeInteractionSnapshot({ selectedSquare: sq(12) }),
				isMoveAttemptAllowed: (from, to) => from === sq(12) && to === sq(28)
			});
			const controller = createInteractionController(runtime);

			controller.onPointerDown(sq(28), { x: 450, y: 650 });

			expect(runtime.isMoveAttemptAllowed).toHaveBeenCalledWith(sq(12), sq(28));
			expect(runtime.startReleaseTargeting).toHaveBeenCalledWith(sq(28), { x: 450, y: 650 });
			expect(runtime.startReleaseTargeting).toHaveBeenCalledTimes(1);
			expect(runtime.beginSourceInteraction).not.toHaveBeenCalled();
		});

		it('B4.2: pressed opposite-color illegal target → beginSourceInteraction (reselect)', () => {
			const runtime = createMockRuntime({
				boardSnapshot: makeBoardSnapshot({
					[sq(12)]: makePiece('white'),
					[sq(36)]: makePiece('black')
				}),
				interactionSnapshot: makeInteractionSnapshot({ selectedSquare: sq(12) }),
				isMoveAttemptAllowed: () => false
			});
			const controller = createInteractionController(runtime);

			controller.onPointerDown(sq(36), { x: 450, y: 650 });

			expect(runtime.isMoveAttemptAllowed).toHaveBeenCalledWith(sq(12), sq(36));
			expect(runtime.beginSourceInteraction).toHaveBeenCalledWith(sq(36), { x: 450, y: 650 });
			expect(runtime.beginSourceInteraction).toHaveBeenCalledTimes(1);
			expect(runtime.startReleaseTargeting).not.toHaveBeenCalled();
		});
	});

	// ── onPointerDown — Path C: active mode already in progress ────────────────

	describe('onPointerDown() — Path C: active mode in progress (defensive)', () => {
		it('C1: drag active → no-op', () => {
			const runtime = createMockRuntime({
				boardSnapshot: makeBoardSnapshot({ [sq(12)]: makePiece('white') }),
				interactionSnapshot: makeInteractionSnapshot({
					selectedSquare: sq(12),
					dragSession: { fromSquare: sq(12) }
				})
			});
			const controller = createInteractionController(runtime);

			controller.onPointerDown(sq(20), { x: 450, y: 650 });

			expect(runtime.beginSourceInteraction).not.toHaveBeenCalled();
			expect(runtime.startReleaseTargeting).not.toHaveBeenCalled();
		});

		it('C2: release-targeting active → no-op', () => {
			const runtime = createMockRuntime({
				boardSnapshot: makeBoardSnapshot({ [sq(12)]: makePiece('white') }),
				interactionSnapshot: makeInteractionSnapshot({
					selectedSquare: sq(12),
					releaseTargetingActive: true
				})
			});
			const controller = createInteractionController(runtime);

			controller.onPointerDown(sq(28), { x: 450, y: 650 });

			expect(runtime.beginSourceInteraction).not.toHaveBeenCalled();
			expect(runtime.startReleaseTargeting).not.toHaveBeenCalled();
		});
	});

	// ── onPointerMove ──────────────────────────────────────────────────────────

	describe('onPointerMove()', () => {
		it('no active targeting → no-op', () => {
			const runtime = createMockRuntime({
				interactionSnapshot: makeInteractionSnapshot()
			});
			const controller = createInteractionController(runtime);

			controller.onPointerMove(sq(28), { x: 150, y: 250 });

			expect(runtime.notifyDragMove).not.toHaveBeenCalled();
			expect(runtime.notifyReleaseTargetingMove).not.toHaveBeenCalled();
		});

		it('drag active → notifyDragMove', () => {
			const runtime = createMockRuntime({
				interactionSnapshot: makeInteractionSnapshot({
					selectedSquare: sq(12),
					dragSession: { fromSquare: sq(12) }
				})
			});
			const controller = createInteractionController(runtime);

			controller.onPointerMove(sq(28), { x: 150, y: 250 });

			expect(runtime.notifyDragMove).toHaveBeenCalledWith(sq(28), { x: 150, y: 250 });
			expect(runtime.notifyDragMove).toHaveBeenCalledTimes(1);
			expect(runtime.notifyReleaseTargetingMove).not.toHaveBeenCalled();
		});

		it('release-targeting active → notifyReleaseTargetingMove', () => {
			const runtime = createMockRuntime({
				interactionSnapshot: makeInteractionSnapshot({
					selectedSquare: sq(12),
					releaseTargetingActive: true
				})
			});
			const controller = createInteractionController(runtime);

			controller.onPointerMove(sq(28), { x: 150, y: 250 });

			expect(runtime.notifyReleaseTargetingMove).toHaveBeenCalledWith(sq(28), { x: 150, y: 250 });
			expect(runtime.notifyReleaseTargetingMove).toHaveBeenCalledTimes(1);
			expect(runtime.notifyDragMove).not.toHaveBeenCalled();
		});

		it('drag active with null target → notifyDragMove with null', () => {
			const runtime = createMockRuntime({
				interactionSnapshot: makeInteractionSnapshot({
					selectedSquare: sq(12),
					dragSession: { fromSquare: sq(12) }
				})
			});
			const controller = createInteractionController(runtime);

			controller.onPointerMove(null, null);

			expect(runtime.notifyDragMove).toHaveBeenCalledWith(null, null);
		});
	});

	// ── onPointerUp ────────────────────────────────────────────────────────────

	describe('onPointerUp()', () => {
		it('active targeting exists → commitTo called, returns result', () => {
			const move = makeMove(12, 28);
			const runtime = createMockRuntime({
				interactionSnapshot: makeInteractionSnapshot({
					selectedSquare: sq(12),
					dragSession: { fromSquare: sq(12) }
				})
			});
			runtime.commitTo = vi.fn(() => move);
			const controller = createInteractionController(runtime);

			const result = controller.onPointerUp(sq(28));

			expect(runtime.commitTo).toHaveBeenCalledWith(sq(28));
			expect(runtime.commitTo).toHaveBeenCalledTimes(1);
			expect(result).toBe(move);
		});

		it('active targeting exists → commitTo returns null on illegal completion', () => {
			const runtime = createMockRuntime({
				interactionSnapshot: makeInteractionSnapshot({
					selectedSquare: sq(12),
					dragSession: { fromSquare: sq(12) }
				})
			});
			runtime.commitTo = vi.fn(() => null);
			const controller = createInteractionController(runtime);

			const result = controller.onPointerUp(sq(36));

			expect(runtime.commitTo).toHaveBeenCalledWith(sq(36));
			expect(result).toBeNull();
		});

		it('no active targeting → returns null without calling commitTo', () => {
			const runtime = createMockRuntime({
				interactionSnapshot: makeInteractionSnapshot()
			});
			const controller = createInteractionController(runtime);

			const result = controller.onPointerUp(sq(28));

			expect(runtime.commitTo).not.toHaveBeenCalled();
			expect(result).toBeNull();
		});

		it('release-targeting active → commitTo called', () => {
			const move = makeMove(12, 28);
			const runtime = createMockRuntime({
				interactionSnapshot: makeInteractionSnapshot({
					selectedSquare: sq(12),
					releaseTargetingActive: true
				})
			});
			runtime.commitTo = vi.fn(() => move);
			const controller = createInteractionController(runtime);

			const result = controller.onPointerUp(sq(28));

			expect(runtime.commitTo).toHaveBeenCalledWith(sq(28));
			expect(result).toBe(move);
		});

		it('off-board release during drag → commitTo called with null', () => {
			const runtime = createMockRuntime({
				interactionSnapshot: makeInteractionSnapshot({
					selectedSquare: sq(12),
					dragSession: { fromSquare: sq(12) }
				})
			});
			runtime.commitTo = vi.fn(() => null);
			const controller = createInteractionController(runtime);

			const result = controller.onPointerUp(null);

			expect(runtime.commitTo).toHaveBeenCalledWith(null);
			expect(result).toBeNull();
		});
	});

	// ── onPointerCancel ────────────────────────────────────────────────────────

	describe('onPointerCancel()', () => {
		it('routes to cancelInteraction', () => {
			const runtime = createMockRuntime();
			const controller = createInteractionController(runtime);

			controller.onPointerCancel();

			expect(runtime.cancelInteraction).toHaveBeenCalledTimes(1);
		});
	});

	// ── Full lifecycle flows ───────────────────────────────────────────────────

	describe('full lifecycle flows', () => {
		it('lifted-piece flow: pointerdown → pointermove → pointerup (legal)', () => {
			const move = makeMove(12, 28);
			const boardSnapshot = makeBoardSnapshot({ [sq(12)]: makePiece('white') });

			// Mock getInteractionSnapshot to return evolving state
			let callCount = 0;
			const runtime = createMockRuntime({ boardSnapshot });
			runtime.getInteractionSnapshot = vi.fn(() => {
				callCount++;
				if (callCount === 1) {
					// First call (in onPointerDown): no active mode yet
					return makeInteractionSnapshot();
				}
				// Subsequent calls: drag session is active
				return makeInteractionSnapshot({
					selectedSquare: sq(12),
					dragSession: { fromSquare: sq(12) }
				});
			});
			runtime.commitTo = vi.fn(() => move);
			const controller = createInteractionController(runtime);

			controller.onPointerDown(sq(12), { x: 450, y: 650 });
			controller.onPointerMove(sq(20), { x: 100, y: 200 });
			controller.onPointerMove(sq(28), { x: 150, y: 250 });
			const result = controller.onPointerUp(sq(28));

			expect(runtime.beginSourceInteraction).toHaveBeenCalledWith(sq(12), { x: 450, y: 650 });
			expect(runtime.notifyDragMove).toHaveBeenCalledWith(sq(20), { x: 100, y: 200 });
			expect(runtime.notifyDragMove).toHaveBeenCalledWith(sq(28), { x: 150, y: 250 });
			expect(runtime.commitTo).toHaveBeenCalledWith(sq(28));
			expect(result).toBe(move);
		});

		it('release-targeting flow: pointerdown → pointermove → pointerup (legal)', () => {
			const move = makeMove(12, 28);
			const boardSnapshot = makeBoardSnapshot({ [sq(12)]: makePiece('white') });

			// Mock getInteractionSnapshot to return evolving state
			let callCount = 0;
			const runtime = createMockRuntime({ boardSnapshot });
			runtime.getInteractionSnapshot = vi.fn(() => {
				callCount++;
				if (callCount === 1) {
					// First call (in onPointerDown): selection exists, no active mode yet
					return makeInteractionSnapshot({ selectedSquare: sq(12) });
				}
				// Subsequent calls: release-targeting is active
				return makeInteractionSnapshot({
					selectedSquare: sq(12),
					releaseTargetingActive: true
				});
			});
			runtime.commitTo = vi.fn(() => move);
			const controller = createInteractionController(runtime);

			controller.onPointerDown(sq(28), { x: 450, y: 650 });
			controller.onPointerMove(sq(28), { x: 150, y: 250 });
			const result = controller.onPointerUp(sq(28));

			expect(runtime.startReleaseTargeting).toHaveBeenCalledWith(sq(28), { x: 450, y: 650 });
			expect(runtime.notifyReleaseTargetingMove).toHaveBeenCalledWith(sq(28), { x: 150, y: 250 });
			expect(runtime.commitTo).toHaveBeenCalledWith(sq(28));
			expect(result).toBe(move);
		});

		it('cancel flow: pointerdown → pointercancel', () => {
			const runtime = createMockRuntime({
				boardSnapshot: makeBoardSnapshot({ [sq(12)]: makePiece('white') }),
				interactionSnapshot: makeInteractionSnapshot()
			});
			const controller = createInteractionController(runtime);

			controller.onPointerDown(sq(12), { x: 450, y: 650 });
			controller.onPointerCancel();

			expect(runtime.beginSourceInteraction).toHaveBeenCalledWith(sq(12), { x: 450, y: 650 });
			expect(runtime.cancelInteraction).toHaveBeenCalledTimes(1);
		});
	});
});
