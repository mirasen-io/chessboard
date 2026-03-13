/**
 * UI input → controller bridge.
 *
 * Translates DOM Pointer Events into board-local square coordinates and
 * forwards them to the InteractionController. All DOM concerns are
 * encapsulated here; the controller never sees raw events.
 *
 * Coordinate resolution:
 *   1. Get element bounding rect (viewport-relative).
 *   2. Subtract rect origin → element-local coordinates.
 *   3. Pass (x, y) to mapBoardPointToSquare — returns null if outside [0, boardSize).
 *
 * Pointer tracking:
 *   - Only the primary pointer is tracked (e.isPrimary).
 *   - Only left-button pointer-down starts an interaction (e.button === 0).
 *   - One active pointer id is maintained; unrelated pointers are ignored.
 *   - Pointer capture is set on down so move/up/cancel continue to route
 *     correctly after the pointer leaves the element.
 */
import type { RenderGeometry } from '../renderer/types';
import type { InteractionController } from './interactionController';
import { mapBoardPointToSquare } from './squareMapping';

export interface InputAdapterOptions {
	element: HTMLElement;
	/** Returns the current render geometry, or null if not yet available. */
	getGeometry: () => RenderGeometry | null;
	controller: InteractionController;
}

export interface InputAdapter {
	/** Unbind all event listeners and release any active pointer capture. */
	destroy(): void;
}

/**
 * Create an input adapter that binds Pointer Events on a host element and
 * routes them through square-coordinate resolution into the InteractionController.
 *
 * Lifecycle: call destroy() to unbind all listeners and release capture state.
 */
export function createInputAdapter({
	element,
	getGeometry,
	controller
}: InputAdapterOptions): InputAdapter {
	/** The pointer id currently being tracked, or null when idle. */
	let activePointerId: number | null = null;

	function resolveSquare(e: PointerEvent) {
		const geometry = getGeometry();
		if (!geometry) return null;
		const rect = element.getBoundingClientRect();
		return mapBoardPointToSquare(e.clientX - rect.left, e.clientY - rect.top, geometry);
	}

	/** Release capture for the currently tracked pointer and clear tracking state. */
	function releaseCapture(): void {
		if (activePointerId === null) return;
		if (element.hasPointerCapture(activePointerId)) {
			element.releasePointerCapture(activePointerId);
		}
		activePointerId = null;
	}

	function onPointerDown(e: PointerEvent): void {
		if (!e.isPrimary) return; // ignore non-primary pointers
		if (e.button !== 0) return; // ignore non-left-button
		if (activePointerId !== null) return; // already tracking
		const sq = resolveSquare(e);
		if (sq === null) return; // off-board press: nothing to start
		activePointerId = e.pointerId;
		element.setPointerCapture(e.pointerId);
		controller.onPointerDown(sq);
	}

	function onPointerMove(e: PointerEvent): void {
		if (e.pointerId !== activePointerId) return;
		controller.onPointerMove(resolveSquare(e));
	}

	function onPointerUp(e: PointerEvent): void {
		if (e.pointerId !== activePointerId) return;
		const sq = resolveSquare(e); // resolve before releasing capture
		releaseCapture();
		controller.onPointerUp(sq);
	}

	function onPointerCancel(e: PointerEvent): void {
		if (e.pointerId !== activePointerId) return;
		releaseCapture();
		controller.onPointerCancel();
	}

	/**
	 * On pointer leave, route as an off-board move rather than cancel.
	 * This keeps the interaction alive so the user can drag back onto the board.
	 * With capture active the element continues to receive pointermove events,
	 * so this handler provides an immediate null signal on leave and also covers
	 * the non-captured case.
	 */
	function onPointerLeave(e: PointerEvent): void {
		if (e.pointerId !== activePointerId) return;
		controller.onPointerMove(null);
	}

	element.addEventListener('pointerdown', onPointerDown);
	element.addEventListener('pointermove', onPointerMove);
	element.addEventListener('pointerup', onPointerUp);
	element.addEventListener('pointercancel', onPointerCancel);
	element.addEventListener('pointerleave', onPointerLeave);

	return {
		destroy(): void {
			if (activePointerId !== null) {
				releaseCapture();
			}
			element.removeEventListener('pointerdown', onPointerDown);
			element.removeEventListener('pointermove', onPointerMove);
			element.removeEventListener('pointerup', onPointerUp);
			element.removeEventListener('pointercancel', onPointerCancel);
			element.removeEventListener('pointerleave', onPointerLeave);
		}
	};
}
