import { ReadonlyDeep } from 'type-fest';
import { denormalizeSquare } from '../board/denormalize';
import { normalizeRolePromotion, normalizeSquare } from '../board/normalize';
import { SquareString } from '../board/types/input';
import { MovabilityInput, MoveDestinationInput } from './types/input';
import {
	Movability,
	MovabilityDestinations,
	MovabilityModeCode,
	MoveDestination
} from './types/internal';

export function normalizeMoveDestinationInput(
	destination: ReadonlyDeep<MoveDestinationInput>
): MoveDestination {
	return {
		to: normalizeSquare(destination.to),
		...(destination.capturedSquare && {
			capturedSquare: normalizeSquare(destination.capturedSquare)
		}),
		...(destination.secondary && {
			secondary: {
				from: normalizeSquare(destination.secondary.from),
				to: normalizeSquare(destination.secondary.to)
			}
		}),
		...(destination.promotedTo && {
			promotedTo: destination.promotedTo.map(normalizeRolePromotion)
		})
	};
}

export function normalizeMovability(movability: MovabilityInput): Movability {
	if (movability.mode === 'disabled') {
		return { mode: MovabilityModeCode.Disabled };
	}
	if (movability.mode === 'free') {
		return { mode: MovabilityModeCode.Free };
	}
	// Strict mode
	let destinations: MovabilityDestinations;
	if (typeof movability.destinations === 'function') {
		const resolverInput = movability.destinations;
		destinations = (source) => {
			const inputDests = resolverInput(denormalizeSquare(source));
			return inputDests ? inputDests.map(normalizeMoveDestinationInput) : undefined;
		};
		return {
			mode: MovabilityModeCode.Strict,
			destinations
		};
	}
	// Destinations as record
	const recordInput = movability.destinations;
	const destinationsRecord: MovabilityDestinations = {};
	for (const [sqStr, destInputs] of Object.entries(recordInput) as [
		SquareString,
		readonly MoveDestinationInput[]
	][]) {
		destinationsRecord[normalizeSquare(sqStr)] = destInputs.map(normalizeMoveDestinationInput);
	}
	return {
		mode: MovabilityModeCode.Strict,
		destinations: destinationsRecord
	};
}
