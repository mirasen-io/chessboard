import { describe, expect, it } from 'vitest';
import { createRuntime } from '../../../src/runtime/factory/main.js';
import { normalizeSquare } from '../../../src/state/board/normalize.js';
import { PieceCode } from '../../../src/state/board/types/internal.js';
import { MovabilityModeCode } from '../../../src/state/interaction/types/internal.js';

function createTestRuntime() {
	return createRuntime({ element: document.createElement('div') });
}

describe('runtime interaction commands', () => {
	describe('setMovability', () => {
		it('returns true when changing movability to free', () => {
			const runtime = createTestRuntime();
			const result = runtime.setMovability({ mode: 'free' });
			expect(result).toBe(true);
		});

		it('returns false when movability is already the same', () => {
			const runtime = createTestRuntime();
			// Default is disabled
			const result = runtime.setMovability({ mode: 'disabled' });
			expect(result).toBe(false);
		});

		it('snapshot reflects free movability', () => {
			const runtime = createTestRuntime();
			runtime.setMovability({ mode: 'free' });
			const snapshot = runtime.getSnapshot();
			expect(snapshot.state.interaction.movability.mode).toBe(MovabilityModeCode.Free);
		});

		it('snapshot reflects strict movability', () => {
			const runtime = createTestRuntime();
			runtime.setMovability({ mode: 'strict', destinations: {} });
			const snapshot = runtime.getSnapshot();
			expect(snapshot.state.interaction.movability.mode).toBe(MovabilityModeCode.Strict);
		});
	});

	describe('select', () => {
		it('returns true when selecting a square with a piece', () => {
			const runtime = createTestRuntime();
			const result = runtime.select('e2');
			expect(result).toBe(true);
		});

		it('snapshot reflects selected square', () => {
			const runtime = createTestRuntime();
			runtime.select('e2');
			const snapshot = runtime.getSnapshot();
			expect(snapshot.state.interaction.selected).not.toBeNull();
			expect(snapshot.state.interaction.selected!.square).toBe(normalizeSquare('e2'));
			expect(snapshot.state.interaction.selected!.pieceCode).toBe(PieceCode.WhitePawn);
		});

		it('returns false when selecting same square again', () => {
			const runtime = createTestRuntime();
			runtime.select('e2');
			const result = runtime.select('e2');
			expect(result).toBe(false);
		});

		it('throws when selecting empty square', () => {
			const runtime = createTestRuntime();
			expect(() => runtime.select('e4')).toThrow();
		});

		it('select(null) deselects and returns true', () => {
			const runtime = createTestRuntime();
			runtime.select('e2');
			const result = runtime.select(null);
			expect(result).toBe(true);
			expect(runtime.getSnapshot().state.interaction.selected).toBeNull();
		});

		it('select(null) returns false when nothing is selected', () => {
			const runtime = createTestRuntime();
			const result = runtime.select(null);
			expect(result).toBe(false);
		});
	});

	describe('clearInteraction', () => {
		it('returns true when there is a selection to clear', () => {
			const runtime = createTestRuntime();
			runtime.select('e2');
			const result = runtime.clearInteraction();
			expect(result).toBe(true);
		});

		it('returns false when nothing to clear', () => {
			const runtime = createTestRuntime();
			const result = runtime.clearInteraction();
			expect(result).toBe(false);
		});

		it('clears selection from snapshot', () => {
			const runtime = createTestRuntime();
			runtime.select('e2');
			runtime.clearInteraction();
			expect(runtime.getSnapshot().state.interaction.selected).toBeNull();
		});
	});

	describe('clearActiveInteraction', () => {
		it('returns false when no active interaction exists', () => {
			const runtime = createTestRuntime();
			const result = runtime.clearActiveInteraction();
			expect(result).toBe(false);
		});

		it('returns false when only selection exists (no drag)', () => {
			const runtime = createTestRuntime();
			runtime.select('e2');
			const result = runtime.clearActiveInteraction();
			expect(result).toBe(false);
		});
	});

	describe('interaction config', () => {
		it('default runtime uses desktop default thresholdPx (0)', () => {
			const runtime = createTestRuntime();
			expect(runtime.getInteractionConfig().drag.liftedActivation.thresholdPx).toBe(0);
		});

		it('honors thresholdPx provided via createRuntime state.interaction.config', () => {
			const runtime = createRuntime({
				element: document.createElement('div'),
				state: {
					interaction: {
						config: { drag: { liftedActivation: { thresholdPx: 3 } } }
					}
				}
			});
			expect(runtime.getInteractionConfig().drag.liftedActivation.thresholdPx).toBe(3);
		});

		it('setInteractionConfig returns true when thresholdPx changes and reflects new value', () => {
			const runtime = createTestRuntime();
			const result = runtime.setInteractionConfig({
				drag: { liftedActivation: { thresholdPx: 5 } }
			});
			expect(result).toBe(true);
			expect(runtime.getInteractionConfig().drag.liftedActivation.thresholdPx).toBe(5);
			expect(runtime.getSnapshot().state.interaction.config.drag.liftedActivation.thresholdPx).toBe(
				5
			);
		});

		it('setInteractionConfig returns false when value is unchanged', () => {
			const runtime = createTestRuntime();
			const result = runtime.setInteractionConfig({
				drag: { liftedActivation: { thresholdPx: 0 } }
			});
			expect(result).toBe(false);
		});

		it('partial-merges nested input over current config', () => {
			const runtime = createTestRuntime();
			runtime.setInteractionConfig({ drag: { liftedActivation: { thresholdPx: 7 } } });
			// Provide an empty drag branch — must NOT clobber thresholdPx, but should be a no-op
			const result = runtime.setInteractionConfig({ drag: {} });
			expect(result).toBe(false);
			expect(runtime.getInteractionConfig().drag.liftedActivation.thresholdPx).toBe(7);
		});

		it.each([-1, Number.NaN, Number.POSITIVE_INFINITY])(
			'throws for invalid thresholdPx: %s',
			(value) => {
				const runtime = createTestRuntime();
				expect(() =>
					runtime.setInteractionConfig({ drag: { liftedActivation: { thresholdPx: value } } })
				).toThrow();
			}
		);

		it('getInteractionConfig returns an isolated snapshot (mutation does not leak)', () => {
			const runtime = createTestRuntime();
			const snapshot = runtime.getInteractionConfig() as {
				drag: { liftedActivation: { thresholdPx: number } };
			};
			snapshot.drag.liftedActivation.thresholdPx = 999;
			expect(runtime.getInteractionConfig().drag.liftedActivation.thresholdPx).toBe(0);
		});
	});
});
