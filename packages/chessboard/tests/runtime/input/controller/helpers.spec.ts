import { describe, expect, it } from 'vitest';
import { canMoveTo } from '../../../../src/runtime/input/controller/helpers.js';
import { normalizeSquare } from '../../../../src/state/board/normalize.js';
import { PieceCode } from '../../../../src/state/board/types/internal.js';
import { DefaultInteractionDesktopConfig } from '../../../../src/state/interaction/config.js';
import { MovabilityModeCode } from '../../../../src/state/interaction/types/internal.js';
import type { InteractionStateSnapshot } from '../../../../src/state/interaction/types/main.js';

function makeSnapshot(overrides: Partial<InteractionStateSnapshot> = {}): InteractionStateSnapshot {
	return {
		selected: null,
		movability: { mode: MovabilityModeCode.Disabled },
		activeDestinations: new Map(),
		dragSession: null,
		config: DefaultInteractionDesktopConfig,
		...overrides
	};
}

describe('canMoveTo', () => {
	it('returns false when movability is disabled', () => {
		const snapshot = makeSnapshot({ movability: { mode: MovabilityModeCode.Disabled } });
		expect(canMoveTo(snapshot, normalizeSquare('e4'))).toBe(false);
	});

	it('returns true in free mode for target different from selected square', () => {
		const snapshot = makeSnapshot({
			movability: { mode: MovabilityModeCode.Free },
			selected: { square: normalizeSquare('e2'), pieceCode: PieceCode.WhitePawn }
		});
		expect(canMoveTo(snapshot, normalizeSquare('e4'))).toBe(true);
	});

	it('returns false in free mode for target same as selected square', () => {
		const snapshot = makeSnapshot({
			movability: { mode: MovabilityModeCode.Free },
			selected: { square: normalizeSquare('e2'), pieceCode: PieceCode.WhitePawn }
		});
		expect(canMoveTo(snapshot, normalizeSquare('e2'))).toBe(false);
	});

	it('returns true in strict mode when target is in activeDestinations', () => {
		const destinations = new Map([[normalizeSquare('e4'), { to: normalizeSquare('e4') }]]);
		const snapshot = makeSnapshot({
			movability: { mode: MovabilityModeCode.Strict, destinations: {} },
			activeDestinations: destinations
		});
		expect(canMoveTo(snapshot, normalizeSquare('e4'))).toBe(true);
	});

	it('returns false in strict mode when target is not in activeDestinations', () => {
		const snapshot = makeSnapshot({
			movability: { mode: MovabilityModeCode.Strict, destinations: {} },
			activeDestinations: new Map()
		});
		expect(canMoveTo(snapshot, normalizeSquare('e4'))).toBe(false);
	});
});
