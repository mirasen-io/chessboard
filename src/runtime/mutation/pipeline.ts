import { ExtensionSystem } from '../../extensions/types';
import { Layout, LayoutSnapshot } from '../../layout/types';
import { MutationPipe, MutationPipeline } from '../../mutation/types';
import { Render } from '../../render/types';
import { BoardRuntimeState, BoardRuntimeStateSnapshot } from '../../state/types';
import { BoardRuntimeMutationPayloadByCause } from './types';

export interface BoardRuntimeMutationPipelineContext {
	readonly state: BoardRuntimeState;
	readonly layout: Layout;
	readonly render: Render;
	readonly extensions: ExtensionSystem;
}

export type BoardRuntimeMutationPipeline = MutationPipeline<
	BoardRuntimeMutationPayloadByCause,
	BoardRuntimeMutationPipelineContext
>;

export interface BoardRuntimeMutationPipeContextPrevious {
	readonly state: BoardRuntimeStateSnapshot;
	readonly layout: LayoutSnapshot;
}

export interface BoardRuntimeMutationPipeContext {
	previous: BoardRuntimeMutationPipeContextPrevious | null;
	current: BoardRuntimeMutationPipelineContext;
}

export type BoardRuntimeMutationPipe = MutationPipe<
	BoardRuntimeMutationPayloadByCause,
	BoardRuntimeMutationPipeContext
>;
