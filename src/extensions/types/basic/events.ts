import { Square } from '../../../state/board/types/internal.js';
import { ScenePoint } from '../basic/transient-visuals.js';

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
		| 'pointerup';
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
	'pointerup'
]);

export type SceneEvent = ScenePointerEvent;
