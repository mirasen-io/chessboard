import { setsEqual } from '../../helpers/util';
import { assertValidSquare } from '../board/check';
import type { Square } from '../board/types/internal';
import {
	MovabilityDestinationsRecordSnapshot,
	MovabilityDestinationsSnapshot,
	MovabilityModeCode,
	MoveDestinationSnapshot,
	type MovabilitySnapshot,
	type MovabilityStrict
} from './types/internal';
import { InteractionStateInternal } from './types/main';

function moveDestinationsEqual(
	a: MoveDestinationSnapshot | null | undefined,
	b: MoveDestinationSnapshot | null | undefined
): boolean {
	if (a === b) return true;
	if (a == null || b == null) return false;

	return (
		a.to === b.to &&
		a.capturedSquare === b.capturedSquare &&
		a.secondary?.from === b.secondary?.from &&
		a.secondary?.to === b.secondary?.to &&
		setsEqual(new Set(a.promotedTo ? a.promotedTo : []), new Set(b.promotedTo ? b.promotedTo : []))
	);
}

function recordToDestinationsMap(
	record: MovabilityDestinationsRecordSnapshot
): Map<Square, readonly MoveDestinationSnapshot[]> {
	const map = new Map<Square, readonly MoveDestinationSnapshot[]>();
	for (const [key, dests] of Object.entries(record)) {
		if (dests) {
			const square = Number(key);
			assertValidSquare(square);
			if (map.has(square)) {
				throw new RangeError(`Duplicate square key in movability destinations: ${key}`);
			}
			map.set(square, dests);
		}
	}
	return map;
}

export function movabilitiesEqual(a: MovabilitySnapshot, b: MovabilitySnapshot): boolean {
	if (a === b) return true;
	if (a.mode !== b.mode) return false;

	switch (a.mode) {
		case MovabilityModeCode.Disabled:
			return true;

		case MovabilityModeCode.Free:
			return true;

		case MovabilityModeCode.Strict: {
			const aDests = a.destinations;
			const bDests = (b as MovabilityStrict).destinations;

			const aIsResolver = typeof aDests === 'function';
			const bIsResolver = typeof bDests === 'function';

			if (aIsResolver && bIsResolver) return aDests === bDests;
			if (aIsResolver !== bIsResolver) return false;

			const aMap = recordToDestinationsMap(aDests as MovabilityDestinationsRecordSnapshot);
			const bMap = recordToDestinationsMap(bDests as MovabilityDestinationsRecordSnapshot);

			if (aMap.size !== bMap.size) return false;

			for (const [sq, aDestArr] of aMap) {
				const bDestArr = bMap.get(sq);
				if (!bDestArr) return false;
				if (aDestArr.length !== bDestArr.length) return false;
				for (let i = 0; i < aDestArr.length; i++) {
					if (!moveDestinationsEqual(aDestArr[i], bDestArr[i])) return false;
				}
			}

			return true;
		}

		default:
			throw new RangeError(`Unhandled movability mode code: ${a}`);
	}
}

export function getActiveDestinations(
	state: InteractionStateInternal,
	from: Square
): ReadonlyMap<Square, MoveDestinationSnapshot> {
	const movability = state.movability;
	if (movability.mode === MovabilityModeCode.Disabled) return new Map();
	if (movability.mode === MovabilityModeCode.Free) return new Map();
	// strict mode: normalize and build a Map keyed by destination square
	const dests = getDestinationsForSource(movability.destinations, from) ?? [];
	const map = new Map<Square, MoveDestinationSnapshot>();
	for (const dest of dests) {
		map.set(dest.to, dest);
	}
	return map;
}

function getDestinationsForSource(
	destinations: MovabilityDestinationsSnapshot,
	source: Square
): readonly MoveDestinationSnapshot[] | undefined {
	if (typeof destinations === 'function') {
		return destinations(source);
	}
	return destinations[source];
}
