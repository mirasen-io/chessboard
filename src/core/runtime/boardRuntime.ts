/**
 * Internal runtime/composition layer.
 * Wires board state, view state, interaction state, invalidation, scheduler, and renderer with
 * mount-time DOM measurement and resize observation.
 *
 * Purpose:
 * - Internal lifecycle orchestrator (not public API)
 * - Owns board state, view state, interaction state, invalidation state, scheduler, mount state,
 *   and host-derived board size
 * - Delegates rendering to Renderer via Scheduler
 * - Supports pre-mount state mutations
 * - Recreates immutable geometry on orientation change
 * - Observes host resize and refreshes geometry accordingly
 */

import { makeRenderGeometry } from '../renderer/geometry';
import type { Renderer, RenderGeometry } from '../renderer/types';
import {
	createInvalidationState,
	createInvalidationWriter,
	getInvalidationSnapshot
} from '../scheduler/invalidationState';
import { clearDirty, markDirtyLayer } from '../scheduler/reducers';
import { createScheduler, type Scheduler } from '../scheduler/scheduler';
import { DirtyLayer } from '../scheduler/types';
import {
	MoveOptions,
	move as moveReducer,
	setBoardPosition as setBoardPositionReducer,
	setTurn as setTurnReducer
} from '../state/boardReducers';
import {
	type BoardStateInitOptions,
	createBoardState,
	getBoardStateSnapshot
} from '../state/boardState';
import type {
	BoardStateInternal,
	ColorInput,
	Move,
	MoveInput,
	PositionInput,
	Square,
	SquareInput
} from '../state/boardTypes';
import {
	clearInteraction as clearInteractionReducer,
	setSelectedSquare as setSelectedSquareReducer
} from '../state/interactionReducers';
import { createInteractionState } from '../state/interactionState';
import type { InteractionStateInternal } from '../state/interactionTypes';
import {
	setMovability as setMovabilityReducer,
	setOrientation as setOrientationReducer
} from '../state/viewReducers';
import { createViewState, ViewStateInitOptions } from '../state/viewState';
import type { Movability, ViewStateInternal } from '../state/viewTypes';
import {
	canStartMoveFrom as canStartMoveFromHelper,
	isMoveAttemptAllowed as isMoveAttemptAllowedHelper
} from './movability';

export interface BoardRuntimeInitOptions {
	renderer: Renderer;
	board?: BoardStateInitOptions;
	view?: ViewStateInitOptions;
}

/**
 * Public interface for the internal runtime.
 * Orchestrates board state, view state, interaction state, and invalidation.
 * Board/view/interaction reducers own mutation logic; the runtime coordinates scheduling
 * and geometry updates in response to state changes.
 */
export interface BoardRuntime {
	// Lifecycle
	mount(container: HTMLElement): void;
	destroy(): void;
	// Board state reducers
	setBoardPosition(input: PositionInput): boolean;
	setTurn(c: ColorInput): boolean;
	move(move: MoveInput, opts?: MoveOptions): Move;
	// View state reducers
	setOrientation(input: ColorInput): boolean;
	setMovability(m: Movability): boolean;
	// Interaction state reducers
	select(sq: SquareInput | null): boolean;
	// Helpers
	canStartMoveFrom(from: Square): boolean;
	isMoveAttemptAllowed(from: Square, to: Square): boolean;
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
export function createBoardRuntime(opts: BoardRuntimeInitOptions): BoardRuntime {
	const { renderer, board: boardOpts, view: viewOpts } = opts;

	// Internal state
	const boardState: BoardStateInternal = createBoardState(boardOpts);
	const viewState: ViewStateInternal = createViewState(viewOpts);
	const interactionState: InteractionStateInternal = createInteractionState();
	const invalidationState = createInvalidationState();
	const invalidationWriter = createInvalidationWriter(invalidationState);
	let boardSize: number | null = null;
	let geometry: RenderGeometry | null = null;
	let mounted = false;
	let host: HTMLElement | null = null;
	let resizeObserver: ResizeObserver | null = null;
	let destroyed = false;

	// Scheduler with render callback
	const scheduler: Scheduler = createScheduler({
		render: (boardSnapshot, invalidationSnapshot) => {
			// Guard: only render if geometry exists (implies mounted)
			if (geometry) {
				renderer.render({ board: boardSnapshot, invalidation: invalidationSnapshot, geometry });
			}
		},
		getBoardSnapshot: () => getBoardStateSnapshot(boardState),
		getInvalidationSnapshot: () => getInvalidationSnapshot(invalidationState),
		clearDirty: () => clearDirty(invalidationState)
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
		geometry = makeRenderGeometry(boardSize, viewState.orientation);
		markDirtyLayer(invalidationState, DirtyLayer.Board | DirtyLayer.Pieces);
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
			geometry = makeRenderGeometry(boardSize, viewState.orientation);
			mounted = true;

			// Start observing resize
			resizeObserver = new ResizeObserver(() => refreshGeometry());
			resizeObserver.observe(container);

			// Mark initial redraw
			markDirtyLayer(invalidationState, DirtyLayer.All);
			// TODO: extension hooks here as well??

			// Schedule initial render
			scheduler.schedule();
		},

		setBoardPosition(input: PositionInput): boolean {
			const changed = setBoardPositionReducer(boardState, invalidationWriter, input);
			if (changed) {
				clearInteractionReducer(interactionState); // clear all interaction state on new position
				// TODO: extension hooks to process the change
				if (mounted) {
					scheduler.schedule();
				}
			}
			return changed;
		},

		setTurn(c: ColorInput): boolean {
			const changed = setTurnReducer(boardState, c);
			if (changed) {
				// TODO: extension hooks to process the change
			}
			return changed;
		},

		move(move: MoveInput, opts?: MoveOptions): Move {
			const appliedMove = moveReducer(boardState, invalidationWriter, move, opts);
			// TODO: extension hooks to process the change
			if (mounted) {
				scheduler.schedule();
			}
			return appliedMove;
		},

		setOrientation(input: ColorInput): boolean {
			const changed = setOrientationReducer(viewState, invalidationWriter, input);
			if (changed) {
				// TODO: extension hooks to process the change
				if (mounted) {
					// Recreate immutable geometry with new orientation
					geometry = makeRenderGeometry(boardSize!, viewState.orientation);
					scheduler.schedule();
				}
			}

			return changed;
		},

		select(sq: SquareInput | null): boolean {
			const changed = setSelectedSquareReducer(interactionState, sq);
			if (changed) {
				// TODO: extension hooks here to process the change as well
			}
			return changed;
		},

		setMovability(m: Movability): boolean {
			const changed = setMovabilityReducer(viewState, m);
			if (changed) {
				// TODO: run extension hooks here, cause we don't update anything visual directly from this reducer
				// View state changed, but core renderer has no direct visual work for movability.
				// Future extension update hooks should run from here.
			}
			return changed;
		},

		canStartMoveFrom(from: Square): boolean {
			return canStartMoveFromHelper(boardState, viewState, from);
		},

		isMoveAttemptAllowed(from: Square, to: Square): boolean {
			return isMoveAttemptAllowedHelper(boardState, viewState, from, to);
		},

		destroy(): void {
			if (destroyed) return; // idempotent

			destroyed = true;
			mounted = false;

			if (resizeObserver) {
				resizeObserver.disconnect();
				resizeObserver = null;
			}

			scheduler.destroy();
			renderer.unmount();

			host = null;
		}
	};
}
