import { ExtensionAnimationController } from '../basic/animation';
import { ExtensionRuntimeSurfaceCommands } from './commands';
import { ExtensionRuntimeSurfaceEvents } from './events';
import { ExtensionRuntimeSurfaceTransientVisuals } from './transient-visuals';

export interface ExtensionRuntimeSurface {
	readonly commands: ExtensionRuntimeSurfaceCommands;
	readonly animation: ExtensionAnimationController;
	readonly events: ExtensionRuntimeSurfaceEvents;
	readonly transientVisuals: ExtensionRuntimeSurfaceTransientVisuals;
}
