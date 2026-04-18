import { Square } from '../../../state/board/types/internal';
import { ScenePoint } from '../basic/transient-visuals';

interface SceneEventBase {
	readonly defaultPrevented: boolean;
	preventDefault(): void;
}

export interface ScenePointerEvent extends SceneEventBase {
	// DOM part
	readonly type: 'pointerdown' | 'pointermove' | 'pointerup' | 'pointercancel' | 'pointerleave';
	readonly pointerId: number;
	readonly isPrimary: boolean;
	readonly button: number;
	readonly buttons: number;
	readonly ctrlKey: boolean;
	readonly altKey: boolean;
	readonly shiftKey: boolean;
	readonly metaKey: boolean;
	// Scene part
	readonly rawPoint: ScenePoint | null; // null if geometry unavailable
	readonly clampedPoint: ScenePoint | null; // null if geometry unavailable
	readonly target: Square | null;
}

export type ScenePointerEventType = ScenePointerEvent['type'];
export const SCENE_POINTER_EVENT_TYPES: ScenePointerEventType[] = [
	'pointerdown',
	'pointermove',
	'pointerup',
	'pointercancel',
	'pointerleave'
];

export interface SceneKeyboardEvent extends SceneEventBase {
	readonly type: 'keydown' | 'keyup';
	// DOM part
	readonly key: string;
	readonly repeat: boolean;
	readonly ctrlKey: boolean;
	readonly altKey: boolean;
	readonly shiftKey: boolean;
	readonly metaKey: boolean;
}

export type SceneEvent = ScenePointerEvent | SceneKeyboardEvent;

export type SceneEventType = SceneEvent['type'];
