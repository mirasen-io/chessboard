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

import type { Animator } from '../animation/animator';
import { createAnimator } from '../animation/animator';
import type { AnimationPlan } from '../animation/types';
import type { InputAdapter } from '../input/inputAdapter';
import { createInputAdapter } from '../input/inputAdapter';
import type { InteractionController } from '../input/interactionController';
import { createInteractionController } from '../input/interactionController';
import { makeRenderGeometry } from '../renderer/geometry';
import type { BoardPoint, Renderer, RenderGeometry, TransientVisualState } from '../renderer/types';
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
import { toValidSquare } from '../state/coords';
import {
	clearInteraction as clearInteractionReducer,
	setCurrentTarget as setCurrentTargetReducer,
	setDestinations as setDestinationsReducer,
	setDragSession as setDragSessionReducer,
	setSelectedSquare as setSelectedSquareReducer
} from '../state/interactionReducers';
import { createInteractionState } from '../state/interactionState';
import type { DragSession, InteractionStateInternal } from '../state/interactionTypes';
import {
	setMovability as setMovabilityReducer,
	setOrientation as setOrientationReducer
} from '../state/viewReducers';
import { createViewState, ViewStateInitOptions } from '../state/viewState';
import type { Movability, ViewStateInternal } from '../state/viewTypes';
import {
	canStartMoveFrom as canStartMoveFromHelper,
	getActiveDestinations as getActiveDestinationsHelper,
	isMoveAttemptAllowed as isMoveAttemptAllowedHelper
} from './movability';

/**
 * Curated read-only snapshot for controller-facing consumption.
 * Grouped by origin. Do not expose raw full internal state slices.
 *
 * board: reserved for future curated controller-facing board data. Empty in Phase 3.2.
 * view:  reserved for future curated controller-facing view data.  Empty in Phase 3.2.
 * interaction: the minimal interaction facts the controller needs to decide lifecycle routing.
 */
