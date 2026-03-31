import { createMutationPipeline } from '../../state/mutation/pipeline';
import type { BoardRuntimeStateInternal } from '../types';
import { clearIfPieceInInteractionChanged } from './interaction';
import type { BoardRuntimeMutationCause } from './mutation';
import type {
	BoardRuntimeMuitationPipe,
	BoardRuntimeMutationPipeline,
	BoardRuntimeStateChangeContext,
	BoardRuntimeStateChangeContextPrevious
} from './types';

function buildPreviousContext(
	internalState: BoardRuntimeStateInternal
): BoardRuntimeStateChangeContextPrevious {
	return {
		state: {
			board: internalState.state.board.getSnapshot(),
			view: internalState.state.view.getSnapshot(),
			interaction: internalState.state.interaction.getSnapshot(),
			change: {
				lastMove: internalState.state.change.lastMove
			}
		}
	};
}

export function createBoardRuntimeMutationPipeline(): BoardRuntimeMutationPipeline {
	let previousContext: BoardRuntimeStateChangeContextPrevious | null = null;
	// Construct the pipes
	const pipes: BoardRuntimeMuitationPipe[] = [
		// State phase: board mutateed -> view -> interaction
		// Interaction
		clearIfPieceInInteractionChanged
	];

	const basicPipeline = createMutationPipeline<
		BoardRuntimeStateChangeContext,
		BoardRuntimeMutationCause
	>(pipes);
	return {
		getSession() {
			return basicPipeline.getSession();
		},

		addMutation: basicPipeline.addMutation,

		run(currentContext): boolean {
			const pipelineContext: BoardRuntimeStateChangeContext = {
				previousContext,
				currentContext
			};
			let didRun = false;
			try {
				didRun = basicPipeline.run(pipelineContext);
			} finally {
				if (didRun) {
					previousContext = buildPreviousContext(currentContext);
				}
			}
			return didRun;
		}
	};
}

// const stateChangePipeline = createBoardRuntimeStateChangePipeline([
// 	/**
// 	 * Derived: Board state mutations
// 	 */
// 	(ctx, causes, addMutation) => {
// 		const call = [causes.has('board.reducer.setBoardPosition')].some(Boolean);
// 		if (!call) return;
// 		lastMove = null;
// 		addMutation('boardRuntime.reducer.setLastMove', true);
// 	},
// 	/**
// 	 * Derived: View state mutations
// 	 */
// 	/**
// 	 * Derived: Layout state mutations
// 	 */
// 	/**
// 	 * Derived: Interaction state mutations
// 	 */
// 	(ctx, causes, addMutation) => {
// 		const call = [causes.has('board.reducer.setBoardPosition')].some(Boolean);
// 		if (!call) return;
// 		addMutation('interaction.reducer.clearInteraction', clearInteractionReducer(interactionState));
// 	},
// 	/**
// 	 * Derived: Interaction state mutations
// 	 */
// 	/**
// 	 * Derived: Transient visuals state mutations
// 	 */
// 	(ctx, causes, addMutation) => {
// 		const call = [causes.has('interaction.reducer.clearInteraction')].some(Boolean);
// 		if (!call) return;
// 		transientVisuals.dragPointer = null;
// 		addMutation('transientVisuals.setDragPointer', true);
// 	},
// 	/**
// 	 * Extension updates
// 	 */
// 	() => {
// 		updateExtensions();
// 	},
// 	/**
// 	 * Render and animation scheduling
// 	 */
// 	(ctx, causes) => {
// 		const call = [causes.has('board.reducer.setBoardPosition')].some(Boolean);
// 		if (!call) return;
// 		animator?.stop();
// 	},
// 	() => {
// 		scheduleIfAnythingDirty();
// 	}
// ]);
