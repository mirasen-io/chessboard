import { createMutationPipeline } from '../../mutation/pipeline';
import { layoutRefreshGeometryPipe } from './layout';
import {
	BoardRuntimeMutationPipe,
	BoardRuntimeMutationPipeContext,
	BoardRuntimeMutationPipeContextPrevious,
	BoardRuntimeMutationPipeline,
	BoardRuntimeMutationPipelineContext
} from './pipeline';
import { BoardRuntimeMutationPayloadByCause } from './types';

function buildPreviousContext(
	current: BoardRuntimeMutationPipelineContext
): NonNullable<BoardRuntimeMutationPipeContext['previous']> {
	return {
		state: current.state.getSnapshot(),
		layout: current.layout.getSnapshot()
	};
}

export function createBoardRuntimeMutationPipeline(): BoardRuntimeMutationPipeline {
	let previousContext: BoardRuntimeMutationPipeContextPrevious | null = null;
	// Construct the pipes
	const pipes: BoardRuntimeMutationPipe[] = [layoutRefreshGeometryPipe];

	const basicPipeline = createMutationPipeline<
		BoardRuntimeMutationPayloadByCause,
		BoardRuntimeMutationPipeContext
	>(pipes);
	return {
		getSession() {
			return basicPipeline.getSession();
		},

		addMutation: basicPipeline.addMutation,

		run(currentContext): boolean {
			const pipelineContext: BoardRuntimeMutationPipeContext = {
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
