import { setsEqual } from '../../helpers/util';
import { assertNever } from '../../utils/assert-never';
import type { Square } from '../board/types';
import type {
	InteractionStateInternal,
	MovabilityDestinations,
	MovabilityDestinationsRecord,
	MovabilitySnapshot,
	StrictMovability
} from './types';

export function movabilitiesEqual(a: MovabilitySnapshot, b: MovabilitySnapshot): boolean {
	if (a === b) return true;
	if (a.mode !== b.mode) return false;

	switch (a.mode) {
		case 'disabled':
			return true;

		case 'free':
			return true;

		case 'strict': {
			const aDests = a.destinations;
			const bDests = (b as StrictMovability).destinations;

			const aIsResolver = typeof aDests === 'function';
			const bIsResolver = typeof bDests === 'function';

			if (aIsResolver && bIsResolver) return aDests === bDests;
			if (aIsResolver !== bIsResolver) return false;

			const aRecord = aDests as MovabilityDestinationsRecord;
			const bRecord = bDests as MovabilityDestinationsRecord;

			const aKeys = new Set<Square>(Object.keys(aRecord).map(Number) as Square[]);
			const bKeys = new Set<Square>(Object.keys(bRecord).map(Number) as Square[]);

			if (!setsEqual(aKeys, bKeys)) return false;

			for (const sq of aKeys) {
				const aSet = new Set(aRecord[sq]);
				const bSet = new Set(bRecord[sq]);
				if (!setsEqual(aSet, bSet)) return false;
			}

			return true;
		}

		default:
			return assertNever(RangeError, 'Unhandled movability comparison case', a);
	}
}

export function getActiveDestinations(
	state: InteractionStateInternal,
	from: Square
): ReadonlySet<Square> {
	const movability = state.movability;
	if (movability.mode === 'disabled') return new Set();
	if (movability.mode === 'free') return new Set();
	// strict mode: look up the destinations for this square
	return new Set(getDestinationsForSource(movability.destinations, from) ?? []);
}

function getDestinationsForSource(
	destinations: MovabilityDestinations,
	source: Square
): readonly Square[] | undefined {
	if (typeof destinations === 'function') {
		return destinations(source);
	}
	return destinations[source];
}
