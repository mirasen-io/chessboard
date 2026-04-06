import {
	ALL_EXTENSION_SLOTS,
	ExtensionAnimationSessionInternalSurface,
	ExtensionAnimationStatus,
	ExtensionRecordInternal,
	ExtensionRecordInternalDraft,
	ExtensionRenderStateContextCommonBase,
	ExtensionSlotSvgRoots,
	RenderStateFrameSnapshot
} from '../extensions/types';
import { BoardRuntimeReadonlyMutationSession } from '../runtime/mutation/types';
import { VisualsStateSnapshot } from '../state/visuals/types';
import { Scheduler } from './scheduler/types';

export interface SvgRoots extends ExtensionSlotSvgRoots<typeof ALL_EXTENSION_SLOTS> {
	readonly svgRoot: SVGSVGElement;
	readonly defs: SVGDefsElement;
}

export interface ExtensionInvalidationStateInternal {
	dirtyLayers: number; // bitfield of Layer values
}

export interface ExtensionAnimationSessionInternal {
	id: string;
	startTime: DOMHighResTimeStamp;
	duration: DOMHighResTimeStamp;
	data: unknown;
	status: ExtensionAnimationStatus;
}

export interface ExtensionAnimationControllerInternal {
	readonly sessions: Map<string, ExtensionAnimationSessionInternalSurface>;
}

export interface RenderInternal {
	lastRendered: ExtensionRenderStateContextCommonBase | null;
	readonly scheduler: Scheduler;
	readonly svgRoots: SvgRoots;
	// readonly animator: Animator;
	readonly extensions: Map<string, ExtensionRecordInternal>;
	readonly callbacks: RenderInitOptionsCallbacks;
}

export interface RenderStateRequest {
	current: RenderStateFrameSnapshot;
	mutation: BoardRuntimeReadonlyMutationSession;
}

export interface RenderVisualsRequest {
	previous: VisualsStateSnapshot | null;
	mutation: BoardRuntimeReadonlyMutationSession;
	current: VisualsStateSnapshot;
}

export type RenderAnimationRequest = true;

export interface RenderInitOptionsCallbacks {
	renderedState: (
		request: RenderStateRequest,
		lastRendered: ExtensionRenderStateContextCommonBase
	) => void;
	renderedVisuals: (request: RenderVisualsRequest) => void;
}

export interface RenderInitOptions {
	doc: Document;
	extensionsDraft: ReadonlyMap<string, ExtensionRecordInternalDraft>;
	callbacks: RenderInitOptionsCallbacks;
}

export interface RenderInitOptionsInternal extends RenderInitOptions {
	performRender: () => void;
}

export interface Render {
	readonly extensions: ReadonlyMap<string, ExtensionRecordInternal>;
	requestRenderState(request: RenderStateRequest): void;
	requestRenderAnimation(request: RenderAnimationRequest): void;
	requestRenderVisuals(request: RenderVisualsRequest): void;
}
