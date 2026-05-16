import type { Square } from '../../../state/board/types/internal.js';
import type { ScenePoint } from '../basic/transient-visuals.js';

const ALL_SCENE_POINTER_EVENT_TYPES_ARRAY = [
	'pointercancel',
	'pointerdown',
	'pointerenter',
	'pointerleave',
	'pointermove',
	'pointerout',
	'pointerover',
	'pointerrawupdate',
	'pointerup',
	'contextmenu',
	'lostpointercapture'
] as const;

export type ScenePointerEventType = (typeof ALL_SCENE_POINTER_EVENT_TYPES_ARRAY)[number];

export const ALL_SCENE_POINTER_EVENT_TYPES: ReadonlySet<string> = new Set(
	ALL_SCENE_POINTER_EVENT_TYPES_ARRAY
);

export interface ScenePointerEvent {
	// DOM part
	readonly type: ScenePointerEventType;
	// Points in scene coordinates
	readonly point: ScenePoint;
	readonly clampedPoint: ScenePoint;
	// Clamped to board rect in scene coordinates if geometry is available
	readonly boardClampedPoint: ScenePoint | null;
	readonly targetSquare: Square | null;
}

export type SceneEvent = ScenePointerEvent;

export type RuntimeInteractionActionStartLiftedDrag = {
	type: 'startLiftedDrag';
	source: Square;
	target: Square;
	startButton: number;
};

export type RuntimeInteractionActionStartReleaseTargetingDrag = {
	type: 'startReleaseTargetingDrag';
	source: Square;
	target: Square;
	startButton: number;
};

export type RuntimeInteractionActionCompleteCoreDrag = {
	type: 'completeCoreDragTo';
	target: Square;
};

export type RuntimeInteractionActionCompleteExtensionDrag = {
	type: 'completeExtensionDrag';
	target: Square | null;
};

export type RuntimeInteractionActionUpdateDragSessionCurrentTarget = {
	type: 'updateDragSessionCurrentTarget';
	target: Square | null;
};

export type RuntimeInteractionActionCancelActiveInteraction = {
	type: 'cancelActiveInteraction';
};

export type RuntimeInteractionActionCancelInteraction = {
	type: 'cancelInteraction';
};

export type RuntimeInteractionAction =
	| RuntimeInteractionActionStartLiftedDrag
	| RuntimeInteractionActionStartReleaseTargetingDrag
	| RuntimeInteractionActionCompleteCoreDrag
	| RuntimeInteractionActionCompleteExtensionDrag
	| RuntimeInteractionActionUpdateDragSessionCurrentTarget
	| RuntimeInteractionActionCancelActiveInteraction
	| RuntimeInteractionActionCancelInteraction;
