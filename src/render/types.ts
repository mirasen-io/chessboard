import {
	ALL_EXTENSION_SLOTS,
	ExtensionAllocatedSlotsInternal,
	ExtensionSlotSvgRoots
} from '../extensions/types/basic/mount.js';
import { RenderFrameSnapshot } from '../extensions/types/basic/render.js';
import { TransientInput } from '../extensions/types/basic/transient-visuals.js';
import {
	ExtensionSystemExtensionRecord,
	ExtensionSystemSharedDataForRenderSystem
} from '../extensions/types/main.js';
import { Scheduler } from './scheduler/types.js';

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

export interface RenderSystemInternal {
	container: HTMLElement | null;
	currentFrame: RenderFrameSnapshot | null;
	readonly scheduler: Scheduler;
	readonly svgRoots: SvgRoots;
	readonly extensions: Map<string, RenderExtensionRecord>;
	readonly transientVisualsSubscribers: ReadonlySet<string>;
}

export interface RenderSystemInitOptions {
	doc: Document;
	sharedDataFromExtensionSystem: ExtensionSystemSharedDataForRenderSystem;
}

export interface RenderSystemInitOptionsInternal extends RenderSystemInitOptions {
	performRender: () => void;
}

export interface RenderSystem {
	readonly extensions: ReadonlyMap<string, RenderExtensionRecord>;
	requestRender(request?: RenderFrameSnapshot): void;
	requestRenderAnimation(): void;
	requestRenderVisuals(request: TransientInput): void;

	// Lifecycle methods
	mount(element: HTMLElement): void;
	unmount(): void;
	readonly isMounted: boolean;
	readonly container: HTMLElement | null;
}
