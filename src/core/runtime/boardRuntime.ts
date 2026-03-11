/**
 * Internal runtime/composition layer (Phase 2 Steps 1-2).
 * Wires state + scheduler + renderer with mount-time DOM measurement and resize observation.
 *
 * Purpose:
 * - Internal lifecycle orchestrator (not public API)
 * - Owns InternalState, Scheduler, mount state, and host-derived board size
 * - Delegates rendering to Renderer via Scheduler
 * - Supports pre-mount state mutations
 * - Recreates immutable geometry on orientation change
 * - Observes host resize and refreshes geometry accordingly
 *
 * Not included in this step:
 * - Public Chessboard facade/class
 * - Input handling, drag lifecycle
 * - Event bus integration
 * - Extension APIs
 * - Policy integration
 */

import { makeRenderGeometry } from '../renderer/geometry';
import type { Renderer, RenderGeometry } from '../renderer/types';
import { computeInvalidation } from '../scheduler/invalidation';
import { createScheduler, type Scheduler } from '../scheduler/scheduler';
import { createInitialState, getSnapshot, type InternalState } from '../state/boardState';
import { clearDirty, markDirtyLayer, setOrientation, setPosition } from '../state/reducers';
import { DirtyLayer, type ColorInput, type PositionInput } from '../state/types';

export interface BoardRuntimeOptions {
	renderer: Renderer;
	position?: PositionInput;
	orientation?: ColorInput;
}

export interface BoardRuntime {
	mount(container: HTMLElement): void;
	setPosition(input: PositionInput): void;
	setOrientation(input: ColorInput): void;
	destroy(): void;
}

/**
 * Measure board size from container (square board fits within host).
 */
function measureBoardSize(container: HTMLElement): number {
	return Math.min(container.clientWidth, container.clientHeight);
}

/**
 * Create a minimal internal runtime that orchestrates state + scheduler + renderer.
 *
 * Lifecycle:
 * - Pre-mount: state mutations allowed, no rendering
 * - Mount: measure container, create geometry, mark initial dirty, schedule render, observe resize
 * - Post-mount: state mutations schedule renders; host resize refreshes geometry
 * - Destroy: disconnect resize observer, prevent further resize effects, reject remount
 *
 * @param opts Runtime options
 * @returns BoardRuntime instance
 */
export function createBoardRuntime(opts: BoardRuntimeOptions): BoardRuntime {
	const { renderer, position, orientation } = opts;

	// Internal state
	const state: InternalState = createInitialState({ position, orientation });
	let boardSize: number | null = null;
	let geometry: RenderGeometry | null = null;
	let mounted = false;
	let host: HTMLElement | null = null;
	let resizeObserver: ResizeObserver | null = null;
	let destroyed = false;

	// Scheduler with render callback
	const scheduler: Scheduler = createScheduler({
		render: (snapshot, invalidation) => {
			// Guard: only render if geometry exists (implies mounted)
			if (geometry) {
				renderer.render(snapshot, geometry, invalidation);
			}
		},
		getSnapshot: () => getSnapshot(state),
		getInvalidation: () => computeInvalidation(state),
		clearDirty: () => clearDirty(state)
	});

	/**
	 * Refresh geometry from current host size and orientation.
	 * Called by ResizeObserver when host size changes.
	 */
	function refreshGeometry(): void {
		if (!host || !mounted || destroyed) return;

		const newSize = measureBoardSize(host);
		if (newSize <= 0) return; // ignore non-positive during resize
		if (newSize === boardSize) return; // no-op if unchanged

		boardSize = newSize;
		geometry = makeRenderGeometry(boardSize, state.orientation);
		markDirtyLayer(state, DirtyLayer.Board | DirtyLayer.Pieces);
		scheduler.schedule();
	}

	return {
		mount(container: HTMLElement): void {
			if (destroyed) throw new Error('BoardRuntime: cannot mount after destroy');
			if (mounted) throw new Error('BoardRuntime: already mounted');

			const measuredSize = measureBoardSize(container);
			if (measuredSize <= 0) {
				throw new Error(
					`BoardRuntime: invalid container size (width=${container.clientWidth}, height=${container.clientHeight})`
				);
			}

			renderer.mount(container);

			host = container;
			boardSize = measuredSize;
			geometry = makeRenderGeometry(boardSize, state.orientation);
			mounted = true;

			// Start observing resize
			resizeObserver = new ResizeObserver(() => refreshGeometry());
			resizeObserver.observe(container);

			// Mark initial redraw (Board + Pieces only)
			markDirtyLayer(state, DirtyLayer.Board | DirtyLayer.Pieces);
			// Schedule initial render
			scheduler.schedule();
		},

		setPosition(input: PositionInput): void {
			// Mutate state via reducer
			setPosition(state, input);

			// Schedule render if mounted
			if (mounted) {
				scheduler.schedule();
			}
		},

		setOrientation(input: ColorInput): void {
			// Mutate state via reducer
			setOrientation(state, input);

			// If mounted, recreate geometry and schedule render
			if (mounted) {
				// Recreate immutable geometry with new orientation
				geometry = makeRenderGeometry(boardSize!, state.orientation);
				scheduler.schedule();
			}
		},

		destroy(): void {
			if (destroyed) return; // idempotent

			destroyed = true;
			mounted = false;

			if (resizeObserver) {
				resizeObserver.disconnect();
				resizeObserver = null;
			}

			host = null;
		}
	};
}
