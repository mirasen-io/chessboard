import {
	ExtensionDefinition,
	ExtensionInstance,
	ExtensionInstanceMountOptions,
	ExtensionOnUpdateStateContext,
	ExtensionRenderStateContext,
	ExtensionRenderVisualsContext,
	ExtensionSlotSvgRoots
} from '../../types';
import { PieceUrls } from '../assets';
import { SvgRendererBoardInitOptions } from '../board/types';

export interface SvgRendererInitOptions {
	board?: SvgRendererBoardInitOptions;
	pieceUrls?: PieceUrls;
}

export const EXTENSION_SLOTS = ['board', 'coordinates', 'pieces', 'animation', 'drag'] as const;
export const EXTENSION_ID = 'main-renderer' as const;

export type SvgRendererMountOptions = ExtensionInstanceMountOptions<typeof EXTENSION_SLOTS>;
export type SvgRendererSlotRoots = ExtensionSlotSvgRoots<typeof EXTENSION_SLOTS>;

export type SvgRendererDefinition = ExtensionDefinition<
	typeof EXTENSION_ID,
	typeof EXTENSION_SLOTS,
	never,
	void
>;

export type SvgRendererInstance = ExtensionInstance<
	typeof EXTENSION_ID,
	typeof EXTENSION_SLOTS,
	never,
	void
>;

export type SvgRendererData = void;

export type SvgRendererOnUpdateContext = ExtensionOnUpdateStateContext<SvgRendererData>;

export type SvgRendererRenderStateContext = ExtensionRenderStateContext<SvgRendererData>;

export type SvgRendererRenderAnimationContext = ExtensionRenderStateContext<SvgRendererData>;

export type SvgRendererRenderVisualsContext = ExtensionRenderVisualsContext<SvgRendererData>;

export enum DirtyLayer {
	Board = 1, // 1 << 0,
	Coordinates = 2, // 1 << 1,
	Pieces = 4, // 1 << 2,
	Drag = 8, // 1 << 3,
	All = Board | Coordinates | Pieces | Drag
}
