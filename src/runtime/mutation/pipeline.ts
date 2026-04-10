import { ExtensionSystem } from '../../extensions/types';
import { Layout, LayoutSnapshot } from '../../layout/types';
import { MutationPipe, MutationPipeline } from '../../mutation/types';
import { RenderSystem } from '../../render/types';
import { RuntimeState, RuntimeStateSnapshot } from '../../state/types';
import { TransientVisuals, TransientVisualsSnapshot } from '../../transientVisuals/types';
import { RuntimeMutationPayloadByCause } from './types';

export interface RuntimeMutationPipelineContext {
	readonly state: RuntimeState;
	readonly layout: Layout;
	readonly transientVisuals: TransientVisuals;
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
	readonly transientVisuals: TransientVisualsSnapshot;
}

export interface RuntimeMutationPipeContext {
	previous: RuntimeMutationPipeContextPrevious | null;
	current: RuntimeMutationPipelineContext;
}

export type RuntimeMutationPipe = MutationPipe<
	RuntimeMutationPayloadByCause,
	RuntimeMutationPipeContext
>;
