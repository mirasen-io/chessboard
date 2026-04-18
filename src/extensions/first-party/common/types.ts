import { ExtensionSlotName, ExtensionSlotSvgRoots } from '../../types/basic/mount';

export interface ExtensionInternal<TSlots extends readonly ExtensionSlotName[]> {
	slotRoots: ExtensionSlotSvgRoots<TSlots> | null;
	destroyed: boolean;
}

export type AnyExtensionInternal = ExtensionInternal<readonly ExtensionSlotName[]>;

export interface OpaqueColor {
	color: string;
	opacity: number;
}
