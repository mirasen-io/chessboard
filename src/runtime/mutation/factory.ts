import { createMutationPipeline } from '../../mutation/pipeline';
import { extensionSystemUpdatePipe } from './extensionUpdate';
import { reconcileInteractionSelectionAfterBoardStateChange } from './interaction';
import { layoutRefreshGeometryPipe } from './layout';
import {
	RuntimeMutationPipe,
	RuntimeMutationPipeContext,
	RuntimeMutationPipeContextPrevious,
	RuntimeMutationPipeline,
	RuntimeMutationPipelineContext
} from './pipeline';
import { requestRenderPipe } from './requestRender';
import { RuntimeMutationPayloadByCause } from './types';

function buildPreviousContext(
	current: RuntimeMutationPipelineContext
): NonNullable<RuntimeMutationPipeContext['previous']> {
	return {
		state: current.state.getSnapshot(),
		layout: current.layout.getSnapshot(),
		transientVisuals: current.transientVisuals.getSnapshot()
	};
}

export function createRuntimeMutationPipeline(): RuntimeMutationPipeline {
	let previousContext: RuntimeMutationPipeContextPrevious | null = null;
	// Construct the pipes
	const pipes: RuntimeMutationPipe[] = [
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
