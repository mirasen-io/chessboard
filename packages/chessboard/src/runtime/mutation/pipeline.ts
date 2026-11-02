import { ExtensionSystem } from '../../extensions/types/main.js';
import { Layout, LayoutSnapshot } from '../../layout/types.js';
import { MutationPipe, MutationPipeline } from '../../mutation/types.js';
import { RenderSystem } from '../../render/types.js';
import { RuntimeState, RuntimeStateSnapshot } from '../../state/types.js';
import { RuntimeMutationPayloadByCause } from './types.js';

export interface RuntimeMutationPipelineContext {
	readonly state: RuntimeState;
	readonly layout: Layout;
	readonly renderSystem: RenderSystem;
	readonly extensionSystem: ExtensionSystem;
}

export type RuntimeMutationPipeline = MutationPipeline<
	RuntimeMutationPayloadByCause,
	RuntimeMutationPipelineContext
>;

export interface RuntimeMutationPipeContextPrevious {
	readonly state: RuntimeStateSnapshot;
	readonly layout: LayoutSnapshot;
}

export interface RuntimeMutationPipeContext {
	previous: RuntimeMutationPipeContextPrevious | null;
	current: RuntimeMutationPipelineContext;
}

export type RuntimeMutationPipe = MutationPipe<
	RuntimeMutationPayloadByCause,
	RuntimeMutationPipeContext
>;
