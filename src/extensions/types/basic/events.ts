import type { Square } from '../../../state/board/types/internal.js';
import type { ScenePoint } from '../basic/transient-visuals.js';

export interface ScenePointerEvent {
	// DOM part
	readonly type:
		| 'pointercancel'
		| 'pointerdown'
		| 'pointerenter'
		| 'pointerleave'
		| 'pointermove'
		| 'pointerout'
		| 'pointerover'
		| 'pointerrawupdate'
		| 'pointerup'
		| 'contextmenu';
	// Points in scene coordinates
	readonly point: ScenePoint;
	readonly clampedPoint: ScenePoint;
	// Clamped to board rect in scene coordinates if geometry is available
	readonly boardClampedPoint: ScenePoint | null;
	readonly targetSquare: Square | null;
}

export const ALL_SCENE_POINTER_EVENT_TYPES: ReadonlySet<string> = new Set([
	'pointercancel',
	'pointerdown',
	'pointerenter',
	'pointerleave',
	'pointermove',
	'pointerout',
	'pointerover',
	'pointerrawupdate',
	'pointerup',
	'contextmenu'
]);

export type SceneEvent = ScenePointerEvent;

export type RuntimeInteractionActionStartLiftedDrag = {
	type: 'startLiftedDrag';
	source: Square;
	target: Square;
};

export type RuntimeInteractionActionStartReleaseTargetingDrag = {
	type: 'startReleaseTargetingDrag';
	source: Square;
	target: Square;
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
