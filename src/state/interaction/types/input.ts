import { MoveRequestInput, RolePromotionInput, SquareString } from '../../board/types/input';

export interface MoveDestinationInput extends Omit<MoveRequestInput, 'from' | 'promotedTo'> {
	promotedTo?: RolePromotionInput[]; // For cases where multiple promotions are possible (e.g., underpromotion options)
}

export type MovabilityDestinationsRecordInput = Partial<
	Record<SquareString, readonly MoveDestinationInput[]>
>;
export type MovabilityResolverInput = (
	source: SquareString
) => readonly MoveDestinationInput[] | undefined;
export type MovabilityDestinationsInput =
	| MovabilityDestinationsRecordInput
	| MovabilityResolverInput;

export type StrictMovabilityInput = {
	mode: 'strict';
	destinations: MovabilityDestinationsInput;
};

export type FreeMovabilityInput = {
	mode: 'free';
};

export type DisabledMovabilityInput = {
	mode: 'disabled';
};

export type MovabilityInput = StrictMovabilityInput | FreeMovabilityInput | DisabledMovabilityInput;
