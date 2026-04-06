import {
	ALL_EXTENSION_SLOTS,
	ExtensionAnimationSession,
	ExtensionAnimationStatus,
	ExtensionRecordInternal,
	ExtensionRecordInternalDraft,
	ExtensionSlotSvgRoots,
	RenderStateFrameSnapshot
} from '../extensions/types';
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

export interface ExtensionAnimationSessionRenderInternal extends ExtensionAnimationSession {
	setStatus(status: ExtensionAnimationStatus): void;
	readonly publicSession: ExtensionAnimationSession;
}

export interface ExtensionAnimationControllerInternal {
	readonly sessions: Map<string, ExtensionAnimationSessionRenderInternal>;
}

export interface RenderInternal {
	previouslyRendered: RenderStateFrameSnapshot | null;
	readonly scheduler: Scheduler;
	readonly svgRoots: SvgRoots;
	// readonly animator: Animator;
	readonly extensions: Map<string, ExtensionRecordInternal>;
}

export interface RenderInitOptions {
	doc: Document;
	extensionsDraft: ReadonlyMap<string, ExtensionRecordInternalDraft>;
}

export interface RenderInitOptionsInternal extends RenderInitOptions {
	performRender: () => void;
}

export type RenderStateRequest = RenderStateFrameSnapshot;

export type RenderAnimationRequest = RenderStateRequest;

export type RenderVisualsRequest = RenderStateRequest;

export interface Render {
	readonly extensions: ReadonlyMap<string, ExtensionRecordInternal>;
	requestRenderState(request: RenderStateRequest): void;
	requestRenderAnimation(request: RenderAnimationRequest): void;
	requestRenderVisuals(request: RenderVisualsRequest): void;
}
