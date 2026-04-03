import { PartialDeep } from 'type-fest';
import { ExtensionSlotName } from '../../extensions/types';
import { AnimationRenderContext, SvgRendererAnimation } from './animation/types';
import { BoardRenderContext, RendererBoardConfig, SvgRendererBoard } from './board/types';
import { DragRenderContext, SvgRendererDrag } from './drag/types';

export interface SvgRendererOptions {
	board?: PartialDeep<RendererBoardConfig>;
}

export type ExtensionSlots = Partial<Record<ExtensionSlotName, SVGGElement>>;

export interface SvgRendererInternals {
	container: HTMLElement | null;
	svgRoot: SVGSVGElement;
	readonly board: SvgRendererBoard;
	readonly drag: SvgRendererDrag;
	readonly animation: SvgRendererAnimation;
	extensionSlots: Map<string, ExtensionSlots>;
}

export interface SvgRenderer {
	mount(container: HTMLElement): void;
	unmount(): void;
	renderBoard(context: BoardRenderContext): void;
	renderDrag(context: DragRenderContext): void;
	renderAnimations(context: AnimationRenderContext): void;
	allocateExtensionSlots(
		extensionId: string,
		slotNames: readonly ExtensionSlotName[]
	): ExtensionSlots;
	removeExtensionSlots(extensionId: string): void;
}
