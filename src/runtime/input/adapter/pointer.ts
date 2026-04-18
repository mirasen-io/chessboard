import assert from '@ktarmyshov/assert';
import {
	SCENE_POINTER_EVENT_TYPES,
	ScenePointerEvent,
	ScenePointerEventType
} from '../../../extensions/types/basic/events';
import { ScenePoint } from '../../../extensions/types/basic/transient-visuals';
import { Square } from '../../../state/board/types/internal';
import { clampBoardPoint, mapBoardPointToSquare } from './helpers';
import { InputAdapterInternal } from './types';

const validPointerEventTypes = new Set<string>(SCENE_POINTER_EVENT_TYPES);

export type PointerRelevantEvent = PointerEvent & { type: ScenePointerEventType };

export function isPointerRelevantEvent(e: PointerEvent): e is PointerRelevantEvent {
	return e instanceof PointerEvent && validPointerEventTypes.has(e.type);
}

/** Release capture for the currently tracked pointer and clear tracking state. */
export function releaseCapture(state: InputAdapterInternal): void {
	if (state.activePointerId === null) return;
	if (state.container.hasPointerCapture(state.activePointerId)) {
		state.container.releasePointerCapture(state.activePointerId);
	}
	state.activePointerId = null;
}

interface PointerTarget {
	target: Square | null;
	rawPoint: ScenePoint | null;
	clampedPoint: ScenePoint | null;
}

function resolvePointerTarget(state: InputAdapterInternal, e: PointerEvent): PointerTarget {
	const geometry = state.getGeometry();
	if (!geometry) return { target: null, rawPoint: null, clampedPoint: null };
	const rect = state.container.getBoundingClientRect();
	const x = e.clientX - rect.left;
	const y = e.clientY - rect.top;
	const target = mapBoardPointToSquare(x, y, geometry);
	const point: ScenePoint = { x, y };
	return { target, rawPoint: point, clampedPoint: clampBoardPoint(point, geometry) };
}

function makeBoardPointerEvent(
	e: PointerRelevantEvent,
	pointerTarget: PointerTarget
): ScenePointerEvent {
	assert(
		e.defaultPrevented === false,
		'Expected event to be unhandled before making BoardPointerEvent'
	);
	let defaultPrevented = false;
	return {
		type: e.type,
		// DOM part
		pointerId: e.pointerId,
		isPrimary: e.isPrimary,
		button: e.button,
		buttons: e.buttons,
		ctrlKey: e.ctrlKey,
		altKey: e.altKey,
		shiftKey: e.shiftKey,
		metaKey: e.metaKey,
		// Board part
		rawPoint: pointerTarget.rawPoint,
		clampedPoint: pointerTarget.clampedPoint,
		target: pointerTarget.target,
		// Mechanics
		get defaultPrevented() {
			return defaultPrevented;
		},
		preventDefault() {
			defaultPrevented = true;
		}
	};
}

export function onPointerDown(state: InputAdapterInternal, e: PointerRelevantEvent): void {
	if (!e.isPrimary) return; // ignore non-primary pointers
	if (state.activePointerId !== null) return; // already tracking
	state.activePointerId = e.pointerId;
	state.container.setPointerCapture(e.pointerId);
	const pointerTarget = resolvePointerTarget(state, e);
	const boardEvent = makeBoardPointerEvent(e, pointerTarget);
	e.preventDefault(); // prevent native text selection during drag
	state.controller.onEvent(boardEvent);
}

export function onPointerMove(state: InputAdapterInternal, e: PointerRelevantEvent): void {
	if (e.pointerId !== state.activePointerId) return;
	const pointerTarget = resolvePointerTarget(state, e);
	const boardEvent = makeBoardPointerEvent(e, pointerTarget);
	e.preventDefault(); // prevent native text selection during drag
	state.controller.onEvent(boardEvent);
}

export function onPointerUp(state: InputAdapterInternal, e: PointerRelevantEvent): void {
	if (e.pointerId !== state.activePointerId) return;
	const pointerTarget = resolvePointerTarget(state, e); // resolve before releasing capture
	releaseCapture(state);
	const boardEvent = makeBoardPointerEvent(e, pointerTarget);
	state.controller.onEvent(boardEvent);
}

export function onPointerCancel(state: InputAdapterInternal, e: PointerRelevantEvent): void {
	if (e.pointerId !== state.activePointerId) return;
	const pointerTarget = resolvePointerTarget(state, e); // resolve before releasing capture
	releaseCapture(state);
	const boardEvent = makeBoardPointerEvent(e, pointerTarget);
	state.controller.onEvent(boardEvent);
}

export function onPointerLeave(state: InputAdapterInternal, e: PointerRelevantEvent): void {
	if (e.pointerId !== state.activePointerId) return;
	const pointerTarget = resolvePointerTarget(state, e);
	const boardEvent = makeBoardPointerEvent(e, pointerTarget);
	state.controller.onEvent(boardEvent);
}
