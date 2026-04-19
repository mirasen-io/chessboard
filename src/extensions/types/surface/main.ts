import { ExtensionAnimationController } from '../basic/animation.js';
import { ExtensionRuntimeSurfaceCommands } from './commands.js';
import { ExtensionRuntimeSurfaceEvents } from './events.js';
import { ExtensionRuntimeSurfaceTransientVisuals } from './transient-visuals.js';

export interface ExtensionRuntimeSurface {
	readonly commands: ExtensionRuntimeSurfaceCommands;
	readonly animation: ExtensionAnimationController;
	readonly events: ExtensionRuntimeSurfaceEvents;
	readonly transientVisuals: ExtensionRuntimeSurfaceTransientVisuals;
}
