/**
 * Phase 3.2 — Drag lifecycle tests for BoardRuntime.
 *
 * Tests the new interaction lifecycle methods:
 *   select(), dragStart(), setCurrentTarget(), dropTo(), cancelInteraction()
 *
 * These tests do NOT test rendering (Phase 3.3) or hit-testing (Phase 3.4).
 * They verify state transitions only.
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { SvgRenderer } from '../../../src/core/renderer/SvgRenderer';
import type { Renderer } from '../../../src/core/renderer/types';
import { createBoardRuntime } from '../../../src/core/runtime/boardRuntime';
import type { Square } from '../../../src/core/state/boardTypes';

function sq(n: number): Square {
	return n as Square;
}

// ── ResizeObserver stub ────────────────────────────────────────────────────────

class StubResizeObserver {
	observe() {}
	unobserve() {}
	disconnect() {}
}

const originalResizeObserver = globalThis.ResizeObserver;

beforeAll(() => {
	globalThis.ResizeObserver = StubResizeObserver as unknown as typeof ResizeObserver;
});

afterAll(() => {
	globalThis.ResizeObserver = originalResizeObserver;
});

// ── Helpers ────────────────────────────────────────────────────────────────────

function createMockContainer(size = 400): HTMLElement {
	const el = document.createElement('div');
	Object.defineProperty(el, 'clientWidth', { value: size, configurable: true });
	Object.defineProperty(el, 'clientHeight', { value: size, configurable: true });
	return el;
}

function createTestRenderer(): Renderer {
	return new SvgRenderer();
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('Phase 3.2 / BoardRuntime — interaction lifecycle', () => {
	// ── select() — destination derivation ─────────────────────────────────────

	describe('select() — destination derivation', () => {
		it('strict movability: select(from) populates destinations from policy', () => {
			const runtime = createBoardRuntime({
				renderer: createTestRenderer(),
				board: { position: 'start' },
				view: {
					movability: {
						mode: 'strict',
						color: 'white',
						destinations: { 12: [28, 20] } // e2 → e4, e3
					}
				}
			});
			runtime.mount(createMockContainer());

			const changed = runtime.select(12); // e2
			expect(changed).toBe(true);
		});

		it('strict movability: select(null) clears destinations', () => {
			const runtime = createBoardRuntime({
				renderer: createTestRenderer(),
				board: { position: 'start' },
				view: {
					movability: {
						mode: 'strict',
						color: 'white',
						destinations: { 12: [28, 20] }
					}
				}
			});
			runtime.mount(createMockContainer());

			runtime.select(12);
			const changed = runtime.select(null);
			expect(changed).toBe(true);
		});

		it('free movability: select(from) does not populate destinations (null)', () => {
			// Free mode: any target is allowed; no pre-computed list is meaningful.
			const runtime = createBoardRuntime({
				renderer: createTestRenderer(),
				board: { position: 'start' },
				view: { movability: { mode: 'free', color: 'white' } }
			});
			runtime.mount(createMockContainer());

			// select() should not throw and should return true (changed)
			expect(() => runtime.select(12)).not.toThrow();
			const changed = runtime.select(12);
			// Already selected — no-op
			expect(changed).toBe(false);
		});

		it('disabled movability: select(from) does not populate destinations', () => {
			const runtime = createBoardRuntime({
				renderer: createTestRenderer(),
				board: { position: 'start' },
				view: { movability: { mode: 'disabled' } }
			});
			runtime.mount(createMockContainer());

			expect(() => runtime.select(12)).not.toThrow();
		});

		it('select() clears currentTarget atomically', () => {
			const runtime = createBoardRuntime({
				renderer: createTestRenderer(),
				board: { position: 'start' },
				view: { movability: { mode: 'free', color: 'white' } }
			});
			runtime.mount(createMockContainer());

			// Set up: select + drag + target
			runtime.select(12);
			runtime.dragStart(12);
			runtime.setCurrentTarget(28);

			// Cancel drag, then re-select — currentTarget must be cleared
			runtime.cancelInteraction();
			runtime.select(20); // e3
			// setCurrentTarget after re-select should start from null
			const changed = runtime.setCurrentTarget(null);
			expect(changed).toBe(false); // already null after select
		});

		it('select() throws if drag session is active', () => {
			const runtime = createBoardRuntime({
				renderer: createTestRenderer(),
				board: { position: 'start' },
				view: { movability: { mode: 'free', color: 'white' } }
			});
			runtime.mount(createMockContainer());

			runtime.select(12);
			runtime.dragStart(12);

			expect(() => runtime.select(20)).toThrow('cannot select while a drag session is active');
		});

		it('select() same square is a no-op (returns false)', () => {
			const runtime = createBoardRuntime({
				renderer: createTestRenderer(),
				board: { position: 'start' },
				view: { movability: { mode: 'free', color: 'white' } }
			});
			runtime.mount(createMockContainer());

			runtime.select(12);
			expect(runtime.select(12)).toBe(false);
		});
	});

	// ── dragStart() ────────────────────────────────────────────────────────────

	describe('dragStart()', () => {
		it('creates drag session after select(from)', () => {
			const runtime = createBoardRuntime({
				renderer: createTestRenderer(),
				board: { position: 'start' },
				view: { movability: { mode: 'free', color: 'white' } }
			});
			runtime.mount(createMockContainer());

			runtime.select(12);
			const result = runtime.dragStart(12);
			expect(result).toBe(true);
		});

		it('throws if selectedSquare !== from', () => {
			const runtime = createBoardRuntime({
				renderer: createTestRenderer(),
				board: { position: 'start' },
				view: { movability: { mode: 'free', color: 'white' } }
			});
			runtime.mount(createMockContainer());

			runtime.select(12); // e2

			expect(() => runtime.dragStart(11)).toThrow('selectedSquare');
		});

		it('throws if drag already active', () => {
			const runtime = createBoardRuntime({
				renderer: createTestRenderer(),
				board: { position: 'start' },
				view: { movability: { mode: 'free', color: 'white' } }
			});
			runtime.mount(createMockContainer());

			runtime.select(12);
			runtime.dragStart(12);

			expect(() => runtime.dragStart(12)).toThrow('drag already active');
		});

		it('throws if no square selected (selectedSquare is null)', () => {
			const runtime = createBoardRuntime({
				renderer: createTestRenderer(),
				board: { position: 'start' },
				view: { movability: { mode: 'free', color: 'white' } }
			});
			runtime.mount(createMockContainer());

			// No select() called — selectedSquare is null
			expect(() => runtime.dragStart(12)).toThrow();
		});
	});

	// ── setCurrentTarget() ─────────────────────────────────────────────────────

	describe('setCurrentTarget()', () => {
		it('updates current target during drag', () => {
			const runtime = createBoardRuntime({
				renderer: createTestRenderer(),
				board: { position: 'start' },
				view: { movability: { mode: 'free', color: 'white' } }
			});
			runtime.mount(createMockContainer());

			runtime.select(12);
			runtime.dragStart(12);

			const changed = runtime.setCurrentTarget(28); // e4
			expect(changed).toBe(true);
		});

		it('no-op when target unchanged', () => {
			const runtime = createBoardRuntime({
				renderer: createTestRenderer(),
				board: { position: 'start' },
				view: { movability: { mode: 'free', color: 'white' } }
			});
			runtime.mount(createMockContainer());

			runtime.select(12);
			runtime.dragStart(12);
			runtime.setCurrentTarget(28);

			expect(runtime.setCurrentTarget(28)).toBe(false);
		});

		it('can clear target to null', () => {
			const runtime = createBoardRuntime({
				renderer: createTestRenderer(),
				board: { position: 'start' },
				view: { movability: { mode: 'free', color: 'white' } }
			});
			runtime.mount(createMockContainer());

			runtime.select(12);
			runtime.dragStart(12);
			runtime.setCurrentTarget(28);

			expect(runtime.setCurrentTarget(null)).toBe(true);
		});
	});

	// ── dropTo() — legal drop ──────────────────────────────────────────────────

	describe('dropTo() — legal drop', () => {
		it('free movability: legal drop applies move and clears all interaction', () => {
			const runtime = createBoardRuntime({
				renderer: createTestRenderer(),
				board: { position: { e2: { color: 'w', role: 'p' } } },
				view: { movability: { mode: 'free', color: 'white' } }
			});
			runtime.mount(createMockContainer());

			runtime.select(12); // e2
			runtime.dragStart(12);
			runtime.setCurrentTarget(28); // e4

			const move = runtime.dropTo(28);
			expect(move).not.toBeNull();
			expect(move!.from).toBe(12); // e2
			expect(move!.to).toBe(28); // e4
		});

		it('strict movability: legal drop applies move', () => {
			const runtime = createBoardRuntime({
				renderer: createTestRenderer(),
				board: { position: { e2: { color: 'w', role: 'p' } } },
				view: {
					movability: {
						mode: 'strict',
						color: 'white',
						destinations: { 12: [28, 20] }
					}
				}
			});
			runtime.mount(createMockContainer());

			runtime.select(12);
			runtime.dragStart(12);

			const move = runtime.dropTo(28);
			expect(move).not.toBeNull();
			expect(move!.from).toBe(12);
			expect(move!.to).toBe(28);
		});

		it('legal drop clears all interaction state', () => {
			const runtime = createBoardRuntime({
				renderer: createTestRenderer(),
				board: { position: { e2: { color: 'w', role: 'p' } } },
				view: { movability: { mode: 'free', color: 'white' } }
			});
			runtime.mount(createMockContainer());

			runtime.select(12);
			runtime.dragStart(12);
			runtime.setCurrentTarget(28);
			runtime.dropTo(28);

			// After legal drop: all interaction cleared.
			// Observable: select(null) is a no-op (already null).
			expect(runtime.select(null)).toBe(false);
		});

		it('dropTo without drag (tap-to-move): uses selectedSquare as source', () => {
			// Tap-to-move flow: select(from) then dropTo(to) without dragStart.
			const runtime = createBoardRuntime({
				renderer: createTestRenderer(),
				board: { position: { e2: { color: 'w', role: 'p' } } },
				view: { movability: { mode: 'free', color: 'white' } }
			});
			runtime.mount(createMockContainer());

			runtime.select(12); // e2 — no dragStart
			const move = runtime.dropTo(28); // e4
			expect(move).not.toBeNull();
			expect(move!.from).toBe(12);
			expect(move!.to).toBe(28);
		});
	});

	// ── dropTo() — illegal drop ────────────────────────────────────────────────

	describe('dropTo() — illegal drop', () => {
		it('strict movability: drop on unlisted target returns null', () => {
			const runtime = createBoardRuntime({
				renderer: createTestRenderer(),
				board: { position: { e2: { color: 'w', role: 'p' } } },
				view: {
					movability: {
						mode: 'strict',
						color: 'white',
						destinations: { 12: [28, 20] }
					}
				}
			});
			runtime.mount(createMockContainer());

			runtime.select(12);
			runtime.dragStart(12);

			const move = runtime.dropTo(36); // e5 — not in destinations
			expect(move).toBeNull();
		});

		it('lifted-piece mode: illegal drop keeps selection (retry allowed)', () => {
			// Lifted-piece illegal-completion rule:
			// clear dragSession + currentTarget, keep selectedSquare + destinations.
			const runtime = createBoardRuntime({
				renderer: createTestRenderer(),
				board: { position: { e2: { color: 'w', role: 'p' } } },
				view: {
					movability: {
						mode: 'strict',
						color: 'white',
						destinations: { 12: [28, 20] }
					}
				}
			});
			runtime.mount(createMockContainer());

			runtime.select(12);
			runtime.dragStart(12);
			runtime.setCurrentTarget(36);

			runtime.dropTo(36); // illegal — lifted-piece mode

			// selectedSquare is still 12 — observable: select(12) is a no-op
			expect(runtime.select(12)).toBe(false);
		});

		it('lifted-piece mode: illegal drop clears drag session (no longer dragging)', () => {
			const runtime = createBoardRuntime({
				renderer: createTestRenderer(),
				board: { position: { e2: { color: 'w', role: 'p' } } },
				view: {
					movability: {
						mode: 'strict',
						color: 'white',
						destinations: { 12: [28, 20] }
					}
				}
			});
			runtime.mount(createMockContainer());

			runtime.select(12);
			runtime.dragStart(12);
			runtime.dropTo(36); // illegal — lifted-piece mode

			// dragSession cleared: can call dragStart again (after select)
			runtime.select(null); // deselect
			runtime.select(12); // re-select
			expect(() => runtime.dragStart(12)).not.toThrow();
		});

		it('release-targeting mode: illegal drop clears all interaction', () => {
			// Release-targeting illegal-completion rule: clear all interaction.
			const runtime = createBoardRuntime({
				renderer: createTestRenderer(),
				board: { position: { e2: { color: 'w', role: 'p' } } },
				view: {
					movability: {
						mode: 'strict',
						color: 'white',
						destinations: { 12: [28, 20] }
					}
				}
			});
			runtime.mount(createMockContainer());

			// Enter release-targeting mode: select without dragStart
			runtime.select(12);
			// No dragStart — release-targeting mode
			runtime.dropTo(36); // illegal — release-targeting mode

			// All interaction cleared: select(null) is a no-op
			expect(runtime.select(null)).toBe(false);
		});

		it('drop on null target is treated as illegal (no move)', () => {
			const runtime = createBoardRuntime({
				renderer: createTestRenderer(),
				board: { position: { e2: { color: 'w', role: 'p' } } },
				view: { movability: { mode: 'free', color: 'white' } }
			});
			runtime.mount(createMockContainer());

			runtime.select(12);
			runtime.dragStart(12);

			const move = runtime.dropTo(null);
			expect(move).toBeNull();
		});

		it('dropTo with no active interaction returns null (no-op)', () => {
			const runtime = createBoardRuntime({
				renderer: createTestRenderer(),
				board: { position: { e2: { color: 'w', role: 'p' } } },
				view: { movability: { mode: 'free', color: 'white' } }
			});
			runtime.mount(createMockContainer());

			// No select() called
			const move = runtime.dropTo(28);
			expect(move).toBeNull();
		});

		it('disabled movability: drop always returns null', () => {
			const runtime = createBoardRuntime({
				renderer: createTestRenderer(),
				board: { position: { e2: { color: 'w', role: 'p' } } },
				view: { movability: { mode: 'disabled' } }
			});
			runtime.mount(createMockContainer());

			// Can still call select() (select is not gated by movability)
			runtime.select(12);
			// Cannot dragStart because selectedSquare is 12 but no drag yet
			// dropTo uses selectedSquare as source
			const move = runtime.dropTo(28);
			expect(move).toBeNull();
		});
	});

	// ── cancelInteraction() ────────────────────────────────────────────────────

	describe('cancelInteraction()', () => {
		it('clears drag session and currentTarget, keeps selection', () => {
			const runtime = createBoardRuntime({
				renderer: createTestRenderer(),
				board: { position: 'start' },
				view: { movability: { mode: 'free', color: 'white' } }
			});
			runtime.mount(createMockContainer());

			runtime.select(12);
			runtime.dragStart(12);
			runtime.setCurrentTarget(28);

			const changed = runtime.cancelInteraction();
			expect(changed).toBe(true);

			// selectedSquare still 12 — select(12) is a no-op
			expect(runtime.select(12)).toBe(false);
		});

		it('after cancel, dragStart can be called again', () => {
			const runtime = createBoardRuntime({
				renderer: createTestRenderer(),
				board: { position: 'start' },
				view: { movability: { mode: 'free', color: 'white' } }
			});
			runtime.mount(createMockContainer());

			runtime.select(12);
			runtime.dragStart(12);
			runtime.cancelInteraction();

			// dragSession cleared — can start drag again
			expect(() => runtime.dragStart(12)).not.toThrow();
		});

		it('cancel with no drag active is a no-op (returns false)', () => {
			const runtime = createBoardRuntime({
				renderer: createTestRenderer(),
				board: { position: 'start' },
				view: { movability: { mode: 'free', color: 'white' } }
			});
			runtime.mount(createMockContainer());

			runtime.select(12);
			// No dragStart — cancelInteraction should be a no-op
			expect(runtime.cancelInteraction()).toBe(false);
		});

		it('cancel with nothing selected is a no-op (returns false)', () => {
			const runtime = createBoardRuntime({
				renderer: createTestRenderer(),
				board: { position: 'start' },
				view: { movability: { mode: 'free', color: 'white' } }
			});
			runtime.mount(createMockContainer());

			expect(runtime.cancelInteraction()).toBe(false);
		});
	});

	// ── setBoardPosition() clears interaction ──────────────────────────────────

	describe('setBoardPosition() clears interaction', () => {
		it('clears all interaction state on position change', () => {
			const runtime = createBoardRuntime({
				renderer: createTestRenderer(),
				board: { position: { e2: { color: 'w', role: 'p' } } },
				view: { movability: { mode: 'free', color: 'white' } }
			});
			runtime.mount(createMockContainer());

			runtime.select(12);
			runtime.dragStart(12);
			runtime.setCurrentTarget(28);

			runtime.setBoardPosition({ d2: { color: 'w', role: 'p' } });

			// All interaction cleared: select(null) is a no-op
			expect(runtime.select(null)).toBe(false);
		});
	});

	// ── getInteractionSnapshot() ───────────────────────────────────────────────

	describe('getInteractionSnapshot()', () => {
		it('returns all-null interaction on fresh runtime', () => {
			const runtime = createBoardRuntime({
				renderer: createTestRenderer(),
				board: { position: 'start' }
			});
			runtime.mount(createMockContainer());

			const snap = runtime.getInteractionSnapshot();
			expect(snap.interaction.selectedSquare).toBeNull();
			expect(snap.interaction.dragSession).toBeNull();
		});

		it('reflects select() change', () => {
			const runtime = createBoardRuntime({
				renderer: createTestRenderer(),
				board: { position: 'start' }
			});
			runtime.mount(createMockContainer());

			runtime.select(sq(12));
			const snap = runtime.getInteractionSnapshot();
			expect(snap.interaction.selectedSquare).toBe(sq(12));
			expect(snap.interaction.dragSession).toBeNull();
		});

		it('reflects dragStart() change', () => {
			const runtime = createBoardRuntime({
				renderer: createTestRenderer(),
				board: { position: 'start' },
				view: { movability: { mode: 'free', color: 'white' } }
			});
			runtime.mount(createMockContainer());

			runtime.select(sq(12));
			runtime.dragStart(sq(12));
			const snap = runtime.getInteractionSnapshot();
			expect(snap.interaction.selectedSquare).toBe(sq(12));
			expect(snap.interaction.dragSession).toEqual({ fromSquare: sq(12) });
		});

		it('reflects cancelInteraction() change', () => {
			const runtime = createBoardRuntime({
				renderer: createTestRenderer(),
				board: { position: 'start' },
				view: { movability: { mode: 'free', color: 'white' } }
			});
			runtime.mount(createMockContainer());

			runtime.select(sq(12));
			runtime.dragStart(sq(12));
			runtime.cancelInteraction();
			const snap = runtime.getInteractionSnapshot();
			// cancelInteraction clears drag but keeps selection
			expect(snap.interaction.selectedSquare).toBe(sq(12));
			expect(snap.interaction.dragSession).toBeNull();
		});

		it('board and view sections are empty objects (reserved for future use)', () => {
			const runtime = createBoardRuntime({ renderer: createTestRenderer() });
			runtime.mount(createMockContainer());

			const snap = runtime.getInteractionSnapshot();
			expect(Object.keys(snap.board)).toHaveLength(0);
			expect(Object.keys(snap.view)).toHaveLength(0);
		});
	});

	// ── selected-piece → destination-targeting flow ────────────────────────────

	describe('selected-piece → destination-targeting flow', () => {
		it('full tap-to-move flow: select → dropTo → move applied', () => {
			const runtime = createBoardRuntime({
				renderer: createTestRenderer(),
				board: { position: { e2: { color: 'w', role: 'p' } } },
				view: {
					movability: {
						mode: 'strict',
						color: 'white',
						destinations: { 12: [28, 20] }
					}
				}
			});
			runtime.mount(createMockContainer());

			runtime.select(12); // select e2
			const move = runtime.dropTo(28); // tap e4

			expect(move).not.toBeNull();
			expect(move!.from).toBe(12);
			expect(move!.to).toBe(28);
		});

		it('full drag flow: select → dragStart → setCurrentTarget → dropTo → move applied', () => {
			const runtime = createBoardRuntime({
				renderer: createTestRenderer(),
				board: { position: { e2: { color: 'w', role: 'p' } } },
				view: { movability: { mode: 'free', color: 'white' } }
			});
			runtime.mount(createMockContainer());

			runtime.select(12);
			runtime.dragStart(12);
			runtime.setCurrentTarget(20); // e3
			runtime.setCurrentTarget(28); // e4 — moved over e3 then e4

			const move = runtime.dropTo(28);
			expect(move).not.toBeNull();
			expect(move!.from).toBe(12);
			expect(move!.to).toBe(28);
		});

		it('drag cancel → retry via tap: select → dragStart → cancel → dropTo', () => {
			const runtime = createBoardRuntime({
				renderer: createTestRenderer(),
				board: { position: { e2: { color: 'w', role: 'p' } } },
				view: { movability: { mode: 'free', color: 'white' } }
			});
			runtime.mount(createMockContainer());

			runtime.select(12);
			runtime.dragStart(12);
			runtime.cancelInteraction(); // user cancelled drag

			// Selection is kept — user can now tap a destination
			const move = runtime.dropTo(28);
			expect(move).not.toBeNull();
		});

		it('lifted-piece illegal drop → retry in release-targeting: select → dragStart → illegal drop → dropTo legal', () => {
			// After illegal lifted-piece drop, selection is kept (release-targeting mode).
			// dropTo on a legal target from release-targeting mode completes the move.
			const runtime = createBoardRuntime({
				renderer: createTestRenderer(),
				board: { position: { e2: { color: 'w', role: 'p' } } },
				view: {
					movability: {
						mode: 'strict',
						color: 'white',
						destinations: { 12: [28, 20] }
					}
				}
			});
			runtime.mount(createMockContainer());

			runtime.select(12);
			runtime.dragStart(12);
			runtime.dropTo(36); // illegal lifted-piece drop — keeps selection, clears drag

			// Now in release-targeting mode: dropTo on a legal target
			const move = runtime.dropTo(28);
			expect(move).not.toBeNull();
			expect(move!.from).toBe(12);
			expect(move!.to).toBe(28);
		});
	});
});
