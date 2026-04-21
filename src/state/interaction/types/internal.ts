import type { ReadonlyDeep } from 'type-fest';
import type {
	ExtensionDragSession,
	ExtensionDragSessionBase
} from '../../../extensions/types/basic/interaction.js';
import type {
	MoveRequest,
	PieceCode,
	RolePromotionCode,
	Square
} from '../../board/types/internal.js';

export type DragSessionExtensionOwned = ExtensionDragSession & {
	owner: string; // Extension identifier
};
export type DragSessionExtensionOwnedSnapshot = ReadonlyDeep<DragSessionExtensionOwned>;

export interface DragSessionCoreOwned extends ExtensionDragSessionBase {
	owner: 'core';
	type: 'lifted-piece-drag' | 'release-targeting';
	sourceSquare: Square;
	sourcePieceCode: PieceCode;
	targetSquare: Square | null;
}
export type DragSessionCoreOwnedSnapshot = ReadonlyDeep<DragSessionCoreOwned>;

export type DragSession = DragSessionCoreOwned | DragSessionExtensionOwned;

export type DragSessionSnapshot = ReadonlyDeep<DragSession>;

export interface MoveDestination extends Omit<MoveRequest, 'from' | 'promotedTo'> {
	promotedTo?: RolePromotionCode[];
}
export type MoveDestinationSnapshot = ReadonlyDeep<MoveDestination>;

export type MovabilityDestinationsRecord = Partial<Record<Square, readonly MoveDestination[]>>;
export type MovabilityDestinationsRecordSnapshot = ReadonlyDeep<MovabilityDestinationsRecord>;
export type MovabilityResolver = (source: Square) => readonly MoveDestination[] | undefined;
export type MovabilityDestinations = MovabilityDestinationsRecord | MovabilityResolver;
export type MovabilityDestinationsSnapshot = ReadonlyDeep<MovabilityDestinations>;

export const enum MovabilityModeCode {
	Disabled = 0,
	Free = 1,
	Strict = 2
}

export interface MovabilityStrict {
	readonly mode: MovabilityModeCode.Strict;
	readonly destinations: MovabilityDestinationsSnapshot;
}

export interface MovabilityFree {
	readonly mode: MovabilityModeCode.Free;
}

export interface MovabilityDisabled {
	readonly mode: MovabilityModeCode.Disabled;
}

export type Movability = MovabilityStrict | MovabilityFree | MovabilityDisabled;
export type MovabilitySnapshot = ReadonlyDeep<Movability>;
