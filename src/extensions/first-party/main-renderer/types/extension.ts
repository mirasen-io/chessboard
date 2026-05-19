import type { ExtensionDefinition, ExtensionInstance } from '../../../types/extension.js';
import type { MainRendererConfigPublicDrag, MainRendererInitOptionsDrag } from './public.js';

export const EXTENSION_SLOTS = [
	'defs',
	'board',
	'coordinates',
	'pieces',
	'animation',
	'drag'
] as const;
export type ExtensionSlotsType = typeof EXTENSION_SLOTS;
export const EXTENSION_ID = 'renderer' as const;

export interface RendererPublicAPI {
	setDragConfig(options: MainRendererInitOptionsDrag): void;
	getDragConfig(): MainRendererConfigPublicDrag;
}

export type MainRendererDefinition = ExtensionDefinition<
	typeof EXTENSION_ID,
	typeof EXTENSION_SLOTS,
	RendererPublicAPI
>;

export type MainRendererInstance = ExtensionInstance<
	typeof EXTENSION_ID,
	typeof EXTENSION_SLOTS,
	RendererPublicAPI
>;

export enum DirtyLayer {
	Board = 1, // 1 << 0,
	Coordinates = 2, // 1 << 1,
	Pieces = 4, // 1 << 2,
	Drag = 8, // 1 << 3,
	All = Board | Coordinates | Pieces | Drag
}
