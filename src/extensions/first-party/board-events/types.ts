import { RuntimeReadonlyMutationSession } from '../../../runtime/mutation/types';
import { MoveOutput } from '../../../state/board/types/output';
import { ExtensionSlotSvgRoots } from '../../types/basic/mount';
import { UpdateFrameSnapshot } from '../../types/basic/update';
import { ExtensionDefinition, ExtensionInstance } from '../../types/extension';
import { ExtensionInternal } from '../common/types';

export const EXTENSION_SLOTS = [] as const;
export type ExtensionSlotsType = typeof EXTENSION_SLOTS;
export const EXTENSION_ID = 'events' as const;

export type BoardEventsDefinition = ExtensionDefinition<
	typeof EXTENSION_ID,
	typeof EXTENSION_SLOTS,
	BoardEventsPublic
>;

export type OnUIMoveCallback = (move: MoveOutput) => void;
export interface OnRawUpdateContext {
	readonly previousFrame: UpdateFrameSnapshot | null;
	readonly mutation: RuntimeReadonlyMutationSession;
	readonly currentFrame: UpdateFrameSnapshot;
}
export type OnRawUpdateCallback = (context: OnRawUpdateContext) => void;
export interface BoardEventsPublic {
	setOnUIMove(callback: OnUIMoveCallback | null): void;
	setOnRawUpdate(callback: OnRawUpdateCallback | null): void;
}

export type BoardEventsInstance = ExtensionInstance<
	typeof EXTENSION_ID,
	typeof EXTENSION_SLOTS,
	BoardEventsPublic
>;

export type BoardEventsSlotRoots = ExtensionSlotSvgRoots<typeof EXTENSION_SLOTS>;

export interface BoardEventsInstanceInternal extends ExtensionInternal<ExtensionSlotsType> {
	onUIMove: OnUIMoveCallback | null;
	onRawUpdate: OnRawUpdateCallback | null;
}
