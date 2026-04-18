export type ExtensionSlotName =
	| 'defs'
	| 'board'
	| 'coordinates'
	| 'underPieces'
	| 'pieces'
	| 'overPieces'
	| 'animation'
	| 'underDrag'
	| 'drag'
	| 'overDrag';

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
] as const satisfies readonly ExtensionSlotName[];

type _CheckAllExtensionSlotsExact = [ExtensionSlotName] extends [
	(typeof ALL_EXTENSION_SLOTS)[number]
]
	? [(typeof ALL_EXTENSION_SLOTS)[number]] extends [ExtensionSlotName]
		? true
		: false
	: false;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _checkAllExtensionSlotsExact: _CheckAllExtensionSlotsExact = true;

export type ExtensionSlotSvgRoots<TSlots extends readonly ExtensionSlotName[]> = Readonly<
	Record<TSlots[number], SVGGElement>
>;

export type ExtensionAllocatedSlotsInternal = Partial<
	ExtensionSlotSvgRoots<readonly ExtensionSlotName[]>
>;

export interface ExtensionInstanceMountOptions<TSlots extends readonly ExtensionSlotName[]> {
	slotRoots: ExtensionSlotSvgRoots<TSlots>;
}
