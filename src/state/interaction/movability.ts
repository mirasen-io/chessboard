import { assertNever } from '../../utils/assert-never';
import { toValidSquare } from '../board/coords';
import { normalizeMoveDestinationInput } from '../board/normalize';
import type { MoveDestination, MoveDestinationInput, Square, SquareInput } from '../board/types';
import type {
	InteractionStateInternal,
	MovabilityDestinations,
	MovabilityDestinationsRecord,
	MovabilitySnapshot,
	StrictMovability
} from './types';

function moveInputDestinationsEqual(
	a: MoveDestinationInput | null | undefined,
	b: MoveDestinationInput | null | undefined
): boolean {
	if (a === b) return true;
	if (a == null || b == null) return false;

	return (
		a.to === b.to &&
		a.capturedSquare === b.capturedSquare &&
		a.secondary?.from === b.secondary?.from &&
		a.secondary?.to === b.secondary?.to
	);
}

function recordToDestinationInputMap(
	record: MovabilityDestinationsRecord
): Map<Square, readonly MoveDestinationInput[]> {
	const map = new Map<Square, readonly MoveDestinationInput[]>();
	for (const [key, dests] of Object.entries(record)) {
		if (dests) {
			const validSquare = toValidSquare(key as SquareInput);
			if (map.has(validSquare)) {
				throw new RangeError(`Duplicate square key in movability destinations: ${key}`);
			}
			map.set(validSquare, dests);
		}
	}
	return map;
}

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

			const aMap = recordToDestinationInputMap(aDests as MovabilityDestinationsRecord);
			const bMap = recordToDestinationInputMap(bDests as MovabilityDestinationsRecord);

			if (aMap.size !== bMap.size) return false;

			for (const [sq, aDestArr] of aMap) {
				const bDestArr = bMap.get(sq);
				if (!bDestArr) return false;
				if (aDestArr.length !== bDestArr.length) return false;
				for (let i = 0; i < aDestArr.length; i++) {
					if (!moveInputDestinationsEqual(aDestArr[i], bDestArr[i])) return false;
				}
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
): ReadonlyMap<Square, MoveDestination> {
	const movability = state.movability;
	if (movability.mode === 'disabled') return new Map();
	if (movability.mode === 'free') return new Map();
	// strict mode: normalize and build a Map keyed by destination square
	const dests = getDestinationsForSource(movability.destinations, from) ?? [];
	const map = new Map<Square, MoveDestination>();
	for (const dest of dests) {
		const normalized = normalizeMoveDestinationInput(dest);
		map.set(normalized.to, normalized);
	}
	return map;
}

function getDestinationsForSource(
	destinations: MovabilityDestinations,
	source: Square
): readonly MoveDestinationInput[] | undefined {
	if (typeof destinations === 'function') {
		return destinations(source);
	}
	return destinations[source];
}
