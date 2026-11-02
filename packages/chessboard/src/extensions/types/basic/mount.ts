export const ALL_EXTENSION_SLOTS = [
	'defs',
	'board',
	'coordinates',
	'underPieces',
	'pieces',
	'overPieces',
	'animation',
	'underDrag',
	'drag',
	'overDrag'
] as const;

export type ExtensionSlotName = (typeof ALL_EXTENSION_SLOTS)[number];

export type ExtensionSlotSvgRoot<TSlot extends ExtensionSlotName> = TSlot extends 'defs'
	? SVGDefsElement
	: SVGGElement;
export type ExtensionSlotSvgRoots<TSlots extends readonly ExtensionSlotName[]> = Readonly<{
	[TSlot in TSlots[number]]: ExtensionSlotSvgRoot<TSlot>;
}>;

export type ExtensionAllocatedSlotsInternal = Partial<
	ExtensionSlotSvgRoots<readonly ExtensionSlotName[]>
>;

export interface ExtensionInstanceMountOptions<TSlots extends readonly ExtensionSlotName[]> {
	slotRoots: ExtensionSlotSvgRoots<TSlots>;
}
