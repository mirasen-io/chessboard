import { NormalizedMoveInput, RolePromotion, Square } from '../../state/board/types';
import { MoveDestinationSnapshot } from '../../state/interaction/types';

export function convertDestinationToMoveInput(
	from: Square,
	destination: MoveDestinationSnapshot
): NormalizedMoveInput {
	let promotedTo: RolePromotion | undefined;
	if (destination.promotedTo && destination.promotedTo.length === 1) {
		promotedTo = destination.promotedTo[0];
	} else if (destination.promotedTo && destination.promotedTo.length > 1) {
		// For this case we don't now what to do
		// The move input should be deferred and the user should be prompted to choose a promotion
		throw new Error(
			'Multiple promotion options not supported in convertDestinationToMoveInput. The move input should be deferred and the user should be prompted to choose a promotion.'
		);
	}
	return {
		from,
		to: destination.to,
		...(destination.capturedSquare && { capturedSquare: destination.capturedSquare }),
		...(destination.secondary && { secondary: destination.secondary }),
		...(promotedTo && { promotedTo })
	};
}
