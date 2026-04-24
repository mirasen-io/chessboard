import { ExtensionSlotName, ExtensionSlotSvgRoots } from '../../types/basic/mount.js';

export interface ExtensionInternalBase<TSlots extends readonly ExtensionSlotName[]> {
	slotRoots: ExtensionSlotSvgRoots<TSlots> | null;
	destroyed: boolean;
}

export interface OpaqueColor {
	color: string;
	opacity: number | string;
}
