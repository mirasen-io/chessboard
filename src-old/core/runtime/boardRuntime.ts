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

import assert from '@ktarmyshov/assert';
import type { Animator } from '../animation/animator';
import { createAnimator } from '../animation/animator';
import type { AnimationPlan } from '../animation/types';
import {
	type BoardRuntimeStateChangeContextCurrent,
	createBoardRuntimeStateChangePipeline
} from '../change/runtime';
import type {
	BoardExtensionDefinitionInternal,
	BoardExtensionMounted,
	BoardExtensionRenderContext,
	BoardExtensionUpdateContext
} from '../extensions/types';
import { isInteractionTargetingActive } from '../helpers/interaction';
import type { InputAdapter } from '../input/inputAdapter';
import { createInputAdapter } from '../input/inputAdapter';
import type { InteractionController } from '../input/interactionController';
import { createInteractionController } from '../input/interactionController';
import { makeRenderGeometry } from '../renderer/geometry';
import type { BoardPoint, Renderer, RenderGeometry, TransientVisualState } from '../renderer/types';
import {
	createExtensionInvalidationWriter,
	createInvalidationState,
	createInvalidationWriter,
	getExtensionInvalidationSnapshot,
	getInvalidationSnapshot,
	initializeExtensionInvalidation
} from '../scheduler/invalidationState';
import { clearDirtyAll, markDirtyLayer } from '../scheduler/reducers';
import { createScheduler, type Scheduler } from '../scheduler/scheduler';
import { DirtyLayer, InvalidationWriter } from '../scheduler/types';
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
	BoardStateSnapshot,
	ColorInput,
	Move,
	MoveInput,
	PositionInput,
	Square,
	SquareInput
} from '../state/boardTypes';
import { toValidSquare } from '../state/coords';
import {
	clearActiveInteraction,
	clearInteraction as clearInteractionReducer,
	setCurrentTarget as setCurrentTargetReducer,
	setDestinations as setDestinationsReducer,
	setDragSession as setDragSessionReducer,
	setReleaseTargetingActive as setReleaseTargetingActiveReducer,
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
		readonly releaseTargetingActive: boolean;
	};
}

export interface BoardRuntimeInitOptions {
	renderer: Renderer;
	board?: BoardStateInitOptions;
	view?: ViewStateInitOptions;
	extensions?: BoardExtensionDefinitionInternal[];
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
	// beginSourceInteraction: atomic source-entry transition.
	// Synchronizes selectedSquare + destinations + drag entry in one call.
	// Does not require prior select(from).
	// May start drag or remain in selection-only mode depending on canStartMoveFrom result.
	// Accepts initial pointer position to initialize drag visual immediately.
	beginSourceInteraction(from: Square, point: BoardPoint): boolean;
	/**
	 * Start release-targeting mode on the pressed square.
	 * Sets releaseTargetingActive = true, clears dragSession, sets currentTarget = pressed square.
	 * The selectedSquare remains the source fact.
	 */
	startReleaseTargeting(target: Square, point: BoardPoint | null): boolean;
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
	commitTo(to: Square | null): Move | null;
	// cancelInteraction: clear active interaction mode and currentTarget, preserve selection context.
	// Clears dragSession, currentTarget, and releaseTargetingActive.
	// Keeps selectedSquare + destinations.
	cancelInteraction(): boolean;
	/**
	 * Notify runtime of drag pointer movement for visual updates.
	 * Updates drag-related transient state and triggers any required invalidation while piece drag is active.
	 */
	notifyDragMove(target: Square | null, point: BoardPoint | null): void;
	/**
	 * Notify runtime of release-targeting pointer movement for visual updates.
	 * Updates release-targeting transient state and triggers any required invalidation while release targeting is active.
	 * Note: point parameter reserved for future use; currently unused.
	 */
	notifyReleaseTargetingMove(target: Square | null, point: BoardPoint | null): void;
	// Controller-facing snapshot accessor — curated, read-only, grouped by origin.
	getInteractionSnapshot(): InteractionSnapshot;
	getBoardSnapshot(): BoardStateSnapshot;
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