export interface InteractionSnapshot {
	/** Reserved for future curated controller-facing board data. Empty in Phase 3.2. */
	readonly board: Record<string, never>;
	/** Reserved for future curated controller-facing view data. Empty in Phase 3.2. */
	readonly view: Record<string, never>;
	readonly interaction: {
		readonly selectedSquare: Square | null;
		readonly destinations: readonly Square[] | null;
		readonly currentTarget: Square | null;
		readonly dragSession: { readonly fromSquare: Square } | null;
	};
}

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
	// Interaction — semantic selection transition
	// Synchronized: sets selectedSquare + derives destinations + clears drag/target.
	// Throws if a drag session is active (use cancelInteraction() first).
	// Does NOT check occupancy, color, or legality — "select a square", not "select a piece".
	select(sq: SquareInput | null): boolean;
	// Interaction lifecycle — internal runtime methods (not exported from public API)
	// dragStart: strict lifecycle step — requires selectedSquare === from, throws otherwise.
	// Controller is responsible for calling select(from) before dragStart(from).
	// Accepts initial pointer position to initialize drag visual immediately.
	dragStart(from: Square, point: BoardPoint): boolean;
	// setCurrentTarget: update the current target square during drag or hover.
	setCurrentTarget(target: Square | null): boolean;
	/**
	 * Attempt semantic interaction completion toward the given target square.
	 *
	 * Source is determined by: dragSession.fromSquare ?? selectedSquare.
	 * Returns null if there is no active interaction.
	 *
	 * Legal completion: applies move, clears all interaction, returns Move.
	 *
	 * Illegal completion — outcome depends on the active mode at call time:
	 *   - Lifted-piece mode (dragSession !== null):
	 *       clear dragSession + currentTarget, keep selectedSquare + destinations.
	 *       The piece snaps back; the user can retry by releasing on a different target.
	 *   - Release-targeting mode (dragSession === null, selectedSquare !== null):
	 *       clear all interaction.
	 *       The selection is gone; the user must re-select to try again.
	 */
	dropTo(to: Square | null): Move | null;
	// cancelInteraction: clear transient drag state, keep selection.
	cancelInteraction(): boolean;
	/**
	 * Notify runtime of drag pointer movement for visual updates.
	 * Updates transient visual state and triggers drag-layer invalidation when drag is active.
	 */
	notifyDragMove(point: BoardPoint | null): void;
	// Controller-facing snapshot accessor — curated, read-only, grouped by origin.
	getInteractionSnapshot(): InteractionSnapshot;
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
	// Runtime-owned transient visual state
	const transientVisuals: TransientVisualState = {
		dragPointer: null
	};
	let boardSize: number | null = null;
	let geometry: RenderGeometry | null = null;
	let mounted = false;
	let host: HTMLElement | null = null;
	let resizeObserver: ResizeObserver | null = null;
	let destroyed = false;
	let controller: InteractionController | null = null;
	let inputAdapter: InputAdapter | null = null;
	let animator: Animator | null = null;

	// Scheduler with render callback
	const scheduler: Scheduler = createScheduler({
		render: (boardSnapshot, invalidationSnapshot) => {
			// Guard: only render if geometry exists (implies mounted)
			if (geometry) {
				// Fetch active animation session
				const activeSession = animator?.getActiveSession() ?? null;

				// Compute suppressed piece IDs from animation session and drag state
				const suppressedIds = new Set<number>();
				if (activeSession) {
					for (const track of activeSession.tracks) {
						suppressedIds.add(track.pieceId);
					}
				}
				if (interactionState.dragSession) {
					const dragId = boardSnapshot.ids[interactionState.dragSession.fromSquare];
					if (dragId > 0) {
						suppressedIds.add(dragId);
					}
				}

				// Build pass-specific contexts
				const boardCtx = {
					board: boardSnapshot,
					geometry,
					invalidation: invalidationSnapshot,
					suppressedPieceIds: suppressedIds
				};

				const animationCtx = {
					session: activeSession,
					board: boardSnapshot,
					geometry
				};

				const dragCtx = {
					interaction: {
						selectedSquare: interactionState.selectedSquare,
						destinations: interactionState.destinations,
						currentTarget: interactionState.currentTarget,
						dragSession: interactionState.dragSession
					},
					transientVisuals,
					board: boardSnapshot,
					geometry
				};

				// Call split renderer methods
				renderer.renderBoard(boardCtx);
				renderer.renderAnimations(animationCtx);
				renderer.renderDrag(dragCtx);
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

	const runtime: BoardRuntime = {
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

			controller = createInteractionController(runtime);
			inputAdapter = createInputAdapter({
				element: container,
				getGeometry: () => geometry,
				controller
			});

			// Create animator
			animator = createAnimator({ schedule: () => scheduler.schedule() });

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
				transientVisuals.dragPointer = null; // clear transient visuals
				animator?.stop(); // stop any active animation
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
			// Capture prevIds before commit
			const prevIds = boardState.ids.slice() as Int16Array;

			// Commit the move
			const appliedMove = moveReducer(boardState, invalidationWriter, move, opts);

			// Compute animation plan and start animator
			const plan = computeAnimationPlan(prevIds, boardState.ids);
			if (plan.tracks.length > 0 && animator) {
				animator.start(plan);
			}

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
			// Throw if a drag is active — caller must cancelInteraction() first.
			if (interactionState.dragSession !== null) {
				throw new Error(
					'BoardRuntime.select: cannot select while a drag session is active. Call cancelInteraction() first.'
				);
			}

			const newSq: Square | null = sq === null ? null : toValidSquare(sq);
			const prevSq = interactionState.selectedSquare;

			// Always synchronize all interaction fields atomically.
			// selectedSquare
			setSelectedSquareReducer(interactionState, sq);
			// destinations: derived from movability policy for the new square (pure lookup, no piece check)
			setDestinationsReducer(
				interactionState,
				newSq !== null ? getActiveDestinationsHelper(viewState, newSq) : null
			);
			// dragSession is already null (guarded above); clear explicitly for clarity
			setDragSessionReducer(interactionState, null);
			// currentTarget
			setCurrentTargetReducer(interactionState, null);

			// Return true if selectedSquare changed (consistent with prior contract)
			return prevSq !== newSq;
		},

		dragStart(from: Square, point: BoardPoint): boolean {
			// Strict lifecycle contract:
			// 1. No drag must already be active.
			// 2. selectedSquare must already equal from — controller calls select(from) first.
			if (interactionState.dragSession !== null) {
				throw new Error('BoardRuntime.dragStart: drag already active.');
			}
			if (interactionState.selectedSquare !== from) {
				throw new Error(
					`BoardRuntime.dragStart: selectedSquare (${interactionState.selectedSquare}) !== from (${from}). Call select(from) before dragStart(from).`
				);
			}
			const session: DragSession = { fromSquare: from };
			setDragSessionReducer(interactionState, session);
			setCurrentTargetReducer(interactionState, null);
			transientVisuals.dragPointer = point; // initialize drag visual immediately
			// Drag started: source piece moves from piecesRoot to dragRoot.
			markDirtyLayer(invalidationState, DirtyLayer.Drag | DirtyLayer.Pieces);
			if (mounted) scheduler.schedule();
			return true;
		},

		setCurrentTarget(target: Square | null): boolean {
			return setCurrentTargetReducer(interactionState, target);
		},

		dropTo(to: Square | null): Move | null {
			// Determine the active source: prefer dragSession.fromSquare, fall back to selectedSquare.
			const source = interactionState.dragSession?.fromSquare ?? interactionState.selectedSquare;
			if (source === null) {
				// No active interaction — nothing to complete.
				return null;
			}

			if (to !== null && isMoveAttemptAllowedHelper(boardState, viewState, source, to)) {
				// Capture whether this was a drag-drop completion before clearing state
				const wasDragCompletion = interactionState.dragSession !== null;

				// Capture prevIds before commit
				const prevIds = boardState.ids.slice() as Int16Array;

				// Legal completion: apply move, clear all interaction.
				const appliedMove = moveReducer(boardState, invalidationWriter, { from: source, to });
				clearInteractionReducer(interactionState);
				transientVisuals.dragPointer = null; // clear transient visuals

				// Decide animation: skip for drag-drop, animate for non-drag
				if (wasDragCompletion) {
					// Skip animation for drag-drop completion
				} else {
					// Compute animation plan and start animator for non-drag completion
					const plan = computeAnimationPlan(prevIds, boardState.ids);
					if (plan.tracks.length > 0 && animator) {
						animator.start(plan);
					}
				}

				// moveReducer already marked DirtyLayer.Pieces (with squares) via invalidationWriter.
				// OR in DirtyLayer.Drag directly to avoid clearing those squares.
				invalidationState.layers |= DirtyLayer.Drag;
				if (mounted) {
					scheduler.schedule();
				}
				return appliedMove;
			}

			// Illegal completion — outcome is mode-dependent:
			if (interactionState.dragSession !== null) {
				// Lifted-piece mode: clear dragSession + currentTarget, keep selectedSquare + destinations.
				// The piece snaps back to its source square.
				// The user can retry by releasing on a different target.
				setDragSessionReducer(interactionState, null);
				setCurrentTargetReducer(interactionState, null);
				transientVisuals.dragPointer = null; // clear transient visuals
				// Drag cleared: source piece returns to piecesRoot, dragRoot empties.
				markDirtyLayer(invalidationState, DirtyLayer.Drag | DirtyLayer.Pieces);
				if (mounted) scheduler.schedule();
			} else {
				// Release-targeting mode: clear all interaction.
				// The selection is gone; the user must re-select to try again.
				clearInteractionReducer(interactionState);
			}
			return null;
		},

		cancelInteraction(): boolean {
			// Cancel rule:
			// Clear dragSession + currentTarget only. Keep selectedSquare + destinations.
			// This returns to "piece selected" state, not "no interaction" state.
			// Use select(null) to fully deselect.
			const wasDragging = interactionState.dragSession !== null;
			const a = setDragSessionReducer(interactionState, null);
			const b = setCurrentTargetReducer(interactionState, null);
			transientVisuals.dragPointer = null; // clear transient visuals
			// Only mark drag dirty if a drag was actually active — currentTarget-only
			// changes do not affect drag rendering.
			if (wasDragging && mounted) {
				markDirtyLayer(invalidationState, DirtyLayer.Drag | DirtyLayer.Pieces);
				scheduler.schedule();
			}
			return a || b;
		},

		notifyDragMove(point: BoardPoint | null): void {
			// Only update transient visuals and schedule render if a drag is active
			if (interactionState.dragSession === null) return;
			transientVisuals.dragPointer = point;
			markDirtyLayer(invalidationState, DirtyLayer.Drag);
			if (mounted) {
				scheduler.schedule();
			}
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

		getInteractionSnapshot(): InteractionSnapshot {
			return {
				board: {},
				view: {},
				interaction: {
					selectedSquare: interactionState.selectedSquare,
					destinations: interactionState.destinations,
					currentTarget: interactionState.currentTarget,
					dragSession:
						interactionState.dragSession !== null
							? { fromSquare: interactionState.dragSession.fromSquare }
							: null
				}
			};
		},

		canStartMoveFrom(from: Square): boolean {
			return canStartMoveFromHelper(boardState, viewState, from);
		},

		isMoveAttemptAllowed(from: Square, to: Square): boolean {
			return isMoveAttemptAllowedHelper(boardState, viewState, from, to);
		},

		destroy(): void {
			if (destroyed) return; // idempotent

			inputAdapter?.destroy();
			inputAdapter = null;
			controller = null;

			animator?.stop();
			animator = null;

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

	/**
	 * Compute animation plan from previous and next piece id arrays.
	 * Detects pieces that moved between squares.
	 */
	function computeAnimationPlan(prevIds: Int16Array, nextIds: Int16Array): AnimationPlan {
		// Build id->square maps for valid ids only (id > 0)
		const prevMap = new Map<number, number>();
		const nextMap = new Map<number, number>();

		for (let i = 0; i < 64; i++) {
			const pid = prevIds[i];
			if (pid > 0) prevMap.set(pid, i);
			const nid = nextIds[i];
			if (nid > 0) nextMap.set(nid, i);
		}

		// Collect movers: id present in both maps with changed square
		const movers: Array<{ id: number; fromSq: Square; toSq: Square }> = [];
		for (const [id, fromIndex] of prevMap) {
			const toIndex = nextMap.get(id);
			if (toIndex !== undefined && toIndex !== fromIndex) {
				movers.push({ id, fromSq: fromIndex as Square, toSq: toIndex as Square });
			}
		}

		return {
			tracks: movers.map((m) => ({
				pieceId: m.id,
				fromSq: m.fromSq,
				toSq: m.toSq,
				effect: 'move' as const
			})),
			duration: 180
		};
	}

	return runtime;
}
