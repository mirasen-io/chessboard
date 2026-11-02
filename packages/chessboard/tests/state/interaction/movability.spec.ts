import { describe, expect, it } from 'vitest';
import type { Square } from '../../../src/state/board/types/internal.js';
import {
	getActiveDestinations,
	movabilitiesEqual
} from '../../../src/state/interaction/movability.js';
import {
	MovabilityModeCode,
	type MovabilityDisabled,
	type MovabilityFree,
	type MovabilityStrict,
	type MoveDestination,
	type MoveDestinationSnapshot
} from '../../../src/state/interaction/types/internal.js';
import { makeInteractionStateInternal } from '../../test-utils/state/interaction/fixtures.js';

const DISABLED: MovabilityDisabled = { mode: MovabilityModeCode.Disabled };
const FREE: MovabilityFree = { mode: MovabilityModeCode.Free };

function makeStrictRecord(
	record: Record<number, readonly MoveDestinationSnapshot[]>
): MovabilityStrict {
	return { mode: MovabilityModeCode.Strict, destinations: record };
}

describe('movabilitiesEqual', () => {
	it('same reference → true', () => {
		const m = DISABLED;
		expect(movabilitiesEqual(m, m)).toBe(true);
	});

	it('Disabled vs Disabled → true', () => {
		expect(movabilitiesEqual(DISABLED, { mode: MovabilityModeCode.Disabled })).toBe(true);
	});

	it('Free vs Free → true', () => {
		expect(movabilitiesEqual(FREE, { mode: MovabilityModeCode.Free })).toBe(true);
	});

	it('different modes → false', () => {
		expect(movabilitiesEqual(DISABLED, FREE)).toBe(false);
	});

	it('Strict record: same entries → true', () => {
		const dest: MoveDestinationSnapshot = { to: 28 as Square };
		expect(
			movabilitiesEqual(makeStrictRecord({ 12: [dest] }), makeStrictRecord({ 12: [dest] }))
		).toBe(true);
	});

	it('Strict record: different entries → false', () => {
		expect(
			movabilitiesEqual(
				makeStrictRecord({ 12: [{ to: 28 as Square }] }),
				makeStrictRecord({ 12: [{ to: 20 as Square }] })
			)
		).toBe(false);
	});

	it('Strict resolver: same function reference → true', () => {
		const resolver = () => undefined;
		const a: MovabilityStrict = { mode: MovabilityModeCode.Strict, destinations: resolver };
		const b: MovabilityStrict = { mode: MovabilityModeCode.Strict, destinations: resolver };
		expect(movabilitiesEqual(a, b)).toBe(true);
	});

	it('Strict resolver: different function references → false', () => {
		const a: MovabilityStrict = {
			mode: MovabilityModeCode.Strict,
			destinations: () => undefined
		};
		const b: MovabilityStrict = {
			mode: MovabilityModeCode.Strict,
			destinations: () => undefined
		};
		expect(movabilitiesEqual(a, b)).toBe(false);
	});

	it('Strict record vs resolver → false', () => {
		const record: MovabilityStrict = makeStrictRecord({ 12: [{ to: 28 as Square }] });
		const resolver: MovabilityStrict = {
			mode: MovabilityModeCode.Strict,
			destinations: () => undefined
		};
		expect(movabilitiesEqual(record, resolver)).toBe(false);
	});
});

describe('getActiveDestinations', () => {
	it('returns empty Map for Disabled mode', () => {
		const state = makeInteractionStateInternal({ movability: DISABLED });
		expect(getActiveDestinations(state, 12 as Square).size).toBe(0);
	});

	it('returns empty Map for Free mode', () => {
		const state = makeInteractionStateInternal({ movability: FREE });
		expect(getActiveDestinations(state, 12 as Square).size).toBe(0);
	});

	it('returns destinations for matching source in Strict record', () => {
		const dest1: MoveDestinationSnapshot = { to: 28 as Square };
		const dest2: MoveDestinationSnapshot = { to: 20 as Square };
		const movability = makeStrictRecord({ 12: [dest1, dest2] });
		const state = makeInteractionStateInternal({ movability });

		const result = getActiveDestinations(state, 12 as Square);

		expect(result.size).toBe(2);
		expect(result.get(28 as Square)).toBe(dest1);
		expect(result.get(20 as Square)).toBe(dest2);
	});

	it('returns destinations from Strict resolver', () => {
		const dest: MoveDestination = { to: 28 as Square };
		const resolver = (source: Square): readonly MoveDestination[] | undefined =>
			source === 12 ? [dest] : undefined;
		const movability: MovabilityStrict = {
			mode: MovabilityModeCode.Strict,
			destinations: resolver
		};
		const state = makeInteractionStateInternal({ movability });

		const result = getActiveDestinations(state, 12 as Square);

		expect(result.size).toBe(1);
		expect(result.get(28 as Square)).toEqual(dest);
	});
});
