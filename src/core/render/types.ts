import {
	ALL_EXTENSION_SLOTS,
	AnyExtensionDefinition,
	AnyExtensionInstance,
	ExtensionAnimationController,
	ExtensionAnimationSession,
	ExtensionAnimationStatus,
	ExtensionInvalidationState,
	ExtensionSlotName,
	ExtensionSlotSvgRoots,
	MainRendererExtensionDefinition,
	RenderStateFrameSnapshot
} from '../extensions/types';
import { Scheduler } from './scheduler/types';

export interface SvgRoots extends ExtensionSlotSvgRoots<typeof ALL_EXTENSION_SLOTS> {
	readonly svgRoot: SVGSVGElement;
	readonly defs: SVGDefsElement;
}

export type ExtensionAllocatedSlots = ExtensionSlotSvgRoots<readonly ExtensionSlotName[]>;

export interface RenderExtensionData {
	previous: unknown | null;
	current: unknown;
}

export interface ExtensionInvalidationStateInternal {
	dirtyLayers: number; // bitfield of Layer values
}

export interface ExtensionAnimationControllerInternal {
	readonly sessions: Map<string, ExtensionAnimationSessionInternal>;
}

export interface ExtensionAnimationSessionInternal extends ExtensionAnimationSession {
	setStatus(status: ExtensionAnimationStatus): void;
}

export interface RenderExtensionInternal {
	readonly instance: AnyExtensionInstance;
	readonly slots: Readonly<ExtensionAllocatedSlots>;
	readonly data: RenderExtensionData;
	readonly invalidation: ExtensionInvalidationState;
	readonly animation: ExtensionAnimationController;
}

export interface RenderInternal {
	previouslyRendered: RenderStateFrameSnapshot | null;
	readonly scheduler: Scheduler;
	readonly svgRoots: SvgRoots;
	// readonly animator: Animator;
	readonly extensions: Map<string, RenderExtensionInternal>;
}

// Our main renderer is now a first-party extension
// We want that first instance of that array would always be the one with id 'main-renderer'
export type RenderExtensionDefinitions = [
	mainRenderer: MainRendererExtensionDefinition,
	...otherExtensions: AnyExtensionDefinition[]
];
export interface RenderInitOptions {
	doc: Document;
	extensions: RenderExtensionDefinitions;
}

export interface RenderInitOpptionsInternal extends RenderInitOptions {
	performRenderState: () => void;
}

export type RenderStateRequest = RenderStateFrameSnapshot;

export type RenderAnimationRequest = RenderStateRequest;

export type RenderVisualsRequest = RenderStateRequest;

export interface Render {
	requestRenderState(request: RenderStateRequest): void;
	requestRenderAnimation(request: RenderAnimationRequest): void;
	requestRenderVisuals(request: RenderVisualsRequest): void;
}
