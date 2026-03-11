/**
 * Internal runtime/composition layer (Phase 2 Step 1).
 * Wires state + scheduler + renderer with mount-time DOM measurement.
 *
 * Purpose:
 * - Internal lifecycle orchestrator (not public API)
 * - Owns InternalState, Scheduler, mount state, and host-derived board size
 * - Delegates rendering to Renderer via Scheduler
 * - Supports pre-mount state mutations
 * - Recreates immutable geometry on orientation change
 *
 * Not included in this step:
 * - Public Chessboard facade/class
 * - ResizeObserver or responsive reflow
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
}

/**
 * Create a minimal internal runtime that orchestrates state + scheduler + renderer.
 *
 * Lifecycle:
 * - Pre-mount: state mutations allowed, no rendering
 * - Mount: measure container, create geometry, mark initial dirty, schedule render
 * - Post-mount: state mutations schedule renders
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

	return {
		mount(container: HTMLElement): void {
			if (mounted) throw new Error('BoardRuntime: already mounted');

			// Measure container (square board fits within host)
			const measuredSize = Math.min(container.clientWidth, container.clientHeight);
			if (measuredSize <= 0) {
				throw new Error(
					`BoardRuntime: invalid container size (width=${container.clientWidth}, height=${container.clientHeight})`
				);
			}

			renderer.mount(container);

			boardSize = measuredSize;
			// Create immutable geometry from measured size and current orientation
			geometry = makeRenderGeometry(boardSize, state.orientation);
			// Mark mounted
			mounted = true;
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
		}
	};
}
