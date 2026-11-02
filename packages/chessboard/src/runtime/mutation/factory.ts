import { createMutationPipeline } from '../../mutation/pipeline.js';
import { extensionSystemUpdatePipe } from './extension-update.js';
import { reconcileInteractionSelectionAfterBoardStateChange } from './interaction.js';
import { clearLastMoveOnBoardSetPosition, updateLastMoveOnBoardMove } from './last-move.js';
import { layoutRefreshGeometryPipe } from './layout.js';
import {
	RuntimeMutationPipe,
	RuntimeMutationPipeContext,
	RuntimeMutationPipeContextPrevious,
	RuntimeMutationPipeline,
	RuntimeMutationPipelineContext
} from './pipeline.js';
import { requestRenderPipe } from './request-render.js';
import { RuntimeMutationPayloadByCause } from './types.js';

function buildPreviousContext(
	current: RuntimeMutationPipelineContext
): NonNullable<RuntimeMutationPipeContext['previous']> {
	return {
		state: current.state.getSnapshot(),
		layout: current.layout.getSnapshot()
	};
}

export function createRuntimeMutationPipeline(): RuntimeMutationPipeline {
	let previousContext: RuntimeMutationPipeContextPrevious | null = null;
	// Construct the pipes
	const pipes: RuntimeMutationPipe[] = [
		updateLastMoveOnBoardMove,
		clearLastMoveOnBoardSetPosition,
		reconcileInteractionSelectionAfterBoardStateChange,
		layoutRefreshGeometryPipe,
		extensionSystemUpdatePipe,
		requestRenderPipe
	];

	const basicPipeline = createMutationPipeline<
		RuntimeMutationPayloadByCause,
		RuntimeMutationPipeContext
	>(pipes);
	return {
		getSession() {
			return basicPipeline.getSession();
		},

		addMutation: basicPipeline.addMutation,

		run(currentContext): boolean {
			const pipelineContext: RuntimeMutationPipeContext = {
				previous: previousContext,
				current: currentContext
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
