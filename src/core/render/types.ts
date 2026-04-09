import {
	ALL_EXTENSION_SLOTS,
	ExtensionAllocatedSlotsInternal,
	ExtensionSlotSvgRoots,
	ExtensionSystemExtensionRecord,
	RenderStateFrameSnapshot
} from '../extensions/types';
import { VisualsStateSnapshot } from '../state/visuals/types';
import { Scheduler } from './scheduler/types';

export interface SvgRoots extends ExtensionSlotSvgRoots<typeof ALL_EXTENSION_SLOTS> {
	readonly svgRoot: SVGSVGElement;
	readonly defs: SVGDefsElement;
}

export interface RenderExtensionRecordRender {
	readonly slots: ExtensionAllocatedSlotsInternal;
}

export interface RenderExtensionRecord {
	readonly id: string;
	readonly extension: ExtensionSystemExtensionRecord;
	readonly render: RenderExtensionRecordRender;
}

export interface RenderInternal {
	container: HTMLElement | null;
	lastRendered: RenderStateFrameSnapshot | null;
	readonly scheduler: Scheduler;
	readonly svgRoots: SvgRoots;
	// readonly animator: Animator;
	readonly extensions: Map<string, RenderExtensionRecord>;
}

export interface RenderInitOptions {
	doc: Document;
	extensions: ReadonlyMap<string, ExtensionSystemExtensionRecord>;
}

export interface RenderInitOptionsInternal extends RenderInitOptions {
	performRender: () => void;
}

export interface Render {
	readonly extensions: ReadonlyMap<string, RenderExtensionRecord>;
	requestRenderState(request: RenderStateFrameSnapshot): void;
	requestRenderAnimation(): void;
	requestRenderVisuals(request: VisualsStateSnapshot): void;

	// Lifecycle methods
	mount(element: HTMLElement): void;
	unmount(): void;
	readonly isMounted: boolean;
	readonly container: HTMLElement | null;
}
