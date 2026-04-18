import { ExtensionDefinition, ExtensionInstance } from '../../../types/extension';
import { MainRendererConfigInput } from './input';

export type MainRendererInitOptions = Partial<MainRendererConfigInput>;

export const EXTENSION_SLOTS = ['board', 'coordinates', 'pieces', 'animation', 'drag'] as const;
export type ExtensionSlotsType = typeof EXTENSION_SLOTS;
export const EXTENSION_ID = 'main-renderer' as const;

// export type MainRendererMountOptions = ExtensionInstanceMountOptions<typeof EXTENSION_SLOTS>;
// export type MainRendererSlotRoots = ExtensionSlotSvgRoots<typeof EXTENSION_SLOTS>;

export type MainRendererDefinition = ExtensionDefinition<
	typeof EXTENSION_ID,
	typeof EXTENSION_SLOTS,
	never
>;

export type MainRendererInstance = ExtensionInstance<
	typeof EXTENSION_ID,
	typeof EXTENSION_SLOTS,
	never
>;

export enum DirtyLayer {
	Board = 1, // 1 << 0,
	Coordinates = 2, // 1 << 1,
	Pieces = 4, // 1 << 2,
	Drag = 8, // 1 << 3,
	All = Board | Coordinates | Pieces | Drag
}
