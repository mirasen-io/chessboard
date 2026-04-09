import { PartialDeep } from 'type-fest';
import {
	ExtensionDefinition,
	ExtensionInstance,
	ExtensionInstanceMountOptions,
	ExtensionOnUpdateStateContext,
	ExtensionRenderStateContext,
	ExtensionRenderVisualsContext,
	ExtensionSlotSvgRoots
} from '../../types';
import { ConfigColors, PieceUrls } from './config';

export interface MainRendererInitOptions {
	colors?: PartialDeep<ConfigColors>;
	pieceUrls?: PieceUrls;
}

export const EXTENSION_SLOTS = ['board', 'coordinates', 'pieces', 'animation', 'drag'] as const;
export const EXTENSION_ID = 'main-renderer' as const;

export type MainRendererMountOptions = ExtensionInstanceMountOptions<typeof EXTENSION_SLOTS>;
export type MainRendererSlotRoots = ExtensionSlotSvgRoots<typeof EXTENSION_SLOTS>;

export type MainRendererDefinition = ExtensionDefinition<
	typeof EXTENSION_ID,
	typeof EXTENSION_SLOTS,
	never,
	void
>;

export type MainRendererInstance = ExtensionInstance<
	typeof EXTENSION_ID,
	typeof EXTENSION_SLOTS,
	never,
	void
>;

export type MainRendererData = void;

export type MainRendererOnUpdateContext = ExtensionOnUpdateStateContext<MainRendererData>;

export type MainRendererRenderStateContext = ExtensionRenderStateContext<MainRendererData>;

export type MainRendererRenderAnimationContext = ExtensionRenderStateContext<MainRendererData>;

export type MainRendererRenderVisualsContext = ExtensionRenderVisualsContext<MainRendererData>;

export enum DirtyLayer {
	Board = 1, // 1 << 0,
	Coordinates = 2, // 1 << 1,
	Pieces = 4, // 1 << 2,
	Drag = 8, // 1 << 3,
	All = Board | Coordinates | Pieces | Drag
}