	// Runtime-owned move-derived context
	let lastMove: Move | null = null;

	// Runtime-owned layout version tracking
	let layoutVersion = 0;
	let lastUpdatedLayoutVersion = 0;

	// Validate and store extension definitions
	const extensions = opts.extensions ?? [];
	const seenIds = new Set<string>();
	for (const ext of extensions) {
		if (seenIds.has(ext.id)) {
			throw new Error(`BoardRuntime: duplicate extension id '${ext.id}'`);
		}
		seenIds.add(ext.id);
	}

	// Extension lifecycle state
	const mountedExtensions = new Map<string, BoardExtensionMounted<unknown>>();
	const extensionWriters = new Map<string, InvalidationWriter>();

	// Initialize extension invalidation buckets
	for (const ext of extensions) {
		initializeExtensionInvalidation(invalidationState, ext.id);
		const writer = createExtensionInvalidationWriter(invalidationState, ext.id);
		extensionWriters.set(ext.id, writer);
	}

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
						dragSession: interactionState.dragSession,
						releaseTargetingActive: interactionState.releaseTargetingActive
					},
					transientVisuals,
					board: boardSnapshot,
					geometry
				};

				// Call split renderer methods
				renderer.renderBoard(boardCtx);
				renderer.renderAnimations(animationCtx);
				renderer.renderDrag(dragCtx);

				// Extension rendering
				for (const [extId, mounted] of mountedExtensions) {
					const extInvalidation = getExtensionInvalidationSnapshot(invalidationState, extId);
					if (extInvalidation.layers !== 0) {
						const renderCtx: BoardExtensionRenderContext = {
							board: boardSnapshot,
							view: {
								orientation: viewState.orientation,
								movability: viewState.movability
							},
							interaction: {
								selectedSquare: interactionState.selectedSquare,
								destinations: interactionState.destinations,
								dragSession: interactionState.dragSession,
								currentTarget: interactionState.currentTarget,
								releaseTargetingActive: interactionState.releaseTargetingActive
							},
							geometry,
							invalidation: extInvalidation
						};
						mounted.renderBoard(renderCtx);
					}
				}
			}
		},
		getBoardSnapshot: () => getBoardStateSnapshot(boardState),
		getInvalidationSnapshot: () => getInvalidationSnapshot(invalidationState),
		clearDirty: () => clearDirtyAll(invalidationState)
	});

	function scheduleIfAnythingDirty() {
		// Guard: only schedule if mounted and not destroyed
		if (!mounted || destroyed) return;
		if (invalidationState.layers !== 0) {
			scheduler.schedule();
			return;
		}
		// check extension buckets
		for (const extInvalidation of Object.values(invalidationState.extensions)) {
			if (extInvalidation.layers !== 0) {
				scheduler.schedule();
				return;
			}
		}
	}

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
		layoutVersion++;
		markDirtyLayer(invalidationState, DirtyLayer.Board | DirtyLayer.Pieces);
		updateExtensions();
		scheduleIfAnythingDirty();
	}

	/**
	 * Update all mounted extensions with current state.
	 * Extensions compute deltas and mark their own invalidation buckets.
	 * No-op if no extensions are mounted yet.
	 */
	function updateExtensions(): void {
		if (mountedExtensions.size === 0) return;

		const layoutChanged = layoutVersion !== lastUpdatedLayoutVersion;

		for (const [extId, mounted] of mountedExtensions) {
			const writer = extensionWriters.get(extId);
			if (!writer) continue;
			const updateCtx: BoardExtensionUpdateContext = {
				board: getBoardStateSnapshot(boardState),
				view: {
					orientation: viewState.orientation,
					movability: viewState.movability
				},
				interaction: {
					selectedSquare: interactionState.selectedSquare,
					destinations: interactionState.destinations,
					dragSession: interactionState.dragSession,
					currentTarget: interactionState.currentTarget,
					releaseTargetingActive: interactionState.releaseTargetingActive
				},
				lastMove,
				layoutVersion,
				layoutChanged,
				writer
			};
			mounted.update(updateCtx);
		}

		lastUpdatedLayoutVersion = layoutVersion;
	}

	/**
	 * Shared internal helper: commit a move and handle post-commit animation.
	 * Applies the move, updates lastMove, and starts animation if applicable.
	 * Does NOT call updateExtensions() or scheduleIfAnythingDirty() - callers must do this.
	 */
	function commitMove(move: MoveInput, opts?: MoveOptions, skipAnimation?: boolean): Move {
		// Capture prevIds before commit
		const prevIds = boardState.ids.slice() as Int16Array;

		// Commit the move
		const appliedMove = moveReducer(boardState, invalidationWriter, move, opts);

		// Update lastMove
		lastMove = appliedMove;

		// Compute animation plan and start animator (unless skipAnimation is true)
		if (!skipAnimation) {
			const plan = computeAnimationPlan(prevIds, boardState.ids);
			if (plan.tracks.length > 0 && animator) {
				animator.start(plan);
			}
		}

		return appliedMove;
	}

	/**
	 * Create change pipeline for board runtime.
	 * First derived state: Board -> View -> Layout -> Interaction -> Transient Visuals -> ...TBD
	 * Then extension updates,
	 * Then rendering and animation scheduling.
	 */
	const stateChangePipeline = createBoardRuntimeStateChangePipeline([
		/**
		 * Derived: Board state mutations
		 */
		(ctx, causes, addMutation) => {
			const call = [causes.has('board.reducer.setBoardPosition')].some(Boolean);
			if (!call) return;
			lastMove = null;
			addMutation('boardRuntime.reducer.setLastMove', true);
		},
		/**
		 * Derived: View state mutations
		 */
		/**
		 * Derived: Layout state mutations
		 */
		/**
		 * Derived: Interaction state mutations
		 */
		(ctx, causes, addMutation) => {
			const call = [causes.has('board.reducer.setBoardPosition')].some(Boolean);
			if (!call) return;
			addMutation(
				'interaction.reducer.clearInteraction',
				clearInteractionReducer(interactionState)
			);
		},
		/**
		 * Derived: Interaction state mutations
		 */
		/**
		 * Derived: Transient visuals state mutations
		 */
		(ctx, causes, addMutation) => {
			const call = [causes.has('interaction.reducer.clearInteraction')].some(Boolean);
			if (!call) return;
			transientVisuals.dragPointer = null;
			addMutation('transientVisuals.setDragPointer', true);
		},
		/**
		 * Extension updates
		 */
		() => {
			updateExtensions();
		},
		/**
		 * Render and animation scheduling
		 */
		(ctx, causes) => {
			const call = [causes.has('board.reducer.setBoardPosition')].some(Boolean);
			if (!call) return;
			animator?.stop();
		},
		() => {
			scheduleIfAnythingDirty();
		}
	]);

	function buildBoardRuntimeStateChangeContextCurrent(): BoardRuntimeStateChangeContextCurrent {
		return {
			board: boardState,
			view: viewState,
			interaction: interactionState,
			lastMove,
			layoutVersion,
			writer: invalidationWriter
		};
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

			// Mount extensions
			for (const ext of extensions) {
				const slots = renderer.allocateExtensionSlots(ext.id, ext.slots);
				// Verify all requested slots were allocated
				for (const slotName of ext.slots) {
					if (!slots[slotName]) {
						throw new Error(
							`BoardRuntime: failed to allocate '${slotName}' slot for extension '${ext.id}'`
						);
					}
				}
				const mountEnv = { slotRoots: slots };
				const mounted = ext.mount(mountEnv);
				mountedExtensions.set(ext.id, mounted);
			}

			// Start observing resize
			resizeObserver = new ResizeObserver(() => refreshGeometry());
			resizeObserver.observe(container);

			// Mark initial redraw and update extensions
			markDirtyLayer(invalidationState, DirtyLayer.All);
			updateExtensions();

			// Schedule initial render
			scheduleIfAnythingDirty();
		},

		setBoardPosition(input: PositionInput): boolean {
			stateChangePipeline.addMutation(
				'board.reducer.setBoardPosition',
				setBoardPositionReducer(boardState, invalidationWriter, input)
			);
			return stateChangePipeline.run(buildBoardRuntimeStateChangeContextCurrent());
		},

		setTurn(c: ColorInput): boolean {
			const changed = setTurnReducer(boardState, c);
			// No extension update needed for turn change alone
			return changed;
		},

		move(move: MoveInput, opts?: MoveOptions): Move {
			const appliedMove = commitMove(move, opts);
			updateExtensions();
			scheduleIfAnythingDirty();
			return appliedMove;
		},

		setOrientation(input: ColorInput): boolean {
			const changed = setOrientationReducer(viewState, invalidationWriter, input);
			if (changed) {
				layoutVersion++;
				updateExtensions();
				if (mounted) {
					// Recreate immutable geometry with new orientation
					geometry = makeRenderGeometry(boardSize!, viewState.orientation);
					scheduleIfAnythingDirty();
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
			// releaseTargetingActive
			setReleaseTargetingActiveReducer(interactionState, false);

			// Update extensions after synchronized interaction state change
			updateExtensions();
			scheduleIfAnythingDirty();

			// Return true if selectedSquare changed (consistent with prior contract)
			return prevSq !== newSq;
		},

		beginSourceInteraction(from: Square, point: BoardPoint): boolean {
			if (isInteractionTargetingActive(interactionState)) {
				throw new Error(
					'BoardRuntime.beginSourceInteraction: interaction targeting already active.'
				);
			}

			const changes = [
				setSelectedSquareReducer(interactionState, from),
				setDestinationsReducer(interactionState, getActiveDestinationsHelper(viewState, from)),
				setReleaseTargetingActiveReducer(interactionState, false)
			];

			const canStart = canStartMoveFromHelper(boardState, viewState, from);

			if (canStart) {
				changes.push(setCurrentTargetReducer(interactionState, from));
				const session: DragSession = { fromSquare: from };
				changes.push(setDragSessionReducer(interactionState, session));
				transientVisuals.dragPointer = point;
			} else {
				changes.push(setDragSessionReducer(interactionState, null));
				changes.push(setCurrentTargetReducer(interactionState, null));
				transientVisuals.dragPointer = null;
			}

			markDirtyLayer(invalidationState, DirtyLayer.Drag | DirtyLayer.Pieces);
			updateExtensions();
			scheduleIfAnythingDirty();
			return changes.some((changed) => changed);
		},

		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		startReleaseTargeting(target: Square, point: BoardPoint | null): boolean {
			assert(
				interactionState.selectedSquare !== null,
				'startReleaseTargeting: cannot start release targeting without a selected square'
			);

			setReleaseTargetingActiveReducer(interactionState, true);
			setDragSessionReducer(interactionState, null);
			setCurrentTargetReducer(interactionState, target);

			updateExtensions();
			scheduleIfAnythingDirty();
			return true;
		},

		commitTo(to: Square | null): Move | null {
			// Determine the active source: prefer dragSession.fromSquare, fall back to selectedSquare.
			const source = interactionState.dragSession?.fromSquare ?? interactionState.selectedSquare;
			if (source === null) {
				// No active interaction — nothing to complete.
				return null;
			}

			if (to !== null && isMoveAttemptAllowedHelper(boardState, viewState, source, to)) {
				// Capture whether this was a drag-drop completion before clearing state
				const wasDragCompletion = interactionState.dragSession !== null;

				// Legal completion: apply move via shared helper
				const appliedMove = commitMove({ from: source, to }, undefined, wasDragCompletion);

				// Clear all interaction state after move commit
				clearInteractionReducer(interactionState);
				transientVisuals.dragPointer = null;

				// moveReducer (called by commitMove) already marked DirtyLayer.Pieces (with squares) via invalidationWriter.
				// OR in DirtyLayer.Drag directly to avoid clearing those squares.
				invalidationState.layers |= DirtyLayer.Drag;

				// Update extensions and schedule render after all state mutations complete
				updateExtensions();
				scheduleIfAnythingDirty();

				return appliedMove;
			}

			// Illegal completion — outcome is mode-dependent:
			if (interactionState.dragSession !== null) {
				// Lifted-piece mode: clear dragSession + currentTarget, keep selectedSquare + destinations.
				// The piece snaps back to its source square.
				// The user can retry by releasing on a different target.
				setDragSessionReducer(interactionState, null);
				setCurrentTargetReducer(interactionState, null);
				setReleaseTargetingActiveReducer(interactionState, false);
				transientVisuals.dragPointer = null; // clear transient visuals
				// Drag cleared: source piece returns to piecesRoot, dragRoot empties.
				markDirtyLayer(invalidationState, DirtyLayer.Drag | DirtyLayer.Pieces);
			} else {
				// Release-targeting mode
				if (interactionState.currentTarget === interactionState.selectedSquare) {
					// Keep the selection
					setDragSessionReducer(interactionState, null);
					setCurrentTargetReducer(interactionState, null);
					setReleaseTargetingActiveReducer(interactionState, false);
				} else {
					clearInteractionReducer(interactionState);
				}
			}
			updateExtensions();
			scheduleIfAnythingDirty();
			return null;
		},

		cancelInteraction(): boolean {
			// Cancel rule:
			// Clear dragSession + currentTarget + releaseTargetingActive.
			// Keep selectedSquare + destinations.
			// This returns to "piece selected" state, not "no interaction" state.
			// Use select(null) to fully deselect.
			const wasDragging = interactionState.dragSession !== null;
			const changed = clearActiveInteraction(interactionState);
			transientVisuals.dragPointer = null; // clear transient visuals

			if (!changed) {
				return false;
			}

			if (wasDragging && mounted) {
				markDirtyLayer(invalidationState, DirtyLayer.Drag | DirtyLayer.Pieces);
			}

			updateExtensions();
			scheduleIfAnythingDirty();
			return true;
		},

		notifyDragMove(target: Square | null, point: BoardPoint | null): void {
			// Only update transient visuals and schedule render if a drag is active
			if (interactionState.dragSession === null) return;
			setCurrentTargetReducer(interactionState, target);
			transientVisuals.dragPointer = point;
			markDirtyLayer(invalidationState, DirtyLayer.Drag);
			updateExtensions();
			scheduleIfAnythingDirty();
		},

		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		notifyReleaseTargetingMove(target: Square | null, point: BoardPoint | null): void {
			// Note: point parameter currently unused, reserved for future use.
			// No separate transient target visual is tracked here; extensions derive from interaction state.
			if (!interactionState.releaseTargetingActive) return;
			setCurrentTargetReducer(interactionState, target);
			updateExtensions();
			scheduleIfAnythingDirty();
		},
		setMovability(m: Movability): boolean {
			const changed = setMovabilityReducer(viewState, m);
			if (changed) {
				updateExtensions();
				scheduleIfAnythingDirty();
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
							: null,
					releaseTargetingActive: interactionState.releaseTargetingActive
				}
			};
		},

		getBoardSnapshot(): BoardStateSnapshot {
			return getBoardStateSnapshot(boardState);
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

			// Unmount extensions
			for (const [extId, mounted] of mountedExtensions) {
				mounted.unmount();
				renderer.removeExtensionSlots(extId);
			}
			mountedExtensions.clear();
			extensionWriters.clear();

			// Clean up extension invalidation buckets
			for (const ext of extensions) {
				delete invalidationState.extensions[ext.id];
			}

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
