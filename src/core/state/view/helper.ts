import { setsEqual } from '../../../helper/util';
import type { Square } from '../board/types';
import type { MovabilityDestinationsRecord, MovabilitySnapshot, StrictMovability } from './types';

function assertNever(x: never): never {
	throw new Error(`Unhandled movability comparison case: ${String(x)}`);
}
/**
 * Local helper for structural movability equality.
 */
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
			return assertNever(a);
	}
}
