import { describe, expect, it } from 'vitest';
import { RoleCode, type Square } from '../../../src/state/board/types/internal.js';
import {
	normalizeMovability,
	normalizeMoveDestinationInput
} from '../../../src/state/interaction/normalize.js';
import { MovabilityModeCode } from '../../../src/state/interaction/types/internal.js';

describe('normalizeMoveDestinationInput', () => {
	it('normalizes a minimal destination (just to)', () => {
		const result = normalizeMoveDestinationInput({ to: 'e4' });
		expect(result.to).toBe(28); // e4
		expect(result.capturedSquare).toBeUndefined();
		expect(result.secondary).toBeUndefined();
		expect(result.promotedTo).toBeUndefined();
	});

	it('normalizes destination with all optional fields', () => {
		const result = normalizeMoveDestinationInput({
			to: 'd5',
			capturedSquare: 'd5',
			secondary: { from: 'h1', to: 'f1' },
			promotedTo: ['Q', 'N']
		});
		expect(result.to).toBe(35); // d5
		expect(result.capturedSquare).toBe(35);
		expect(result.secondary).toEqual({ from: 7, to: 5 });
		expect(result.promotedTo).toEqual([RoleCode.Queen, RoleCode.Knight]);
	});
});

describe('normalizeMovability', () => {
	it('normalizes disabled mode', () => {
		const result = normalizeMovability({ mode: 'disabled' });
		expect(result.mode).toBe(MovabilityModeCode.Disabled);
	});

	it('normalizes free mode', () => {
		const result = normalizeMovability({ mode: 'free' });
		expect(result.mode).toBe(MovabilityModeCode.Free);
	});

	it('normalizes strict mode with record', () => {
		const result = normalizeMovability({
			mode: 'strict',
			destinations: {
				e2: [{ to: 'e4' }, { to: 'e3' }]
			}
		});
		expect(result.mode).toBe(MovabilityModeCode.Strict);
		if (result.mode === MovabilityModeCode.Strict) {
			expect(typeof result.destinations).not.toBe('function');
			const record = result.destinations as Record<number, unknown>;
			// e2 = 12
			expect(record[12]).toHaveLength(2);
		}
	});

	it('normalizes strict mode with resolver', () => {
		const userResolver = (sq: string) => {
			if (sq === 'e2') return [{ to: 'e4' as const }];
			return undefined;
		};
		const result = normalizeMovability({
			mode: 'strict',
			destinations: userResolver
		});
		expect(result.mode).toBe(MovabilityModeCode.Strict);
		if (result.mode === MovabilityModeCode.Strict) {
			expect(typeof result.destinations).toBe('function');
			// Call with numeric square 12 (e2) — should denormalize to 'e2' for user resolver
			const dests = (result.destinations as (sq: Square) => unknown)(12 as Square);
			expect(dests).toBeDefined();
			expect(Array.isArray(dests)).toBe(true);
		}
	});

	it('strict resolver returns undefined for unknown square', () => {
		const userResolver = () => undefined;
		const result = normalizeMovability({
			mode: 'strict',
			destinations: userResolver
		});
		if (result.mode === MovabilityModeCode.Strict) {
			const dests = (result.destinations as (sq: Square) => unknown)(0 as Square);
			expect(dests).toBeUndefined();
		}
	});

	it('strict record normalizes promotedTo strings to RolePromotionCode', () => {
		const result = normalizeMovability({
			mode: 'strict',
			destinations: {
				e7: [{ to: 'e8', promotedTo: ['Q', 'R', 'B', 'N'] }]
			}
		});
		if (result.mode === MovabilityModeCode.Strict) {
			const record = result.destinations as Record<number, readonly { promotedTo?: number[] }[]>;
			// e7 = 52
			expect(record[52]![0]!.promotedTo).toEqual([
				RoleCode.Queen,
				RoleCode.Rook,
				RoleCode.Bishop,
				RoleCode.Knight
			]);
		}
	});
});
